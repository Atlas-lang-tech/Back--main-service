import { ConflictException, NotFoundException } from '@nestjs/common';
import { CourseService } from './course.service.js';
import {
  createMockPrisma,
  createMockRedis,
  createMockRabbit,
  type MockPrisma,
  type MockRedis,
  type MockRabbit,
} from '../common/testing/mocks.js';
import { CreateCourseDto } from './dto/create.dto.js';

describe('CourseService', () => {
  let db: MockPrisma;
  let cache: MockRedis;
  let rabbit: MockRabbit;
  let service: CourseService;

  const dto: CreateCourseDto = {
    cid: 'c1',
    title: 'Course 1',
    description: 'desc',
    icon: 'icon',
    languageId: 1,
    languageLvlId: 2,
    categoryId: 3,
  };

  const course = { id: 10, ...dto, categoryId: 3, isFree: false };

  beforeEach(() => {
    db = createMockPrisma();
    cache = createMockRedis();
    rabbit = createMockRabbit();
    service = new CourseService(db as any, cache as any, rabbit as any);
  });

  describe('create', () => {
    it('creates a course, invalidates caches and publishes course.upserted', async () => {
      db.course.findUnique.mockResolvedValue(null);
      db.course.create.mockResolvedValue(course);

      const result = await service.create(dto);

      expect(result).toEqual(course);
      expect(db.course.create).toHaveBeenCalledTimes(1);
      expect(cache.del).toHaveBeenCalledWith('course:all');
      expect(cache.del).toHaveBeenCalledWith('course:10');
      expect(cache.del).toHaveBeenCalledWith('course:c1');
      expect(cache.del).toHaveBeenCalledWith('course:language-1');
      expect(cache.del).toHaveBeenCalledWith('course:category-3');
      expect(rabbit.publish).toHaveBeenCalledWith(
        'course.upserted',
        { courseId: 10, isFree: false, title: 'Course 1' },
        expect.any(String),
      );
    });

    it('throws ConflictException when cid already exists', async () => {
      db.course.findUnique.mockResolvedValue(course);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(db.course.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns cached value without hitting the DB', async () => {
      cache.get.mockResolvedValue(JSON.stringify([course]));

      const result = await service.findAll();

      expect(result).toEqual([course]);
      expect(db.course.findMany).not.toHaveBeenCalled();
    });

    it('reads from the DB and caches on a miss', async () => {
      cache.get.mockResolvedValue(null);
      db.course.findMany.mockResolvedValue([course]);

      const result = await service.findAll();

      expect(result).toEqual([course]);
      expect(cache.set).toHaveBeenCalledWith(
        'course:all',
        JSON.stringify([course]),
        3600,
      );
    });
  });

  describe('findOneById', () => {
    it('throws NotFoundException when missing', async () => {
      cache.get.mockResolvedValue(null);
      db.course.findUnique.mockResolvedValue(null);

      await expect(service.findOneById(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('caches the found course', async () => {
      cache.get.mockResolvedValue(null);
      db.course.findUnique.mockResolvedValue(course);

      const result = await service.findOneById(10);

      expect(result).toEqual(course);
      expect(cache.set).toHaveBeenCalledWith(
        'course:10',
        JSON.stringify(course),
        3600,
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when missing', async () => {
      db.course.findUnique.mockResolvedValue(null);

      await expect(service.update(10, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(db.course.update).not.toHaveBeenCalled();
    });

    it('updates and invalidates both old and new buckets', async () => {
      const oldCourse = { ...course, languageId: 1, categoryId: 3 };
      const newCourse = { ...course, languageId: 5, categoryId: 6 };
      db.course.findUnique.mockResolvedValue(oldCourse);
      db.course.update.mockResolvedValue(newCourse);

      const result = await service.update(10, { ...dto, languageId: 5 });

      expect(result).toEqual(newCourse);
      expect(cache.del).toHaveBeenCalledWith('course:language-1');
      expect(cache.del).toHaveBeenCalledWith('course:language-5');
      expect(cache.del).toHaveBeenCalledWith('course:category-6');
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when missing', async () => {
      db.course.findUnique.mockResolvedValue(null);

      await expect(service.delete(10)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(db.course.delete).not.toHaveBeenCalled();
    });

    it('deletes, invalidates caches and publishes course.deleted', async () => {
      db.course.findUnique.mockResolvedValue(course);
      db.course.delete.mockResolvedValue(course);

      await service.delete(10);

      expect(db.course.delete).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(cache.del).toHaveBeenCalledWith('course:all');
      expect(rabbit.publish).toHaveBeenCalledWith(
        'course.deleted',
        { courseId: 10 },
        expect.any(String),
      );
    });
  });
});

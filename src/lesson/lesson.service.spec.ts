import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { LessonService } from './lesson.service.js';
import {
  createMockPrisma,
  createMockRedis,
  type MockPrisma,
  type MockRedis,
} from '../common/testing/mocks.js';
import { CreateLessonDto } from './dto/create.dto.js';

describe('LessonService', () => {
  let db: MockPrisma;
  let cache: MockRedis;
  let service: LessonService;

  const dto: CreateLessonDto = {
    cid: 'l1',
    title: 'Lesson 1',
    description: 'desc',
    icon: 'icon',
    courseId: 7,
  };

  const lesson = { id: 100, ...dto, order: 0 };

  beforeEach(() => {
    db = createMockPrisma();
    cache = createMockRedis();
    service = new LessonService(db as any, cache as any);
  });

  describe('create', () => {
    it('assigns order 0 for the first lesson of a course', async () => {
      db.lesson.findUnique.mockResolvedValue(null);
      db.lesson.findFirst.mockResolvedValue(null); // nextOrder => 0
      db.lesson.create.mockResolvedValue(lesson);

      const result = await service.create(dto);

      expect(result).toEqual(lesson);
      expect(db.lesson.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 0, courseId: 7 }),
        }),
      );
      expect(cache.del).toHaveBeenCalledWith('lesson:course-7');
    });

    it('appends after the last lesson', async () => {
      db.lesson.findUnique.mockResolvedValue(null);
      db.lesson.findFirst.mockResolvedValue({ order: 4 }); // nextOrder => 5
      db.lesson.create.mockResolvedValue({ ...lesson, order: 5 });

      await service.create(dto);

      expect(db.lesson.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 5 }),
        }),
      );
    });

    it('throws ConflictException on duplicate cid', async () => {
      db.lesson.findUnique.mockResolvedValue(lesson);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(db.lesson.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns cached lessons without hitting the DB', async () => {
      cache.get.mockResolvedValue(JSON.stringify([lesson]));

      const result = await service.findAll(7);

      expect(result).toEqual([lesson]);
      expect(db.lesson.findMany).not.toHaveBeenCalled();
    });

    it('reads ordered lessons and caches on a miss', async () => {
      cache.get.mockResolvedValue(null);
      db.lesson.findMany.mockResolvedValue([lesson]);

      await service.findAll(7);

      expect(db.lesson.findMany).toHaveBeenCalledWith({
        where: { courseId: 7 },
        orderBy: { order: 'asc' },
      });
      expect(cache.set).toHaveBeenCalledWith(
        'lesson:course-7',
        JSON.stringify([lesson]),
        3600,
      );
    });
  });

  describe('findOneById', () => {
    it('throws NotFoundException when missing', async () => {
      cache.get.mockResolvedValue(null);
      db.lesson.findUnique.mockResolvedValue(null);

      await expect(service.findOneById(100)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('keeps order when course is unchanged', async () => {
      db.lesson.findUnique.mockResolvedValue(lesson);
      db.lesson.update.mockResolvedValue(lesson);

      await service.update(100, dto);

      expect(db.lesson.findFirst).not.toHaveBeenCalled(); // nextOrder not used
      expect(db.lesson.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 0 }),
        }),
      );
    });

    it('appends to the new course when courseId changes', async () => {
      db.lesson.findUnique.mockResolvedValue(lesson); // current courseId 7
      db.lesson.findFirst.mockResolvedValue({ order: 2 }); // nextOrder in course 9 => 3
      db.lesson.update.mockResolvedValue({ ...lesson, courseId: 9, order: 3 });

      await service.update(100, { ...dto, courseId: 9 });

      expect(db.lesson.findFirst).toHaveBeenCalled();
      expect(db.lesson.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 3 }),
        }),
      );
      // Both old and new course buckets invalidated.
      expect(cache.del).toHaveBeenCalledWith('lesson:course-7');
      expect(cache.del).toHaveBeenCalledWith('lesson:course-9');
    });

    it('throws NotFoundException when missing', async () => {
      db.lesson.findUnique.mockResolvedValue(null);

      await expect(service.update(100, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('reorder', () => {
    const existing = [
      { id: 1, cid: 'a' },
      { id: 2, cid: 'b' },
      { id: 3, cid: 'c' },
    ];

    it('throws NotFoundException when the course has no lessons', async () => {
      db.lesson.findMany.mockResolvedValue([]);

      await expect(service.reorder(7, [])).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws BadRequestException on length mismatch', async () => {
      db.lesson.findMany.mockResolvedValue(existing);

      await expect(service.reorder(7, [1, 2])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException on duplicate ids', async () => {
      db.lesson.findMany.mockResolvedValue(existing);

      await expect(service.reorder(7, [1, 2, 2])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when an id is not in the course', async () => {
      db.lesson.findMany.mockResolvedValue(existing);

      await expect(service.reorder(7, [1, 2, 99])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('parks at negative orders then writes the final order (two-pass)', async () => {
      db.lesson.findMany
        .mockResolvedValueOnce(existing) // initial fetch
        .mockResolvedValueOnce([]); // final ordered read
      db.lesson.update.mockResolvedValue({});

      await service.reorder(7, [3, 1, 2]);

      expect(db.$transaction).toHaveBeenCalledTimes(1);
      const updateCalls = db.lesson.update.mock.calls.map((c: any[]) => c[0]);
      // Pass 1: three negative parks (-1, -2, -3).
      expect(updateCalls.slice(0, 3)).toEqual([
        { where: { id: 3 }, data: { order: -1 } },
        { where: { id: 1 }, data: { order: -2 } },
        { where: { id: 2 }, data: { order: -3 } },
      ]);
      // Pass 2: final contiguous orders by array index.
      expect(updateCalls.slice(3)).toEqual([
        { where: { id: 3 }, data: { order: 0 } },
        { where: { id: 1 }, data: { order: 1 } },
        { where: { id: 2 }, data: { order: 2 } },
      ]);
      expect(cache.del).toHaveBeenCalledWith('lesson:course-7');
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when missing', async () => {
      db.lesson.findUnique.mockResolvedValue(null);

      await expect(service.delete(100)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(db.lesson.delete).not.toHaveBeenCalled();
    });

    it('deletes and invalidates caches', async () => {
      db.lesson.findUnique.mockResolvedValue(lesson);

      await service.delete(100);

      expect(db.lesson.delete).toHaveBeenCalledWith({ where: { id: 100 } });
      expect(cache.del).toHaveBeenCalledWith('lesson:course-7');
    });
  });
});

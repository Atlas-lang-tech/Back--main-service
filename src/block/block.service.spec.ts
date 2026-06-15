import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BlockService } from './block.service.js';
import { BlockType } from '../../generated/prisma/client.js';
import {
  createMockPrisma,
  createMockRedis,
  type MockPrisma,
  type MockRedis,
} from '../common/testing/mocks.js';
import { CreateBlockDto } from './dto/create-block.dto.js';
import { BlockItemDto } from './dto/block-item.dto.js';

describe('BlockService', () => {
  let db: MockPrisma;
  let cache: MockRedis;
  let service: BlockService;

  const markdownDto: CreateBlockDto = {
    type: BlockType.MARKDOWN,
    title: 'Intro',
    content: { text: '# Hello' },
  };

  beforeEach(() => {
    db = createMockPrisma();
    cache = createMockRedis();
    service = new BlockService(db as any, cache as any);
  });

  describe('findAllByLesson', () => {
    it('returns cached blocks without hitting the DB', async () => {
      cache.get.mockResolvedValue(JSON.stringify([{ id: 1 }]));

      const result = await service.findAllByLesson(50);

      expect(result).toEqual([{ id: 1 }]);
      expect(db.block.findMany).not.toHaveBeenCalled();
    });

    it('reads ordered blocks and caches on a miss', async () => {
      cache.get.mockResolvedValue(null);
      db.block.findMany.mockResolvedValue([{ id: 1, order: 0 }]);

      await service.findAllByLesson(50);

      expect(db.block.findMany).toHaveBeenCalledWith({
        where: { lessonId: 50 },
        orderBy: { order: 'asc' },
      });
      expect(cache.set).toHaveBeenCalledWith(
        'block:lesson-50',
        JSON.stringify([{ id: 1, order: 0 }]),
        3600,
      );
    });
  });

  describe('findOneById', () => {
    it('throws NotFoundException when missing', async () => {
      db.block.findUnique.mockResolvedValue(null);

      await expect(service.findOneById(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('throws NotFoundException when the lesson does not exist', async () => {
      db.lesson.findUnique.mockResolvedValue(null);

      await expect(service.create(50, markdownDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(db.block.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when content is invalid', async () => {
      db.lesson.findUnique.mockResolvedValue({ id: 50 });

      await expect(
        service.create(50, {
          type: BlockType.MARKDOWN,
          content: { text: 123 } as any,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(db.block.create).not.toHaveBeenCalled();
    });

    it('creates with the next order and invalidates the list cache', async () => {
      db.lesson.findUnique.mockResolvedValue({ id: 50 });
      db.block.findFirst.mockResolvedValue({ order: 2 }); // next => 3
      db.block.create.mockResolvedValue({ id: 9, order: 3 });

      const result = await service.create(50, markdownDto);

      expect(result).toEqual({ id: 9, order: 3 });
      expect(db.block.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 3, lessonId: 50 }),
        }),
      );
      expect(cache.del).toHaveBeenCalledWith('block:lesson-50');
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the block is missing', async () => {
      db.block.findUnique.mockResolvedValue(null);

      await expect(service.update(9, markdownDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('validates content and invalidates the owning lesson cache', async () => {
      db.block.findUnique.mockResolvedValue({ id: 9, lessonId: 50 });
      db.block.update.mockResolvedValue({ id: 9 });

      await service.update(9, markdownDto);

      expect(cache.del).toHaveBeenCalledWith('block:lesson-50');
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when the block is missing', async () => {
      db.block.findUnique.mockResolvedValue(null);

      await expect(service.delete(9)).rejects.toBeInstanceOf(NotFoundException);
      expect(db.block.delete).not.toHaveBeenCalled();
    });

    it('deletes and invalidates the owning lesson cache', async () => {
      db.block.findUnique.mockResolvedValue({ id: 9, lessonId: 50 });

      await service.delete(9);

      expect(db.block.delete).toHaveBeenCalledWith({ where: { id: 9 } });
      expect(cache.del).toHaveBeenCalledWith('block:lesson-50');
    });
  });

  describe('syncLesson', () => {
    const items: BlockItemDto[] = [
      { id: 2, type: BlockType.MARKDOWN, content: { text: 'b' } },
      { type: BlockType.MARKDOWN, content: { text: 'new' } },
    ];

    it('throws NotFoundException when the lesson does not exist', async () => {
      db.lesson.findUnique.mockResolvedValue(null);

      await expect(service.syncLesson(50, items)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws BadRequestException when an item content is invalid', async () => {
      db.lesson.findUnique.mockResolvedValue({ id: 50 });

      await expect(
        service.syncLesson(50, [
          { type: BlockType.MARKDOWN, content: { text: 1 } as any },
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when a payload id is not in the lesson', async () => {
      db.lesson.findUnique.mockResolvedValue({ id: 50 });
      db.block.findMany.mockResolvedValue([{ id: 1 }]); // existing has no id 2

      await expect(service.syncLesson(50, items)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('deletes missing blocks, updates kept ones, creates new ones (two-pass)', async () => {
      db.lesson.findUnique.mockResolvedValue({ id: 50 });
      db.block.findMany
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]) // existing
        .mockResolvedValueOnce([]); // final read
      db.block.deleteMany.mockResolvedValue({ count: 1 });
      db.block.update.mockResolvedValue({});
      db.block.create.mockResolvedValue({});

      await service.syncLesson(50, items);

      // id 1 is absent from the payload → deleted.
      expect(db.block.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
      });
      // Pass 1: surviving id 2 parked at -1.
      expect(db.block.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { order: -1 },
      });
      // Pass 2: id 2 gets final order 0; new block created at order 1.
      expect(db.block.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2 },
          data: expect.objectContaining({ order: 0 }),
        }),
      );
      expect(db.block.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ order: 1, lessonId: 50 }),
        }),
      );
      expect(cache.del).toHaveBeenCalledWith('block:lesson-50');
    });
  });
});

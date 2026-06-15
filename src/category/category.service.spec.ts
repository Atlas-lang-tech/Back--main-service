import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import {
  createMockPrisma,
  createMockRedis,
  type MockPrisma,
  type MockRedis,
} from '../common/testing/mocks.js';

describe('CategoryService', () => {
  let db: MockPrisma;
  let cache: MockRedis;
  let service: CategoryService;

  const category = { id: 1, name: 'Grammar' };

  beforeEach(() => {
    db = createMockPrisma();
    cache = createMockRedis();
    service = new CategoryService(db as any, cache as any);
  });

  describe('create', () => {
    it('creates and refreshes the :all cache', async () => {
      db.category.findUnique.mockResolvedValue(null);
      db.category.create.mockResolvedValue(category);
      db.category.findMany.mockResolvedValue([category]);

      const result = await service.create({ name: 'Grammar' });

      expect(result).toEqual(category);
      expect(cache.del).toHaveBeenCalledWith('category:all');
      expect(cache.set).toHaveBeenCalledWith(
        'category:all',
        JSON.stringify([category]),
        3600,
      );
    });

    it('throws ConflictException on duplicate name', async () => {
      db.category.findUnique.mockResolvedValue(category);

      await expect(service.create({ name: 'Grammar' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(db.category.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns cached value without hitting the DB', async () => {
      cache.get.mockResolvedValue(JSON.stringify([category]));

      const result = await service.findAll();

      expect(result).toEqual([category]);
      expect(db.category.findMany).not.toHaveBeenCalled();
    });

    it('reads from the DB and caches on a miss', async () => {
      cache.get.mockResolvedValue(null);
      db.category.findMany.mockResolvedValue([category]);

      const result = await service.findAll();

      expect(result).toEqual([category]);
      expect(cache.set).toHaveBeenCalledWith(
        'category:all',
        JSON.stringify([category]),
        3600,
      );
    });
  });

  describe('findOneById', () => {
    it('throws NotFoundException when missing', async () => {
      cache.get.mockResolvedValue(null);
      db.category.findUnique.mockResolvedValue(null);

      await expect(service.findOneById(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when missing', async () => {
      db.category.findUnique.mockResolvedValue(null);

      await expect(service.update(1, { name: 'New' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(db.category.update).not.toHaveBeenCalled();
    });

    it('updates and invalidates caches', async () => {
      db.category.findUnique.mockResolvedValue(category);
      db.category.update.mockResolvedValue({ ...category, name: 'New' });

      await service.update(1, { name: 'New' });

      expect(cache.del).toHaveBeenCalledWith('category:1');
      expect(cache.del).toHaveBeenCalledWith('category:all');
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when missing', async () => {
      db.category.findUnique.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toBeInstanceOf(NotFoundException);
      expect(db.category.delete).not.toHaveBeenCalled();
    });

    it('deletes and invalidates caches', async () => {
      db.category.findUnique.mockResolvedValue(category);

      await service.delete(1);

      expect(db.category.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(cache.del).toHaveBeenCalledWith('category:all');
    });
  });
});

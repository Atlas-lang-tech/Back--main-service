import { ConflictException, NotFoundException } from '@nestjs/common';
import { LanguageService } from './language.service.js';
import {
  createMockPrisma,
  createMockRedis,
  type MockPrisma,
  type MockRedis,
} from '../common/testing/mocks.js';

describe('LanguageService', () => {
  let db: MockPrisma;
  let cache: MockRedis;
  let service: LanguageService;

  const language = { id: 1, name: 'English', code: 'en' };

  beforeEach(() => {
    db = createMockPrisma();
    cache = createMockRedis();
    service = new LanguageService(db as any, cache as any);
  });

  describe('create', () => {
    it('creates and refreshes the :all cache', async () => {
      db.language.findUnique.mockResolvedValue(null);
      db.language.create.mockResolvedValue(language);
      db.language.findMany.mockResolvedValue([language]);

      const result = await service.create({ name: 'English', code: 'en' });

      expect(result).toEqual(language);
      expect(cache.del).toHaveBeenCalledWith('language:all');
      expect(cache.set).toHaveBeenCalledWith(
        'language:all',
        JSON.stringify([language]),
        3600,
      );
    });

    it('throws ConflictException on duplicate code', async () => {
      db.language.findUnique.mockResolvedValue(language);

      await expect(
        service.create({ name: 'English', code: 'en' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(db.language.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns cached value without hitting the DB', async () => {
      cache.get.mockResolvedValue(JSON.stringify([language]));

      const result = await service.findAll();

      expect(result).toEqual([language]);
      expect(db.language.findMany).not.toHaveBeenCalled();
    });

    it('reads from the DB and caches on a miss', async () => {
      cache.get.mockResolvedValue(null);
      db.language.findMany.mockResolvedValue([language]);

      await service.findAll();

      expect(cache.set).toHaveBeenCalledWith(
        'language:all',
        JSON.stringify([language]),
        3600,
      );
    });
  });

  describe('findOneById', () => {
    it('throws NotFoundException when missing', async () => {
      cache.get.mockResolvedValue(null);
      db.language.findUnique.mockResolvedValue(null);

      await expect(service.findOneById(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when missing', async () => {
      db.language.findUnique.mockResolvedValue(null);

      await expect(
        service.update(1, { name: 'X', code: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(db.language.update).not.toHaveBeenCalled();
    });

    it('updates and invalidates caches', async () => {
      db.language.findUnique.mockResolvedValue(language);
      db.language.update.mockResolvedValue({ ...language, name: 'X' });

      await service.update(1, { name: 'X', code: 'en' });

      expect(cache.del).toHaveBeenCalledWith('language:1');
      expect(cache.del).toHaveBeenCalledWith('language:all');
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when missing', async () => {
      db.language.findUnique.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toBeInstanceOf(NotFoundException);
      expect(db.language.delete).not.toHaveBeenCalled();
    });

    it('deletes and invalidates caches', async () => {
      db.language.findUnique.mockResolvedValue(language);

      await service.delete(1);

      expect(db.language.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(cache.del).toHaveBeenCalledWith('language:all');
    });
  });
});

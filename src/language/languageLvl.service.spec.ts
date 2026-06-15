import { ConflictException, NotFoundException } from '@nestjs/common';
import { LanguageLvlService } from './languageLvl.service.js';
import {
  createMockPrisma,
  createMockRedis,
  type MockPrisma,
  type MockRedis,
} from '../common/testing/mocks.js';

describe('LanguageLvlService', () => {
  let db: MockPrisma;
  let cache: MockRedis;
  let service: LanguageLvlService;

  const lvl = { id: 5, name: 'A1', languageId: 1 };

  beforeEach(() => {
    db = createMockPrisma();
    cache = createMockRedis();
    service = new LanguageLvlService(db as any, cache as any);
  });

  describe('create', () => {
    it('creates and invalidates the all + language buckets', async () => {
      db.languageLvl.findUnique.mockResolvedValue(null);
      db.languageLvl.create.mockResolvedValue(lvl);

      const result = await service.create({ name: 'A1' }, 1);

      expect(result).toEqual(lvl);
      expect(db.languageLvl.create).toHaveBeenCalledWith({
        data: { name: 'A1', languageId: 1 },
      });
      expect(cache.del).toHaveBeenCalledWith('language_lvl:all');
      expect(cache.del).toHaveBeenCalledWith('language_lvl:language-1');
    });

    it('throws ConflictException on duplicate name', async () => {
      db.languageLvl.findUnique.mockResolvedValue(lvl);

      await expect(service.create({ name: 'A1' }, 1)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(db.languageLvl.create).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('returns cached value without hitting the DB', async () => {
      cache.get.mockResolvedValue(JSON.stringify([lvl]));

      const result = await service.getAll();

      expect(result).toEqual([lvl]);
      expect(db.languageLvl.findMany).not.toHaveBeenCalled();
    });

    it('reads from the DB and caches on a miss', async () => {
      cache.get.mockResolvedValue(null);
      db.languageLvl.findMany.mockResolvedValue([lvl]);

      await service.getAll();

      expect(cache.set).toHaveBeenCalledWith(
        'language_lvl:all',
        JSON.stringify([lvl]),
        3600,
      );
    });
  });

  describe('findAllByLanguageId', () => {
    it('reads by language and caches on a miss', async () => {
      cache.get.mockResolvedValue(null);
      db.languageLvl.findMany.mockResolvedValue([lvl]);

      const result = await service.findAllByLanguageId(1);

      expect(result).toEqual([lvl]);
      expect(db.languageLvl.findMany).toHaveBeenCalledWith({
        where: { languageId: 1 },
      });
      expect(cache.set).toHaveBeenCalledWith(
        'language_lvl:language-1',
        JSON.stringify([lvl]),
        3600,
      );
    });
  });

  describe('findOneById', () => {
    it('throws NotFoundException when missing', async () => {
      cache.get.mockResolvedValue(null);
      db.languageLvl.findUnique.mockResolvedValue(null);

      await expect(service.findOneById(5)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when missing', async () => {
      db.languageLvl.findUnique.mockResolvedValue(null);

      await expect(service.update(5, { name: 'A2' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(db.languageLvl.update).not.toHaveBeenCalled();
    });

    it('updates and invalidates id, all and language buckets', async () => {
      db.languageLvl.findUnique.mockResolvedValue(lvl);
      db.languageLvl.update.mockResolvedValue({ ...lvl, name: 'A2' });

      await service.update(5, { name: 'A2' });

      expect(cache.del).toHaveBeenCalledWith('language_lvl:5');
      expect(cache.del).toHaveBeenCalledWith('language_lvl:all');
      expect(cache.del).toHaveBeenCalledWith('language_lvl:language-1');
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when missing', async () => {
      db.languageLvl.findUnique.mockResolvedValue(null);

      await expect(service.delete(5)).rejects.toBeInstanceOf(NotFoundException);
      expect(db.languageLvl.delete).not.toHaveBeenCalled();
    });

    it('deletes and invalidates caches', async () => {
      db.languageLvl.findUnique.mockResolvedValue(lvl);

      await service.delete(5);

      expect(db.languageLvl.delete).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(cache.del).toHaveBeenCalledWith('language_lvl:language-1');
    });
  });
});

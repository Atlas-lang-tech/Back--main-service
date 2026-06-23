import { NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service.js';
import {
  createMockPrisma,
  createMockRedis,
  type MockPrisma,
  type MockRedis,
} from '../common/testing/mocks.js';

describe('ProgressService', () => {
  let db: MockPrisma;
  let cache: MockRedis;
  let service: ProgressService;

  const userId = 'user-1';

  beforeEach(() => {
    db = createMockPrisma();
    cache = createMockRedis();
    service = new ProgressService(db as any, cache as any);
  });

  describe('markComplete', () => {
    it('upserts progress and invalidates the per-user course cache', async () => {
      db.lesson.findUnique.mockResolvedValue({ courseId: 7 });
      const row = { id: 1, userId, lessonId: 100, courseId: 7 };
      db.lessonProgress.upsert.mockResolvedValue(row);

      const result = await service.markComplete(userId, 100);

      expect(result).toEqual(row);
      expect(db.lessonProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_lessonId: { userId, lessonId: 100 } },
          create: { userId, lessonId: 100, courseId: 7 },
          update: {},
        }),
      );
      expect(cache.del).toHaveBeenCalledWith('progress:user-1:course-7');
    });

    it('is idempotent — repeat call still upserts (update: {})', async () => {
      db.lesson.findUnique.mockResolvedValue({ courseId: 7 });
      db.lessonProgress.upsert.mockResolvedValue({ id: 1 });

      await service.markComplete(userId, 100);
      await service.markComplete(userId, 100);

      expect(db.lessonProgress.upsert).toHaveBeenCalledTimes(2);
      expect(db.lessonProgress.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({ update: {} }),
      );
    });

    it('throws NotFound when the lesson does not exist', async () => {
      db.lesson.findUnique.mockResolvedValue(null);

      await expect(service.markComplete(userId, 999)).rejects.toThrow(
        NotFoundException,
      );
      expect(db.lessonProgress.upsert).not.toHaveBeenCalled();
    });
  });

  describe('getCourseProgress', () => {
    it('returns completed/total/lessonIds and caches the result on a miss', async () => {
      cache.get.mockResolvedValue(null);
      db.course.findUnique.mockResolvedValue({ id: 7 });
      db.lesson.count.mockResolvedValue(3);
      db.lessonProgress.findMany.mockResolvedValue([
        { lessonId: 100 },
        { lessonId: 101 },
      ]);

      const result = await service.getCourseProgress(userId, 7);

      expect(result).toEqual({
        completed: 2,
        total: 3,
        lessonIds: [100, 101],
      });
      expect(cache.set).toHaveBeenCalledWith(
        'progress:user-1:course-7',
        JSON.stringify(result),
        3600,
      );
    });

    it('returns the cached value without hitting the database', async () => {
      const cached = { completed: 1, total: 3, lessonIds: [100] };
      cache.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getCourseProgress(userId, 7);

      expect(result).toEqual(cached);
      expect(db.course.findUnique).not.toHaveBeenCalled();
      expect(db.lesson.count).not.toHaveBeenCalled();
    });

    it('throws NotFound when the course does not exist', async () => {
      cache.get.mockResolvedValue(null);
      db.course.findUnique.mockResolvedValue(null);

      await expect(service.getCourseProgress(userId, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAdminStats', () => {
    it('aggregates platform-wide completion stats and caches the result', async () => {
      const today = new Date();
      cache.get.mockResolvedValue(null);
      db.lessonProgress.count
        .mockResolvedValueOnce(42) // totalCompletions
        .mockResolvedValueOnce(9); // completionsLast7d
      db.lessonProgress.groupBy
        .mockResolvedValueOnce([{ userId: 'a' }, { userId: 'b' }]) // activeLearners
        .mockResolvedValueOnce([{ userId: 'a' }]) // activeToday
        .mockResolvedValueOnce([
          { courseId: 7, _count: { _all: 30 } },
          { courseId: 3, _count: { _all: 12 } },
        ]); // topCourses
      db.lessonProgress.findMany.mockResolvedValue([
        { completedAt: today },
        { completedAt: today },
      ]);
      db.course.findMany.mockResolvedValue([
        { id: 7, title: 'English B1' },
        { id: 3, title: 'Spanish A2' },
      ]);

      const result = await service.getAdminStats();

      expect(result.totalCompletions).toBe(42);
      expect(result.completionsLast7d).toBe(9);
      expect(result.activeLearners).toBe(2);
      expect(result.activeToday).toBe(1);
      expect(result.topCourses).toEqual([
        { courseId: 7, title: 'English B1', completions: 30 },
        { courseId: 3, title: 'Spanish A2', completions: 12 },
      ]);
      expect(result.dailyCompletions).toHaveLength(7);
      expect(
        result.dailyCompletions[result.dailyCompletions.length - 1].count,
      ).toBe(2);
      expect(cache.set).toHaveBeenCalledWith(
        'progress:admin-stats',
        JSON.stringify(result),
        300,
      );
    });

    it('returns the cached stats without hitting the database', async () => {
      const cached = {
        totalCompletions: 1,
        activeLearners: 1,
        activeToday: 0,
        completionsLast7d: 1,
        dailyCompletions: [],
        topCourses: [],
      };
      cache.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getAdminStats();

      expect(result).toEqual(cached);
      expect(db.lessonProgress.count).not.toHaveBeenCalled();
      expect(db.lessonProgress.groupBy).not.toHaveBeenCalled();
    });
  });
});

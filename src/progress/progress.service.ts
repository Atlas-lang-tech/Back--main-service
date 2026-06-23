import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';

export interface CourseProgress {
  completed: number;
  total: number;
  lessonIds: number[];
}

export interface ProgressStats {
  totalCompletions: number;
  activeLearners: number;
  activeToday: number;
  completionsLast7d: number;
  dailyCompletions: { date: string; count: number }[];
  topCourses: { courseId: number; title: string; completions: number }[];
}

/**
 * Tracks per-user lesson completion (lesson is the unit). Progress is a local
 * read-model keyed by the gateway's `userId` string — see `lessonProgress` in
 * the schema. Per-course reads are cached per user.
 */
@Injectable()
export class ProgressService {
  constructor(
    private db: PrismaService,
    private cache: RedisService,
  ) {}
  private cacheKey = `progress:`;
  private statsKey = `${this.cacheKey}admin-stats`;

  private courseKey(userId: string, courseId: number) {
    return `${this.cacheKey}${userId}:course-${courseId}`;
  }

  /** Marks a lesson complete for a user. Idempotent via @@unique([userId, lessonId]). */
  async markComplete(userId: string, lessonId: number) {
    const lesson = await this.db.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const progress = await this.db.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, courseId: lesson.courseId },
      update: {},
    });

    await this.cache.del(this.courseKey(userId, lesson.courseId));

    return progress;
  }

  /** Completed/total lesson counts for a user within a course. */
  async getCourseProgress(
    userId: string,
    courseId: number,
  ): Promise<CourseProgress> {
    const cacheKey = this.courseKey(userId, courseId);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as CourseProgress;
    }

    const course = await this.db.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const [total, completedRows] = await Promise.all([
      this.db.lesson.count({ where: { courseId } }),
      this.db.lessonProgress.findMany({
        where: { userId, courseId },
        select: { lessonId: true },
      }),
    ]);

    const result: CourseProgress = {
      completed: completedRows.length,
      total,
      lessonIds: completedRows.map((r) => r.lessonId),
    };

    await this.cache.set(cacheKey, JSON.stringify(result), 3600);

    return result;
  }

  /** Platform-wide completion analytics for the admin dashboard. Cached briefly. */
  async getAdminStats(): Promise<ProgressStats> {
    const cached = await this.cache.get(this.statsKey);
    if (cached) {
      return JSON.parse(cached) as ProgressStats;
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalCompletions,
      learners,
      todayLearners,
      completionsLast7d,
      recent,
      grouped,
    ] = await Promise.all([
      this.db.lessonProgress.count(),
      this.db.lessonProgress.groupBy({ by: ['userId'] }),
      this.db.lessonProgress.groupBy({
        by: ['userId'],
        where: { completedAt: { gte: startOfToday } },
      }),
      this.db.lessonProgress.count({
        where: { completedAt: { gte: sevenDaysAgo } },
      }),
      this.db.lessonProgress.findMany({
        where: { completedAt: { gte: sevenDaysAgo } },
        select: { completedAt: true },
      }),
      this.db.lessonProgress.groupBy({
        by: ['courseId'],
        _count: { _all: true },
        orderBy: { _count: { courseId: 'desc' } },
        take: 5,
      }),
    ]);

    const courseIds = grouped.map((g) => g.courseId);
    const courses = courseIds.length
      ? await this.db.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, title: true },
        })
      : [];
    const titleById = new Map(courses.map((c) => [c.id, c.title]));

    const topCourses = grouped.map((g) => ({
      courseId: g.courseId,
      title: titleById.get(g.courseId) ?? `Course #${g.courseId}`,
      completions: g._count._all,
    }));

    const result: ProgressStats = {
      totalCompletions,
      activeLearners: learners.length,
      activeToday: todayLearners.length,
      completionsLast7d,
      dailyCompletions: this.bucketByDay(
        recent.map((r) => r.completedAt),
        7,
      ),
      topCourses,
    };

    await this.cache.set(this.statsKey, JSON.stringify(result), 300);

    return result;
  }

  /** Counts dates into the last `days` daily UTC buckets (oldest → newest, zero-filled). */
  private bucketByDay(dates: Date[], days: number) {
    const buckets = new Map<string, number>();
    const now = new Date();
    const todayUtc = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(todayUtc - i * dayMs);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }

    for (const date of dates) {
      const key = new Date(date).toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
    }

    return [...buckets.entries()].map(([date, count]) => ({ date, count }));
  }
}

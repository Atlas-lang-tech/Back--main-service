import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';

export interface CourseProgress {
  completed: number;
  total: number;
  lessonIds: number[];
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
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';
import { ADMIN_ROLE, type UserContext } from './user.types.js';

/**
 * Decides whether a caller may read a course's lesson content.
 *
 * Rule: a course is accessible when it is free, the caller is an admin, or the
 * caller owns it (a row in the local `entitlement` read-model, populated from
 * billing's `course.purchased` events). Anonymous callers can only reach free
 * courses. The ownership decision is cached in Redis per (user, course) and
 * invalidated when a purchase arrives.
 */
@Injectable()
export class AccessService {
  constructor(
    private db: PrismaService,
    private cache: RedisService,
  ) {}

  private entitlementKey(userId: string, courseId: number) {
    return `access:${userId}:${courseId}`;
  }

  /** Throws ForbiddenException if the user may not read this lesson's blocks. */
  async canAccessLesson(
    user: UserContext | undefined,
    lessonId: number,
  ): Promise<void> {
    const lesson = await this.db.lesson.findUnique({
      where: { id: lessonId },
      select: { course: { select: { id: true, isFree: true } } },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const allowed = await this.canAccessCourse(user, lesson.course);
    if (!allowed) {
      throw new ForbiddenException('You do not have access to this course');
    }
  }

  private async canAccessCourse(
    user: UserContext | undefined,
    course: { id: number; isFree: boolean },
  ): Promise<boolean> {
    if (course.isFree) return true;
    if (!user) return false;
    if (user.role === ADMIN_ROLE) return true;

    const key = this.entitlementKey(user.id, course.id);
    const cached = await this.cache.get(key);
    if (cached !== null) {
      return cached === '1';
    }

    const owned = await this.db.entitlement.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      select: { id: true },
    });
    const allowed = owned !== null;

    await this.cache.set(key, allowed ? '1' : '0', 3600);
    return allowed;
  }
}

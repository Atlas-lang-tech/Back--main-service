import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';
import { CreateLessonDto } from './dto/create.dto.js';

@Injectable()
export class LessonService {
  constructor(
    private db: PrismaService,
    private cache: RedisService,
  ) {}
  private cacheKey = `lesson:`;

  private async invalidate(lesson: {
    id: number;
    cid: string;
    courseId: number;
  }) {
    await this.cache.del(`${this.cacheKey}${lesson.id}`);
    await this.cache.del(`${this.cacheKey}${lesson.cid}`);
    await this.cache.del(`${this.cacheKey}course-${lesson.courseId}`);
  }

  // Next free order slot at the end of a course's lesson list.
  private async nextOrder(courseId: number): Promise<number> {
    const last = await this.db.lesson.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return last ? last.order + 1 : 0;
  }

  async create(DTO: CreateLessonDto) {
    const checkLesson = await this.db.lesson.findUnique({
      where: {
        cid: DTO.cid,
      },
    });

    if (checkLesson) {
      throw new ConflictException('Lesson already exists');
    }

    const newLesson = await this.db.lesson.create({
      data: {
        title: DTO.title,
        cid: DTO.cid,
        description: DTO.description,
        courseId: DTO.courseId,
        order: await this.nextOrder(DTO.courseId),
      },
    });

    await this.invalidate(newLesson);

    return newLesson;
  }

  async findAll(id: number) {
    const cacheKey = `${this.cacheKey}course-${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const lessons = await this.db.lesson.findMany({
      where: {
        courseId: id,
      },
      orderBy: { order: 'asc' },
    });

    await this.cache.set(cacheKey, JSON.stringify(lessons), 3600);

    return lessons;
  }

  async findOneById(id: number) {
    const cacheKey = `${this.cacheKey}${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const lesson = await this.db.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(lesson), 3600);

    return lesson;
  }

  async findOneByCid(cid: string) {
    const cacheKey = `${this.cacheKey}${cid}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const lesson = await this.db.lesson.findUnique({
      where: { cid },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(lesson), 3600);

    return lesson;
  }

  async update(id: number, DTO: CreateLessonDto) {
    const lesson = await this.db.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // If the lesson is moved to another course, append it to the end of the
    // target course so the @@unique([courseId, order]) constraint can't clash.
    const movedCourse = DTO.courseId !== lesson.courseId;
    const order = movedCourse
      ? await this.nextOrder(DTO.courseId)
      : lesson.order;

    const updatedLesson = await this.db.lesson.update({
      where: { id },
      data: {
        ...DTO,
        order,
      },
    });

    // Invalidate both the old and new course buckets in case courseId changed.
    await this.invalidate(lesson);
    await this.invalidate(updatedLesson);

    return updatedLesson;
  }

  /**
   * Reorders all lessons of a course. `lessonIds` must be a permutation of the
   * course's current lesson ids — its array index becomes the new `order`.
   * Uses a two-pass write (park at negative temp orders, then final orders) so
   * the @@unique([courseId, order]) constraint can't be violated mid-update.
   */
  async reorder(courseId: number, lessonIds: number[]) {
    const existing = await this.db.lesson.findMany({
      where: { courseId },
      select: { id: true, cid: true },
    });

    if (existing.length === 0) {
      throw new NotFoundException('Course has no lessons');
    }

    const existingIds = new Set(existing.map((l) => l.id));
    const payloadIds = new Set(lessonIds);

    if (lessonIds.length !== existing.length) {
      throw new BadRequestException(
        `Expected ${existing.length} lesson ids, got ${lessonIds.length}`,
      );
    }
    if (payloadIds.size !== lessonIds.length) {
      throw new BadRequestException('Duplicate lesson ids in payload');
    }
    for (const id of lessonIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(
          `Lesson ${id} does not belong to course ${courseId}`,
        );
      }
    }

    await this.db.$transaction(async (tx) => {
      // Pass 1: park every lesson at a temporary negative order.
      let temp = -1;
      for (const id of lessonIds) {
        await tx.lesson.update({ where: { id }, data: { order: temp-- } });
      }
      // Pass 2: write final contiguous order (array index).
      for (let i = 0; i < lessonIds.length; i++) {
        await tx.lesson.update({
          where: { id: lessonIds[i] },
          data: { order: i },
        });
      }
    });

    // Invalidate the course bucket and every affected lesson bucket.
    await this.cache.del(`${this.cacheKey}course-${courseId}`);
    for (const l of existing) {
      await this.cache.del(`${this.cacheKey}${l.id}`);
      await this.cache.del(`${this.cacheKey}${l.cid}`);
    }

    return this.db.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
  }

  async delete(id: number): Promise<void> {
    const lesson = await this.db.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.db.lesson.delete({
      where: { id },
    });

    await this.invalidate(lesson);
  }
}

import {
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
        icon: DTO.icon,
        courseId: DTO.courseId,
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

    const updatedLesson = await this.db.lesson.update({
      where: { id },
      data: {
        ...DTO,
      },
    });

    // Invalidate both the old and new course buckets in case courseId changed.
    await this.invalidate(lesson);
    await this.invalidate(updatedLesson);

    return updatedLesson;
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

import { Injectable } from '@nestjs/common';
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
  async create(DTO: CreateLessonDto) {
    const checkLesson = await this.db.lesson.findUnique({
      where: {
        cid: DTO.cid,
      },
    });

    if (checkLesson) {
      throw new Error('Lesson already exists');
    }

    await this.cache.del(`${this.cacheKey}all`);
    const newLesson = await this.db.lesson.create({
      data: {
        title: DTO.title,
        cid: DTO.cid,
        description: DTO.description,
        icon: DTO.icon,
        courseId: DTO.courseId,
      },
    });

    const lessons = await this.db.lesson.findMany();
    await this.cache.set(`${this.cacheKey}all`, JSON.stringify(lessons), 3600);

    return newLesson;
  }

  async findAll(id: number) {
    const cacheKeyAll = `${this.cacheKey}all`;
    const cached = await this.cache.get(cacheKeyAll);

    if (cached) {
      return JSON.parse(cached);
    }

    const lessons = await this.db.lesson.findMany({
      where: {
        courseId: id,
      },
    });

    await this.cache.set(cacheKeyAll, JSON.stringify(lessons), 3600);

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
      throw new Error('Lesson not found');
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
      throw new Error('Lesson not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(lesson), 3600);

    return lesson;
  }

  async update(id: number, DTO: CreateLessonDto) {
    const lesson = await this.db.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);

    const updatedLesson = await this.db.lesson.update({
      where: { id },
      data: {
        ...DTO,
      },
    });

    await this.cache.set(
      `${this.cacheKey}${id}`,
      JSON.stringify(updatedLesson),
      3600,
    );

    return updatedLesson;
  }

  async delete(id: number): Promise<void> {
    const lesson = await this.db.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);

    await this.db.lesson.delete({
      where: { id },
    });
  }
}

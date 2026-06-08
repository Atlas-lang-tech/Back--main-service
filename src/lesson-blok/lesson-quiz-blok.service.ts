import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';
import { CreateInfoDto } from './dto/CreateInfoBlock.dto.js';

@Injectable()
export class LessonQuizBlokService {
  constructor(
    private db: PrismaService,
    private cache: RedisService,
  ) {}
  private cacheKey = `quiz_block:`;
  async create(DTO: CreateInfoDto, id: number) {
    const newQuiz = await this.db.blokQuiz.create({
      data: {
        order: Number(DTO.order),
        title: DTO.title,
        text: DTO.text,
        lessonId: id,
      },
    });

    await this.cache.del(`${this.cacheKey}lesson-${id}`);

    return newQuiz;
  }

  async findAll(id: number) {
    const cacheKey = `${this.cacheKey}lesson-${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const quiz = await this.db.blokQuiz.findMany({
      where: { lessonId: id },
    });

    await this.cache.set(cacheKey, JSON.stringify(quiz), 3600);

    return quiz;
  }

  async findOneById(id: number) {
    const cacheKey = `${this.cacheKey}${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const quiz = await this.db.blokQuiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(quiz), 3600);

    return quiz;
  }

  async update(id: number, lessonId: number, DTO: CreateInfoDto) {
    const quiz = await this.db.blokQuiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const newQuiz = await this.db.blokQuiz.update({
      where: { id },
      data: {
        order: Number(DTO.order),
        title: DTO.title,
        text: DTO.text,
        lessonId,
      },
    });

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}lesson-${quiz.lessonId}`);
    await this.cache.del(`${this.cacheKey}lesson-${lessonId}`);

    return newQuiz;
  }

  async delete(id: number): Promise<void> {
    const quiz = await this.db.blokQuiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    await this.db.blokQuiz.delete({
      where: { id },
    });

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}lesson-${quiz.lessonId}`);
  }
}

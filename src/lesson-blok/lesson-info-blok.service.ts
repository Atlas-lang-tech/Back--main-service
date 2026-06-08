import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';
import { CreateInfoDto } from './dto/CreateInfoBlock.dto.js';

@Injectable()
export class LessonInfoBlokService {
  constructor(
    private db: PrismaService,
    private cache: RedisService,
  ) {}
  private cacheKey = `info_block:`;
  async create(DTO: CreateInfoDto, id: number) {
    const newInfo = await this.db.blokInfo.create({
      data: {
        order: Number(DTO.order),
        title: DTO.title,
        text: DTO.text,
        lessonId: id,
      },
    });

    await this.cache.del(`${this.cacheKey}lesson-${id}`);

    return newInfo;
  }

  async findAll(id: number) {
    const cacheKey = `${this.cacheKey}lesson-${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const info = await this.db.blokInfo.findMany({
      where: { lessonId: id },
    });

    await this.cache.set(cacheKey, JSON.stringify(info), 3600);

    return info;
  }

  async findOneById(id: number) {
    const cacheKey = `${this.cacheKey}${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const info = await this.db.blokInfo.findUnique({
      where: { id },
    });

    if (!info) {
      throw new NotFoundException('Info not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(info), 3600);

    return info;
  }

  async update(id: number, lessonId: number, DTO: CreateInfoDto) {
    const info = await this.db.blokInfo.findUnique({
      where: { id },
    });

    if (!info) {
      throw new NotFoundException('Info not found');
    }

    const newInfo = await this.db.blokInfo.update({
      where: { id },
      data: {
        order: Number(DTO.order),
        title: DTO.title,
        text: DTO.text,
        lessonId,
      },
    });

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}lesson-${info.lessonId}`);
    await this.cache.del(`${this.cacheKey}lesson-${lessonId}`);

    return newInfo;
  }

  async delete(id: number): Promise<void> {
    const info = await this.db.blokInfo.findUnique({
      where: { id },
    });

    if (!info) {
      throw new NotFoundException('Info not found');
    }

    await this.db.blokInfo.delete({
      where: { id },
    });

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}lesson-${info.lessonId}`);
  }
}

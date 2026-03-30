import { Injectable } from '@nestjs/common';
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
    await this.cache.del(`${this.cacheKey}all`);
    const newInfo = await this.db.blokInfo.create({
      data: {
        order: Number(DTO.order),
        title: DTO.title,
        text: DTO.text,
        lessonId: id,
      },
    });

    const info = await this.db.blokInfo.findMany();
    await this.cache.set(`${this.cacheKey}all`, JSON.stringify(info), 3600);

    return newInfo;
  }

  async findAll(id: number) {
    const cacheKeyAll = `${this.cacheKey}all`;
    const cached = await this.cache.get(cacheKeyAll);

    if (cached) {
      return JSON.parse(cached);
    }

    const info = await this.db.blokInfo.findMany({
      where: { lessonId: id },
    });

    await this.cache.set(cacheKeyAll, JSON.stringify(info), 3600);

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
      throw new Error('Info not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(info), 3600);

    return info;
  }

  async update(id: number, lessonId: number, DTO: CreateInfoDto) {
    const info = await this.db.blokInfo.findUnique({
      where: { id },
    });

    if (!info) {
      throw new Error('Info not found');
    }

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);

    const newInfo = await this.db.blokInfo.update({
      where: { id },
      data: {
        order: Number(DTO.order),
        title: DTO.title,
        text: DTO.text,
        lessonId,
      },
    });

    await this.cache.set(
      `${this.cacheKey}${id}`,
      JSON.stringify(newInfo),
      3600,
    );

    return newInfo;
  }

  async delete(id: number): Promise<void> {
    const info = await this.db.blokInfo.findUnique({
      where: { id },
    });

    if (!info) {
      throw new Error('Info not found');
    }

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);

    await this.db.blokInfo.delete({
      where: { id },
    });
  }
}

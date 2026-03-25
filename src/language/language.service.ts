import { Injectable } from '@nestjs/common';
import { CreateLanguageDto } from './dto/create.dto.js';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';

@Injectable()
export class LanguageService {
  constructor(
    private db: PrismaService,
    private cache: RedisService,
  ) {}
  private cacheKey = `language:`;
  async create(DTO: CreateLanguageDto) {
    const checkLanguage = await this.db.language.findUnique({
      where: { code: DTO.code },
    });

    if (checkLanguage) {
      throw new Error('Language already exists');
    }

    await this.cache.del(`${this.cacheKey}all`);
    const newLanguage = await this.db.language.create({
      data: {
        name: DTO.name,
        code: DTO.code,
        icon: DTO.icon,
      },
    });

    const languages = await this.db.language.findMany();
    await this.cache.set(
      `${this.cacheKey}all`,
      JSON.stringify(languages),
      3600,
    );

    return newLanguage;
  }

  async findAll() {
    const cacheKeyAll = `${this.cacheKey}all`;
    const cached = await this.cache.get(cacheKeyAll);

    if (cached) {
      return JSON.parse(cached);
    }

    const languages = await this.db.language.findMany();

    await this.cache.set(cacheKeyAll, JSON.stringify(languages), 3600);

    return languages;
  }

  async findOneById(id: number) {
    const cacheKey = `${this.cacheKey}${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const language = await this.db.language.findUnique({
      where: { id },
    });

    if (!language) {
      throw new Error('Language not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(language), 3600);

    return language;
  }

  async update(id: number, DTO: CreateLanguageDto) {
    const language = await this.db.language.findUnique({
      where: { id },
    });

    if (!language) {
      throw new Error('Language not found');
    }

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);

    const newLanguage = await this.db.language.update({
      where: { id },
      data: {
        name: DTO.name,
        code: DTO.code,
        icon: DTO.icon,
      },
    });

    await this.cache.set(
      `${this.cacheKey}${id}`,
      JSON.stringify(newLanguage),
      3600,
    );

    return newLanguage;
  }

  async delete(id: number): Promise<void> {
    const language = await this.db.language.findUnique({
      where: { id },
    });

    if (!language) {
      throw new Error('Language not found');
    }

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);

    await this.db.language.delete({
      where: { id },
    });
  }
}

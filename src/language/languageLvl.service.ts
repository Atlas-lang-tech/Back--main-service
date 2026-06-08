import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';
import { AddLanguageLvlDto } from './dto/addLvl.dto.js';

@Injectable()
export class LanguageLvlService {
  constructor(
    private db: PrismaService,
    private cache: RedisService,
  ) {}
  private cacheKey = `language_lvl:`;
  async create(DTO: AddLanguageLvlDto, languageId: number) {
    const checkLanguageLvl = await this.db.languageLvl.findUnique({
      where: { name: DTO.name },
    });

    if (checkLanguageLvl) {
      throw new ConflictException('Language level already exists');
    }

    const newLanguageLvl = await this.db.languageLvl.create({
      data: {
        name: DTO.name,
        languageId,
      },
    });

    await this.cache.del(`${this.cacheKey}all`);
    await this.cache.del(`${this.cacheKey}language-${languageId}`);

    return newLanguageLvl;
  }

  async getAll() {
    const cacheKeyAll = `${this.cacheKey}all`;
    const cached = await this.cache.get(cacheKeyAll);

    if (cached) {
      return JSON.parse(cached);
    }

    const languagesLvl = await this.db.languageLvl.findMany();
    await this.cache.set(cacheKeyAll, JSON.stringify(languagesLvl), 3600);

    return languagesLvl;
  }

  async findAllByLanguageId(languageId: number) {
    const cacheKey = `${this.cacheKey}language-${languageId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const languagesLvl = await this.db.languageLvl.findMany({
      where: { languageId },
    });

    await this.cache.set(cacheKey, JSON.stringify(languagesLvl), 3600);

    return languagesLvl;
  }

  async findOneById(id: number) {
    const cacheKey = `${this.cacheKey}${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const languageLvl = await this.db.languageLvl.findUnique({
      where: { id },
    });

    if (!languageLvl) {
      throw new NotFoundException('Language level not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(languageLvl), 3600);

    return languageLvl;
  }

  async update(id: number, DTO: AddLanguageLvlDto) {
    const languageLvl = await this.db.languageLvl.findUnique({
      where: { id },
    });

    if (!languageLvl) {
      throw new NotFoundException('Language level not found');
    }

    const newLanguageLvl = await this.db.languageLvl.update({
      where: { id },
      data: {
        name: DTO.name,
      },
    });

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);
    await this.cache.del(`${this.cacheKey}language-${languageLvl.languageId}`);

    return newLanguageLvl;
  }

  async delete(id: number): Promise<void> {
    const languageLvl = await this.db.languageLvl.findUnique({
      where: { id },
    });

    if (!languageLvl) {
      throw new NotFoundException('Language level not found');
    }

    await this.db.languageLvl.delete({
      where: { id },
    });

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);
    await this.cache.del(`${this.cacheKey}language-${languageLvl.languageId}`);
  }
}

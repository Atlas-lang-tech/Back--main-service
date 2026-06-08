import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create.dto.js';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';

@Injectable()
export class CategoryService {
  constructor(
    private db: PrismaService,
    private cache: RedisService,
  ) {}
  private cacheKey = `category:`;
  async create(DTO: CreateCategoryDto) {
    const checkCategory = await this.db.category.findUnique({
      where: { name: DTO.name },
    });

    if (checkCategory) {
      throw new ConflictException('Category already exists');
    }

    await this.cache.del(`${this.cacheKey}all`);
    const newCategory = await this.db.category.create({
      data: {
        name: DTO.name,
      },
    });

    const categories = await this.db.category.findMany();
    await this.cache.set(
      `${this.cacheKey}all`,
      JSON.stringify(categories),
      3600,
    );

    return newCategory;
  }

  async findAll() {
    const cacheKeyAll = `${this.cacheKey}all`;
    const cached = await this.cache.get(cacheKeyAll);

    if (cached) {
      return JSON.parse(cached);
    }

    const categories = await this.db.category.findMany();

    await this.cache.set(cacheKeyAll, JSON.stringify(categories), 3600);

    return categories;
  }

  async findOneById(id: number) {
    const cacheKey = `${this.cacheKey}${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const category = await this.db.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(category), 3600);

    return category;
  }

  async update(id: number, DTO: CreateCategoryDto) {
    const category = await this.db.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);

    const newCategory = await this.db.category.update({
      where: { id },
      data: {
        name: DTO.name,
      },
    });

    await this.cache.set(
      `${this.cacheKey}${id}`,
      JSON.stringify(newCategory),
      3600,
    );

    return newCategory;
  }

  async delete(id: number): Promise<void> {
    const category = await this.db.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);

    await this.db.category.delete({
      where: { id },
    });
  }
}

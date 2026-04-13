import { Injectable } from '@nestjs/common';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';
import { CreateCourseDto } from './dto/create.dto.js';

@Injectable()
export class CourseService {
  constructor(
    private db: PrismaService,
    private cache: RedisService,
  ) {}
  private cacheKey = `course:`;
  async create(DTO: CreateCourseDto) {
    const checkCourse = await this.db.course.findUnique({
      where: {
        cid: DTO.cid,
      },
    });

    if (checkCourse) {
      throw new Error('Course already exists');
    }

    await this.cache.del(`${this.cacheKey}all`);
    const newCourse = await this.db.course.create({
      data: {
        title: DTO.title,
        cid: DTO.cid,
        description: DTO.description,
        icon: DTO.icon,
        languageId: DTO.languageId,
        languageLvlId: DTO.languageLvlId,
        categoryId: DTO.categoryId,
      },
    });

    const courses = await this.db.course.findMany();
    await this.cache.set(`${this.cacheKey}all`, JSON.stringify(courses), 3600);

    return newCourse;
  }

  async findAll() {
    const cacheKeyAll = `${this.cacheKey}all`;
    const cached = await this.cache.get(cacheKeyAll);

    if (cached) {
      return JSON.parse(cached);
    }

    const courses = await this.db.course.findMany();

    await this.cache.set(cacheKeyAll, JSON.stringify(courses), 3600);

    return courses;
  }

  async findOneById(id: number) {
    const cacheKey = `${this.cacheKey}${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const course = await this.db.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(course), 3600);

    return course;
  }

  async findOneByCid(cid: string) {
    const cacheKey = `${this.cacheKey}${cid}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const course = await this.db.course.findUnique({
      where: { cid },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(course), 3600);

    return course;
  }

  async findOneByLanguage(languageId: number) {
    const cacheKey = `${this.cacheKey}language-${languageId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const course = await this.db.course.findMany({
      where: { languageId },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(course), 3600);

    return course;
  }

  async findOneByCategory(categoryId: number) {
    const cacheKey = `${this.cacheKey}category-${categoryId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const course = await this.db.course.findMany({
      where: { categoryId },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    await this.cache.set(cacheKey, JSON.stringify(course), 3600);

    return course;
  }

  async update(id: number, DTO: CreateCourseDto) {
    const course = await this.db.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);

    const updatedCourse = await this.db.course.update({
      where: { id },
      data: {
        ...DTO,
      },
    });

    await this.cache.set(
      `${this.cacheKey}${id}`,
      JSON.stringify(updatedCourse),
      3600,
    );

    return updatedCourse;
  }

  async delete(id: number): Promise<void> {
    const course = await this.db.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    await this.cache.del(`${this.cacheKey}${id}`);
    await this.cache.del(`${this.cacheKey}all`);

    await this.db.course.delete({
      where: { id },
    });
  }
}

import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';
import {
  RabbitService,
  RoutingKeys,
} from '../modules/rabbit/rabbit.service.js';
import { CreateCourseDto } from './dto/create.dto.js';

@Injectable()
export class CourseService {
  constructor(
    private db: PrismaService,
    private cache: RedisService,
    private rabbit: RabbitService,
  ) {}
  private cacheKey = `course:`;

  // Notifies billing so it can keep its Product catalog in sync.
  private publishUpserted(course: {
    id: number;
    isFree: boolean;
    title: string;
  }) {
    this.rabbit.publish(
      RoutingKeys.courseUpserted,
      { courseId: course.id, isFree: course.isFree, title: course.title },
      randomUUID(),
    );
  }

  private async invalidate(course: {
    id: number;
    cid: string;
    languageId: number;
    categoryId: number | null;
  }) {
    await this.cache.del(`${this.cacheKey}all`);
    await this.cache.del(`${this.cacheKey}${course.id}`);
    await this.cache.del(`${this.cacheKey}${course.cid}`);
    await this.cache.del(`${this.cacheKey}language-${course.languageId}`);
    if (course.categoryId != null) {
      await this.cache.del(`${this.cacheKey}category-${course.categoryId}`);
    }
  }

  async create(DTO: CreateCourseDto) {
    const checkCourse = await this.db.course.findUnique({
      where: {
        cid: DTO.cid,
      },
    });

    if (checkCourse) {
      throw new ConflictException('Course already exists');
    }

    const newCourse = await this.db.course.create({
      data: {
        title: DTO.title,
        cid: DTO.cid,
        description: DTO.description,
        icon: DTO.icon,
        isFree: DTO.isFree,
        isVisible: DTO.isVisible,
        languageId: DTO.languageId,
        nativeLanguageId: DTO.nativeLanguageId,
        languageLvlId: DTO.languageLvlId,
        categoryId: DTO.categoryId,
      },
    });

    await this.invalidate(newCourse);
    this.publishUpserted(newCourse);

    return newCourse;
  }

  async findAll() {
    const cacheKeyAll = `${this.cacheKey}all`;
    const cached = await this.cache.get(cacheKeyAll);

    if (cached) {
      return JSON.parse(cached);
    }

    const courses = await this.db.course.findMany({
      where: { isVisible: true },
    });

    await this.cache.set(cacheKeyAll, JSON.stringify(courses), 3600);

    return courses;
  }

  // Admin listing: returns every course, visible or hidden, bypassing cache
  // so the panel always reflects the current state.
  async findAllAdmin() {
    return this.db.course.findMany({
      orderBy: { id: 'asc' },
    });
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
      throw new NotFoundException('Course not found');
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
      throw new NotFoundException('Course not found');
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

    const courses = await this.db.course.findMany({
      where: { languageId, isVisible: true },
    });

    await this.cache.set(cacheKey, JSON.stringify(courses), 3600);

    return courses;
  }

  async findOneByCategory(categoryId: number) {
    const cacheKey = `${this.cacheKey}category-${categoryId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const courses = await this.db.course.findMany({
      where: { categoryId, isVisible: true },
    });

    await this.cache.set(cacheKey, JSON.stringify(courses), 3600);

    return courses;
  }

  async update(id: number, DTO: CreateCourseDto) {
    const course = await this.db.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updatedCourse = await this.db.course.update({
      where: { id },
      data: {
        ...DTO,
      },
    });

    // Invalidate caches for both the old and new language/category buckets,
    // since those relations may have changed.
    await this.invalidate(course);
    await this.invalidate(updatedCourse);
    this.publishUpserted(updatedCourse);

    return updatedCourse;
  }

  async setVisibility(id: number, isVisible: boolean) {
    const course = await this.db.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updatedCourse = await this.db.course.update({
      where: { id },
      data: { isVisible },
    });

    await this.invalidate(updatedCourse);

    return updatedCourse;
  }

  async delete(id: number): Promise<void> {
    const course = await this.db.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.db.course.delete({
      where: { id },
    });

    await this.invalidate(course);
    this.rabbit.publish(
      RoutingKeys.courseDeleted,
      { courseId: course.id },
      randomUUID(),
    );
  }
}

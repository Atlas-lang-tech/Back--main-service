import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';
import { CreateBlockDto } from './dto/create-block.dto.js';
import { BlockItemDto } from './dto/block-item.dto.js';
import { validateBlockContent } from './content/block-content.validator.js';

@Injectable()
export class BlockService {
  constructor(
    private db: PrismaService,
    private cache: RedisService,
  ) {}
  private cacheKey = `block:`;

  private listKey(lessonId: number) {
    return `${this.cacheKey}lesson-${lessonId}`;
  }

  private async assertLessonExists(lessonId: number) {
    const lesson = await this.db.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
  }

  async findAllByLesson(lessonId: number) {
    const cacheKey = this.listKey(lessonId);
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const blocks = await this.db.block.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
    });

    await this.cache.set(cacheKey, JSON.stringify(blocks), 3600);

    return blocks;
  }

  async findOneById(id: number) {
    const block = await this.db.block.findUnique({ where: { id } });
    if (!block) {
      throw new NotFoundException('Block not found');
    }
    return block;
  }

  async create(lessonId: number, dto: CreateBlockDto) {
    await this.assertLessonExists(lessonId);
    validateBlockContent(dto.type, dto.content);

    const last = await this.db.block.findFirst({
      where: { lessonId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = last ? last.order + 1 : 0;

    const block = await this.db.block.create({
      data: {
        lessonId,
        order,
        type: dto.type,
        title: dto.title ?? null,
        content: dto.content as Prisma.InputJsonValue,
      },
    });

    await this.cache.del(this.listKey(lessonId));

    return block;
  }

  async update(id: number, dto: CreateBlockDto) {
    const block = await this.db.block.findUnique({ where: { id } });
    if (!block) {
      throw new NotFoundException('Block not found');
    }
    validateBlockContent(dto.type, dto.content);

    const updated = await this.db.block.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title ?? null,
        content: dto.content as Prisma.InputJsonValue,
      },
    });

    await this.cache.del(this.listKey(block.lessonId));

    return updated;
  }

  async delete(id: number): Promise<void> {
    const block = await this.db.block.findUnique({ where: { id } });
    if (!block) {
      throw new NotFoundException('Block not found');
    }

    await this.db.block.delete({ where: { id } });

    await this.cache.del(this.listKey(block.lessonId));
  }

  /**
   * Full sync of a lesson's blocks from the admin editor: creates new blocks,
   * updates existing ones, deletes those missing from the payload, and rewrites
   * `order` to match the payload array. Existing block ids are preserved so that
   * downstream per-user answer history (referencing block.id) is not orphaned.
   */
  async syncLesson(lessonId: number, items: BlockItemDto[]) {
    await this.assertLessonExists(lessonId);

    for (const item of items) {
      validateBlockContent(item.type, item.content);
    }

    const existing = await this.db.block.findMany({
      where: { lessonId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((b) => b.id));

    const payloadIds = items
      .filter((i) => i.id != null)
      .map((i) => i.id as number);

    for (const id of payloadIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(
          `Block ${id} does not belong to lesson ${lessonId}`,
        );
      }
    }

    const payloadIdSet = new Set(payloadIds);
    const toDelete = [...existingIds].filter((id) => !payloadIdSet.has(id));

    await this.db.$transaction(async (tx) => {
      if (toDelete.length > 0) {
        await tx.block.deleteMany({ where: { id: { in: toDelete } } });
      }

      // Pass 1: park surviving blocks at temporary negative orders so the
      // @@unique([lessonId, order]) constraint can't be violated mid-write.
      let temp = -1;
      for (const id of payloadIds) {
        await tx.block.update({ where: { id }, data: { order: temp-- } });
      }

      // Pass 2: write final contiguous order (array index) + content.
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const data = {
          order: i,
          type: item.type,
          title: item.title ?? null,
          content: item.content as Prisma.InputJsonValue,
        };
        if (item.id != null) {
          await tx.block.update({ where: { id: item.id }, data });
        } else {
          await tx.block.create({ data: { ...data, lessonId } });
        }
      }
    });

    await this.cache.del(this.listKey(lessonId));

    return this.db.block.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
    });
  }
}

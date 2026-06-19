import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../modules/Prisma/prisma.service.js';
import { RedisService } from '../modules/redis/redis.service.js';
import { RabbitService } from '../modules/rabbit/rabbit.service.js';

const QUEUE = 'main.entitlements';
const ROUTING_KEY = 'course.purchased';
/** How long a processed messageId is remembered for dedup (24h). */
const DEDUP_TTL = 86_400;

interface CoursePurchasedEvent {
  userId: string;
  courseId: number;
  purchasedAt?: string;
}

/**
 * Listens for billing's `course.purchased` events and upserts the local
 * `entitlement` read-model so AccessService can grant ownership locally.
 * Idempotent on two levels: the `@@unique([userId, courseId])` upsert, and a
 * Redis dedup key on the message's `messageId`.
 */
@Injectable()
export class EntitlementConsumer implements OnModuleInit {
  private readonly logger = new Logger(EntitlementConsumer.name);

  constructor(
    private db: PrismaService,
    private cache: RedisService,
    private rabbit: RabbitService,
  ) {}

  async onModuleInit() {
    await this.rabbit.consume(QUEUE, [ROUTING_KEY], (payload, messageId) =>
      this.handle(payload as CoursePurchasedEvent, messageId),
    );
  }

  private async handle(event: CoursePurchasedEvent, messageId?: string) {
    if (messageId) {
      const dedupKey = `event:${messageId}`;
      if (await this.cache.exists(dedupKey)) {
        return;
      }
      await this.cache.set(dedupKey, '1', DEDUP_TTL);
    }

    const { userId, courseId } = event;

    await this.db.entitlement.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {},
    });

    // Drop any cached "no access" decision for this pair.
    await this.cache.del(`access:${userId}:${courseId}`);

    this.logger.log(`Granted entitlement user=${userId} course=${courseId}`);
  }
}

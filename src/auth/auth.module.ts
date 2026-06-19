import { Module } from '@nestjs/common';
import { PrismaModule } from '../modules/Prisma/prisma.module.js';
import { AccessService } from './access.service.js';
import { UserContextGuard } from './user-context.guard.js';
import { EntitlementConsumer } from './entitlement.consumer.js';

/**
 * Cross-cutting access control: the header-reading guard, the course access
 * check, and the consumer that keeps the `entitlement` read-model in sync with
 * billing. RabbitService/RedisService come from their @Global modules.
 */
@Module({
  imports: [PrismaModule],
  providers: [AccessService, UserContextGuard, EntitlementConsumer],
  exports: [AccessService, UserContextGuard],
})
export class AuthModule {}

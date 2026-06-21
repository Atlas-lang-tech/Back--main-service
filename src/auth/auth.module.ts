import { Module } from '@nestjs/common';
import { PrismaModule } from '../modules/Prisma/prisma.module.js';
import { AccessService } from './access.service.js';
import { EntitlementConsumer } from './entitlement.consumer.js';

/**
 * Cross-cutting access control: the course access check and the consumer that
 * keeps the `entitlement` read-model in sync with billing. The header/role
 * guards live in `src/common/auth/` and are applied directly via `@UseGuards`.
 * RabbitService/RedisService come from their @Global modules.
 */
@Module({
  imports: [PrismaModule],
  providers: [AccessService, EntitlementConsumer],
  exports: [AccessService],
})
export class AuthModule {}

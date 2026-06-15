import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/common/setup-app.js';
import { PrismaService } from '../src/modules/Prisma/prisma.service.js';

export const API = '/api/course';

/**
 * Boots the full AppModule with the same global configuration as production
 * (see setupApp in src/main.ts), so e2e tests hit the real response envelope,
 * `api/course` prefix and error filter. Requires a reachable Postgres + Redis
 * (DATABASE_URL / REDIS_* env vars); locally: `docker compose up -d` +
 * `pnpm prisma migrate deploy`.
 */
export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = setupApp(moduleRef.createNestApplication());
  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma };
}

/** Wipes all content tables in FK-safe order. */
export async function cleanDb(prisma: PrismaService): Promise<void> {
  await prisma.block.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.languageLvl.deleteMany();
  await prisma.category.deleteMany();
  await prisma.language.deleteMany();
}

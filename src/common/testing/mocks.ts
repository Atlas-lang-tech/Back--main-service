import { jest } from '@jest/globals';

/**
 * Test doubles for PrismaService / RedisService. These are plain objects of
 * jest mocks — services are instantiated directly with them
 * (`new XxxService(createMockPrisma() as any, createMockRedis() as any)`),
 * so no real database or Redis connection is ever opened in unit tests.
 *
 * Excluded from the production build via tsconfig.build.json (`**\/testing\/**`).
 */

type Model = {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
};

function createModelMock(): Model {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };
}

export interface MockPrisma {
  course: Model;
  category: Model;
  language: Model;
  languageLvl: Model;
  lesson: Model;
  block: Model;
  $transaction: jest.Mock;
}

export function createMockPrisma(): MockPrisma {
  const prisma = {
    course: createModelMock(),
    category: createModelMock(),
    language: createModelMock(),
    languageLvl: createModelMock(),
    lesson: createModelMock(),
    block: createModelMock(),
    // By default run the interactive-transaction callback against the same
    // mock client, so two-pass reorder/sync logic executes inline.
    $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
  };
  return prisma as MockPrisma;
}

export interface MockRedis {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  exists: jest.Mock;
  expire: jest.Mock;
  keys: jest.Mock;
}

export function createMockRedis(): MockRedis {
  return {
    // Default to a cache miss; individual tests override per case.
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve(undefined)),
    del: jest.fn(() => Promise.resolve(1)),
    exists: jest.fn(() => Promise.resolve(false)),
    expire: jest.fn(() => Promise.resolve(undefined)),
    keys: jest.fn(() => Promise.resolve([])),
  };
}

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccessService } from './access.service.js';
import {
  createMockPrisma,
  createMockRedis,
  type MockPrisma,
  type MockRedis,
} from '../common/testing/mocks.js';
import type { UserContext } from '../common/auth/user-context.guard.js';

describe('AccessService', () => {
  let db: MockPrisma;
  let cache: MockRedis;
  let service: AccessService;

  const admin: UserContext = { id: 'u1', role: 'ADMIN', plan: 'FREE' };
  const learner: UserContext = { id: 'u2', role: 'USER', plan: 'FREE' };

  const lessonOf = (isFree: boolean) => ({ course: { id: 7, isFree } });

  beforeEach(() => {
    db = createMockPrisma();
    cache = createMockRedis();
    service = new AccessService(db as any, cache as any);
  });

  it('throws NotFoundException when the lesson is missing', async () => {
    db.lesson.findUnique.mockResolvedValue(null);

    await expect(service.canAccessLesson(learner, 999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('allows anyone (incl. anonymous) for a free course', async () => {
    db.lesson.findUnique.mockResolvedValue(lessonOf(true));

    await expect(
      service.canAccessLesson(undefined, 1),
    ).resolves.toBeUndefined();
    expect(db.entitlement.findUnique).not.toHaveBeenCalled();
  });

  it('forbids anonymous callers on a paid course', async () => {
    db.lesson.findUnique.mockResolvedValue(lessonOf(false));

    await expect(service.canAccessLesson(undefined, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows admins on a paid course without an entitlement', async () => {
    db.lesson.findUnique.mockResolvedValue(lessonOf(false));

    await expect(service.canAccessLesson(admin, 1)).resolves.toBeUndefined();
    expect(db.entitlement.findUnique).not.toHaveBeenCalled();
  });

  it('allows an owner and caches the positive decision', async () => {
    db.lesson.findUnique.mockResolvedValue(lessonOf(false));
    db.entitlement.findUnique.mockResolvedValue({ id: 1 });

    await expect(service.canAccessLesson(learner, 1)).resolves.toBeUndefined();
    expect(cache.set).toHaveBeenCalledWith('access:u2:7', '1', 3600);
  });

  it('forbids a logged-in non-owner and caches the negative decision', async () => {
    db.lesson.findUnique.mockResolvedValue(lessonOf(false));
    db.entitlement.findUnique.mockResolvedValue(null);

    await expect(service.canAccessLesson(learner, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(cache.set).toHaveBeenCalledWith('access:u2:7', '0', 3600);
  });

  it('honours a cached positive decision without querying entitlements', async () => {
    db.lesson.findUnique.mockResolvedValue(lessonOf(false));
    cache.get.mockResolvedValue('1');

    await expect(service.canAccessLesson(learner, 1)).resolves.toBeUndefined();
    expect(db.entitlement.findUnique).not.toHaveBeenCalled();
  });

  it('honours a cached negative decision without querying entitlements', async () => {
    db.lesson.findUnique.mockResolvedValue(lessonOf(false));
    cache.get.mockResolvedValue('0');

    await expect(service.canAccessLesson(learner, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(db.entitlement.findUnique).not.toHaveBeenCalled();
  });
});

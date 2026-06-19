import { EntitlementConsumer } from './entitlement.consumer.js';
import {
  createMockPrisma,
  createMockRedis,
  createMockRabbit,
  type MockPrisma,
  type MockRedis,
  type MockRabbit,
} from '../common/testing/mocks.js';

type Handler = (payload: unknown, messageId?: string) => Promise<void>;

describe('EntitlementConsumer', () => {
  let db: MockPrisma;
  let cache: MockRedis;
  let rabbit: MockRabbit;
  let consumer: EntitlementConsumer;
  let handler: Handler;

  const event = { userId: 'u1', courseId: 7, purchasedAt: '2026-06-19' };

  beforeEach(async () => {
    db = createMockPrisma();
    cache = createMockRedis();
    rabbit = createMockRabbit();
    // Capture the handler the consumer registers so we can drive messages.
    rabbit.consume.mockImplementation((_q, _keys, h: Handler) => {
      handler = h;
      return Promise.resolve();
    });
    consumer = new EntitlementConsumer(db as any, cache as any, rabbit as any);
    await consumer.onModuleInit();
  });

  it('binds the course.purchased routing key on init', () => {
    expect(rabbit.consume).toHaveBeenCalledWith(
      'main.entitlements',
      ['course.purchased'],
      expect.any(Function),
    );
  });

  it('upserts an entitlement and invalidates the access cache', async () => {
    await handler(event, 'msg-1');

    expect(db.entitlement.upsert).toHaveBeenCalledWith({
      where: { userId_courseId: { userId: 'u1', courseId: 7 } },
      create: { userId: 'u1', courseId: 7 },
      update: {},
    });
    expect(cache.del).toHaveBeenCalledWith('access:u1:7');
    expect(cache.set).toHaveBeenCalledWith('event:msg-1', '1', 86400);
  });

  it('skips a message whose messageId was already processed', async () => {
    cache.exists.mockResolvedValue(true);

    await handler(event, 'msg-1');

    expect(db.entitlement.upsert).not.toHaveBeenCalled();
    expect(cache.del).not.toHaveBeenCalled();
  });
});

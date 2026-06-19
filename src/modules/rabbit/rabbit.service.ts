import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, {
  type ChannelModel,
  type Channel,
  type ConsumeMessage,
} from 'amqplib';

/**
 * Shared RabbitMQ contract (see infra plan, section 0):
 *  - one durable topic exchange `atlas.events`,
 *  - a dead-letter exchange `atlas.events.dlx` with a parking queue,
 *  - JSON, persistent messages carrying a `messageId` for consumer idempotency.
 *
 * Thin amqplib wrapper modelled on RedisService: connect on module init,
 * assert the topology, expose `publish` and `consume`, close gracefully on
 * shutdown. We use amqplib directly rather than the `@nestjs/microservices`
 * RMQ transport because the latter does not model a topic exchange with
 * custom routing keys / DLX cleanly.
 */
export const EXCHANGE = 'atlas.events';
export const DLX = 'atlas.events.dlx';

/** Routing keys this service publishes. */
export const RoutingKeys = {
  courseUpserted: 'course.upserted',
  courseDeleted: 'course.deleted',
} as const;

export type Consumer = (
  payload: unknown,
  messageId: string | undefined,
) => Promise<void>;

@Injectable()
export class RabbitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitService.name);
  private connection!: ChannelModel;
  private channel!: Channel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('RABBITMQ_URL');
    this.connection = await amqp.connect(url!);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await this.channel.assertExchange(DLX, 'topic', { durable: true });

    // Parking queue for messages a consumer rejected (retries exhausted).
    await this.channel.assertQueue(`${DLX}.parking`, { durable: true });
    await this.channel.bindQueue(`${DLX}.parking`, DLX, '#');

    this.logger.log(`Connected to RabbitMQ, exchange "${EXCHANGE}" ready`);
  }

  /** Publish a persistent JSON message tagged with a messageId for idempotency. */
  publish(routingKey: string, payload: unknown, messageId: string): void {
    this.channel.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true, contentType: 'application/json', messageId },
    );
  }

  /**
   * Declare this service's durable queue, bind the given routing keys and start
   * consuming. The queue dead-letters to `atlas.events.dlx` so poison messages
   * don't loop forever. The handler decides ack/nack via thrown errors.
   */
  async consume(
    queue: string,
    routingKeys: string[],
    handler: Consumer,
  ): Promise<void> {
    await this.channel.assertQueue(queue, {
      durable: true,
      deadLetterExchange: DLX,
    });
    for (const key of routingKeys) {
      await this.channel.bindQueue(queue, EXCHANGE, key);
    }

    await this.channel.consume(queue, (msg: ConsumeMessage | null) => {
      if (!msg) return;
      void this.handleMessage(msg, handler);
    });

    this.logger.log(
      `Consuming "${queue}" bound to [${routingKeys.join(', ')}]`,
    );
  }

  private async handleMessage(msg: ConsumeMessage, handler: Consumer) {
    try {
      const payload: unknown = JSON.parse(msg.content.toString());
      const messageId = msg.properties.messageId as string | undefined;
      await handler(payload, messageId);
      this.channel.ack(msg);
    } catch (err) {
      this.logger.error(
        `Failed to handle message ${msg.properties.messageId ?? '<no-id>'}`,
        err instanceof Error ? err.stack : String(err),
      );
      // Don't requeue: route to the DLX so a single poison message can't loop.
      this.channel.nack(msg, false, false);
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // ignore close errors on shutdown
    }
  }
}

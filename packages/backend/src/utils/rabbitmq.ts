// packages/backend/src/utils/rabbitmq.ts
//
// Centralized RabbitMQ publisher. Maintains a single shared connection + confirm
// channel (instead of opening a brand-new connection on every request) and publishes
// durable, publisher-confirmed messages — so a job is only treated as "queued" once
// the broker has persisted and acknowledged it.
import amqplib, { type ConfirmChannel } from 'amqplib';

type AmqpConnection = Awaited<ReturnType<typeof amqplib.connect>>;

let connection: AmqpConnection | null = null;
let channel: ConfirmChannel | null = null;
let connecting: Promise<ConfirmChannel> | null = null;

async function connect(): Promise<ConfirmChannel> {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost';
    const conn = await amqplib.connect(url);

    conn.on('error', (err: any) => console.error('[RabbitMQ] Connection error:', err?.message || err));
    conn.on('close', () => {
        console.warn('[RabbitMQ] Publisher connection closed — will reconnect on next publish.');
        connection = null;
        channel = null;
        connecting = null;
    });

    const ch = await conn.createConfirmChannel();
    connection = conn;
    channel = ch;
    console.log('[RabbitMQ] Publisher connection established.');
    return ch;
}

async function getChannel(): Promise<ConfirmChannel> {
    if (channel) return channel;
    // Dedupe concurrent connect attempts so a burst of requests shares one connection.
    if (!connecting) connecting = connect();
    return connecting;
}

/**
 * Publish a job to a durable queue using publisher confirms. Resolves only after the
 * broker acknowledges the persisted message, and rejects if publishing fails — so the
 * caller can surface a real error instead of silently dropping a paid job. Messages are
 * marked persistent so they survive a broker restart.
 */
export async function publishJob(queue: string, payload: unknown): Promise<void> {
    const ch = await getChannel();
    await ch.assertQueue(queue, { durable: true });

    await new Promise<void>((resolve, reject) => {
        ch.sendToQueue(
            queue,
            Buffer.from(JSON.stringify(payload)),
            { persistent: true, contentType: 'application/json' },
            (err) => (err ? reject(err) : resolve()),
        );
    });
}
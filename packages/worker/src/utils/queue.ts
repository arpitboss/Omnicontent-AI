// packages/worker/src/utils/queue.ts
//
// Reliability helpers for the worker's RabbitMQ consumers: persistent publishing with
// confirms, plus a bounded retry → dead-letter strategy. A failing job is retried a few
// times and then parked in `dead_jobs` for inspection — instead of being silently
// dropped (the old "ack before processing" behaviour) or retried forever.
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';

export const DEAD_LETTER_QUEUE = 'dead_jobs';
const MAX_RETRIES = Number(process.env.JOB_MAX_RETRIES ?? 3);

/** Read how many times this message has already been retried. */
function getAttempt(msg: ConsumeMessage): number {
    const headers = msg.properties.headers || {};
    return Number(headers['x-attempt'] ?? 0);
}

/** Publish a persistent, publisher-confirmed message to a durable queue. */
export async function publish(
    channel: ConfirmChannel,
    queue: string,
    payload: unknown,
    headers?: Record<string, unknown>,
): Promise<void> {
    await channel.assertQueue(queue, { durable: true });
    await new Promise<void>((resolve, reject) => {
        channel.sendToQueue(
            queue,
            Buffer.from(JSON.stringify(payload)),
            { persistent: true, contentType: 'application/json', headers },
            (err) => (err ? reject(err) : resolve()),
        );
    });
}

/**
 * Decide what to do with a failed job. If retries remain, it is republished to its
 * source queue with an incremented attempt counter; once retries are exhausted it is
 * routed to the dead-letter queue. The caller should ack the original message afterwards
 * (a fresh copy has already been published).
 *
 * @returns deadLettered=true when retries are exhausted (caller should mark the job failed).
 */
export async function retryOrDeadLetter(
    channel: ConfirmChannel,
    msg: ConsumeMessage,
    sourceQueue: string,
    payload: unknown,
    error: unknown,
): Promise<{ deadLettered: boolean; attempt: number }> {
    const attempt = getAttempt(msg) + 1;
    const message = error instanceof Error ? error.message : String(error);

    if (attempt <= MAX_RETRIES) {
        await publish(channel, sourceQueue, payload, { 'x-attempt': attempt });
        console.warn(`[♻️] Requeued job to '${sourceQueue}' (attempt ${attempt}/${MAX_RETRIES}): ${message}`);
        return { deadLettered: false, attempt };
    }

    await publish(channel, DEAD_LETTER_QUEUE, {
        sourceQueue,
        failedAt: new Date().toISOString(),
        attempts: attempt - 1,
        error: message,
        payload,
    });
    console.error(`[💀] Job exhausted ${MAX_RETRIES} retries; parked in '${DEAD_LETTER_QUEUE}': ${message}`);
    return { deadLettered: true, attempt };
}
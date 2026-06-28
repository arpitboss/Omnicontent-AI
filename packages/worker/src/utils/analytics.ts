// packages/worker/src/utils/analytics.ts
//
// Thin PostHog wrapper for the worker. Opt-in: if POSTHOG_KEY is not set, every call
// is a no-op. Events are keyed by the Clerk user id to match the frontend identify call,
// so "atomization_completed" lines up with the rest of the activation funnel.
import { PostHog } from 'posthog-node';

const key = process.env.POSTHOG_KEY;
const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

const client = key ? new PostHog(key, { host }) : null;

if (client) {
    console.log('[📊] PostHog analytics enabled (worker).');
} else {
    console.log('[ℹ️] POSTHOG_KEY not set — product analytics disabled (worker).');
}

/** Capture a product event. No-ops when analytics is disabled or there is no user id. */
export function track(distinctId: string | undefined | null, event: string, properties?: Record<string, unknown>): void {
    if (!client || !distinctId) return;
    client.capture({ distinctId, event, properties });
}

/** Flush any buffered events. Call on graceful shutdown so the last batch isn't lost. */
export async function shutdownAnalytics(): Promise<void> {
    await client?.shutdown();
}
// packages/backend/src/utils/analytics.ts
//
// Thin PostHog wrapper for server-side product analytics. Opt-in: if POSTHOG_KEY is
// not set, every call is a no-op, so the app behaves identically without analytics.
// Events are keyed by the Clerk user id so they line up with the client-side
// posthog.identify(user.id) call in the frontend — letting funnels span client + server.
import { PostHog } from 'posthog-node';

const key = process.env.POSTHOG_KEY;
const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

const client = key ? new PostHog(key, { host }) : null;

if (client) {
    console.log('[📊] PostHog analytics enabled (backend).');
} else {
    console.log('[ℹ️] POSTHOG_KEY not set — product analytics disabled (backend).');
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

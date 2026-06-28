// packages/frontend/instrumentation-client.ts
//
// Sentry configuration for the browser. Next.js loads this automatically on the
// client. Opt-in: only initializes when NEXT_PUBLIC_SENTRY_DSN is configured.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV,
        tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
        // Session Replay is opt-in and off by default to avoid extra bundle weight/cost.
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        debug: false,
    });
}

// Instruments client-side navigations so Sentry can trace App Router transitions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

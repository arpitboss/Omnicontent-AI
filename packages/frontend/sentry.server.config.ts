// packages/frontend/sentry.server.config.ts
//
// Sentry configuration for the Next.js server (Node.js runtime). Loaded by
// instrumentation.ts. Opt-in: only initializes when a DSN is configured.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV,
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
        debug: false,
    });
}
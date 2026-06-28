// packages/frontend/instrumentation.ts
//
// Next.js calls register() once when the server starts. We lazily load the
// runtime-specific Sentry config so the correct SDK is initialized for the
// Node.js vs Edge runtime. onRequestError forwards server-side errors to Sentry.
import * as Sentry from '@sentry/nextjs';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config');
    }
}

export const onRequestError = Sentry.captureRequestError;

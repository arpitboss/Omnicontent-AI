// packages/worker/src/instrument.ts
//
// Sentry must be initialized BEFORE any other module (amqplib, mongoose, etc.) is
// imported, so it can auto-instrument them. Imported as the first line of index.ts.
//
// Initialization is opt-in: nothing is sent unless SENTRY_DSN is configured.
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config();

const dsn = process.env.SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
        sendDefaultPii: false,
    });
    console.log('[🛡️] Sentry initialized for worker.');
} else {
    console.log('[ℹ️] SENTRY_DSN not set — Sentry error monitoring is disabled.');
}
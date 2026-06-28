// packages/backend/src/instrument.ts
//
// Sentry must be initialized BEFORE any other module (express, http, mongoose) is
// imported, so it can auto-instrument them. This file is therefore imported as the
// very first line of index.ts.
//
// Initialization is opt-in: nothing is sent unless SENTRY_DSN is configured, so the
// app runs identically in local dev without a Sentry account.
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config();

const dsn = process.env.SENTRY_DSN;

if (dsn) {
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        // Sample 10% of requests for performance tracing by default; override via env.
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
        // Avoid sending PII (IPs, headers, cookies) unless explicitly enabled.
        sendDefaultPii: false,
    });
    console.log('[🛡️] Sentry initialized for backend.');
} else {
    console.log('[ℹ️] SENTRY_DSN not set — Sentry error monitoring is disabled.');
}
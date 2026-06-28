// packages/backend/src/middleware/rateLimit.ts
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * Build a rate-limit key from the authenticated Clerk user when available,
 * falling back to the client IP (IPv6-normalized) for unauthenticated requests.
 *
 * Keying by user id means a single account can't bypass limits by rotating IPs,
 * and many users behind one shared NAT/proxy IP won't throttle each other.
 */
function userOrIpKey(req: Request): string {
    const userId = req.auth?.userId;
    if (userId) return `user:${userId}`;
    return `ip:${ipKeyGenerator(req.ip ?? '0.0.0.0')}`;
}

interface LimiterConfig {
    windowMs: number;
    limit: number;
    message: string;
    code: string;
}

function buildLimiter({ windowMs, limit, message, code }: LimiterConfig) {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        keyGenerator: userOrIpKey,
        handler: (_req: Request, res: Response) => {
            res.status(429).json({ message, code });
        },
    });
}

/**
 * Global safety net for every API route. Generous enough for normal dashboard
 * polling, debounced auto-save, and real-time usage — strict enough to stop a
 * script from hammering the API.
 */
export const apiLimiter = buildLimiter({
    windowMs: 60 * 1000,
    limit: 300,
    message: 'Too many requests. Please slow down and try again shortly.',
    code: 'RATE_LIMITED',
});

/**
 * Strict limiter for expensive AI endpoints (Gemini video analysis, translation,
 * regeneration) and video jobs. Every call costs real money, so bursts are capped
 * well below anything a human would trigger by hand.
 */
export const aiLimiter = buildLimiter({
    windowMs: 60 * 1000,
    limit: 6,
    message: 'You are generating content too quickly. Please wait a moment before trying again.',
    code: 'AI_RATE_LIMITED',
});

/**
 * Limiter for cross-platform publishing. Protects the user's connected social
 * tokens from tripping LinkedIn / X / YouTube abuse detection.
 */
export const publishLimiter = buildLimiter({
    windowMs: 60 * 1000,
    limit: 15,
    message: 'Too many publish attempts. Please wait a moment before publishing again.',
    code: 'PUBLISH_RATE_LIMITED',
});

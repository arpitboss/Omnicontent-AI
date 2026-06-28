import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Mongoose model so the tests run with no real database/mongoose connection.
// requirePlan.ts imports the default export `Subscription` from this module.
vi.mock('../src/models/subscriptionModel', () => ({
    default: { findOne: vi.fn() },
}));

import Subscription from '../src/models/subscriptionModel';
import { requirePlan, getSubscription } from '../src/middleware/requirePlan';

// The mocked findOne; typed loosely since it's a Vitest mock at runtime.
const findOne = Subscription.findOne as any;

function mockRes() {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

function mockReqRes(userId?: string) {
    const req: any = { auth: userId ? { userId } : {} };
    const res = mockRes();
    const next = vi.fn();
    return { req, res, next };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('requirePlan middleware', () => {
    it('returns 401 when the request has no authenticated user', async () => {
        const { req, res, next } = mockReqRes(undefined);
        await requirePlan('pro')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 NO_SUBSCRIPTION when the user has no subscription record', async () => {
        findOne.mockResolvedValue(null);
        const { req, res, next } = mockReqRes('user_1');
        await requirePlan('pro')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NO_SUBSCRIPTION' }));
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 PLAN_INSUFFICIENT when the current plan is not allowed', async () => {
        findOne.mockResolvedValue({ plan: 'free', status: 'active' });
        const { req, res, next } = mockReqRes('user_1');
        await requirePlan('pro')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ code: 'PLAN_INSUFFICIENT', currentPlan: 'free' }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next() for an active subscription on an allowed plan', async () => {
        findOne.mockResolvedValue({ plan: 'pro', status: 'active' });
        const { req, res, next } = mockReqRes('user_1');
        await requirePlan('pro')(req, res, next);
        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('blocks trialing users from pro-only features with PRO_FEATURE_ONLY', async () => {
        findOne.mockResolvedValue({ plan: 'pro', status: 'trialing' });
        const { req, res, next } = mockReqRes('user_1');
        await requirePlan('pro')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'PRO_FEATURE_ONLY' }));
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 PAYMENT_PAST_DUE for past_due subscriptions', async () => {
        findOne.mockResolvedValue({ plan: 'pro', status: 'past_due' });
        const { req, res, next } = mockReqRes('user_1');
        await requirePlan('pro')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'PAYMENT_PAST_DUE' }));
    });

    it('returns 403 SUBSCRIPTION_INACTIVE for canceled or expired subscriptions', async () => {
        findOne.mockResolvedValue({ plan: 'pro', status: 'canceled' });
        const { req, res, next } = mockReqRes('user_1');
        await requirePlan('pro')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'SUBSCRIPTION_INACTIVE' }));
    });

    it('accepts any plan in the allowed list (e.g. pro or enterprise)', async () => {
        findOne.mockResolvedValue({ plan: 'enterprise', status: 'active' });
        const { req, res, next } = mockReqRes('user_1');
        await requirePlan('pro', 'enterprise')(req, res, next);
        expect(next).toHaveBeenCalledOnce();
    });

    it('returns 500 when the subscription lookup throws', async () => {
        findOne.mockRejectedValue(new Error('db down'));
        const { req, res, next } = mockReqRes('user_1');
        await requirePlan('pro')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('getSubscription', () => {
    it('returns null when no subscription exists', async () => {
        findOne.mockResolvedValue(null);
        const result = await getSubscription('user_1');
        expect(result).toBeNull();
    });

    it('auto-expires a trial whose end date has passed and persists the change', async () => {
        const save = vi.fn();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        findOne.mockResolvedValue({ status: 'trialing', trialEndsAt: yesterday, save });
        const result = await getSubscription('user_1');
        expect(result?.status).toBe('expired');
        expect(save).toHaveBeenCalledOnce();
    });

    it('does not expire a trial that is still within its window', async () => {
        const save = vi.fn();
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        findOne.mockResolvedValue({ status: 'trialing', trialEndsAt: tomorrow, save });
        const result = await getSubscription('user_1');
        expect(result?.status).toBe('trialing');
        expect(save).not.toHaveBeenCalled();
    });

    it('leaves an active subscription untouched', async () => {
        const save = vi.fn();
        findOne.mockResolvedValue({ status: 'active', plan: 'pro', save });
        const result = await getSubscription('user_1');
        expect(result?.status).toBe('active');
        expect(save).not.toHaveBeenCalled();
    });
});
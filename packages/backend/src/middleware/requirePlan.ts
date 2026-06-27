// packages/backend/src/middleware/requirePlan.ts
import express from 'express';
import Subscription from '../models/subscriptionModel';
import type { PlanType } from '../models/subscriptionModel';

/**
 * Express middleware factory that gates routes by subscription plan.
 * 
 * Usage:
 *   router.post('/translate', requireAuth(), requirePlan('pro'), handler)
 * 
 * Checks the user's subscription in MongoDB and verifies:
 * 1. A subscription record exists
 * 2. The plan is in the allowed list
 * 3. The subscription status is active or trialing (with valid trial date)
 */
export function requirePlan(...allowedPlans: PlanType[]) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const userId = req.auth?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const subscription = await Subscription.findOne({ userId });

            // No subscription record at all — user needs to start trial or upgrade
            if (!subscription) {
                return res.status(403).json({
                    message: 'This feature requires a subscription. Please start your free trial or upgrade to Pro.',
                    code: 'NO_SUBSCRIPTION',
                    requiredPlans: allowedPlans,
                });
            }

            // Check if the plan is in the allowed list
            if (!allowedPlans.includes(subscription.plan as PlanType)) {
                return res.status(403).json({
                    message: `This feature is only available on the ${allowedPlans.join(' or ')} plan. Please upgrade to continue.`,
                    code: 'PLAN_INSUFFICIENT',
                    currentPlan: subscription.plan,
                    requiredPlans: allowedPlans,
                });
            }

            // Check subscription status
            const { status } = subscription;

            if (status === 'active') {
                // All good — active paid subscription
                return next();
            }

            if (status === 'trialing') {
                return res.status(403).json({
                    message: 'This feature is not available during the free trial. Please upgrade to Pro to unlock it.',
                    code: 'PRO_FEATURE_ONLY',
                    currentPlan: subscription.plan,
                });
            }

            if (status === 'past_due') {
                return res.status(403).json({
                    message: 'Your payment is past due. Please update your billing information to continue.',
                    code: 'PAYMENT_PAST_DUE',
                    currentPlan: subscription.plan,
                });
            }

            // canceled, expired, none — all blocked
            return res.status(403).json({
                message: 'Your subscription is no longer active. Please upgrade to Pro to access this feature.',
                code: 'SUBSCRIPTION_INACTIVE',
                currentPlan: subscription.plan,
                currentStatus: status,
            });
        } catch (error) {
            console.error('[requirePlan] Error checking subscription:', error);
            return res.status(500).json({ message: 'Internal server error while checking subscription.' });
        }
    };
}

/**
 * Helper to get the user's subscription data without blocking.
 * Returns null if no subscription exists.
 */
export async function getSubscription(userId: string) {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) return null;

    // Auto-expire trials that have passed
    if (subscription.status === 'trialing' && subscription.trialEndsAt && new Date(subscription.trialEndsAt) <= new Date()) {
        subscription.status = 'expired';
        await subscription.save();
    }

    return subscription;
}

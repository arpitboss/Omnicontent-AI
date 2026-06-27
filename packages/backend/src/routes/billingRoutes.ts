// packages/backend/src/routes/billingRoutes.ts
import { requireAuth } from '@clerk/express';
import clerkClient from '@clerk/clerk-sdk-node';
import express from 'express';
import Stripe from 'stripe';
import Subscription from '../models/subscriptionModel';

require('dotenv').config();

// ─────────────────── Stripe Configuration ───────────────────

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '';
const STRIPE_PRO_YEARLY_PRICE_ID = process.env.STRIPE_PRO_YEARLY_PRICE_ID || '';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

const TRIAL_DURATION_DAYS = 7;
const FREE_ATOMIZATION_LIMIT = 3;

let stripe: Stripe | null = null;

if (STRIPE_SECRET_KEY) {
    stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' as any });
    console.log('[💳] Stripe initialized successfully.');
} else {
    console.warn('[⚠️] STRIPE_SECRET_KEY is not set. Billing features will be disabled.');
}

const router = express.Router();

// ─────────────────── Helper Functions ───────────────────

/**
 * Sync subscription state to Clerk publicMetadata so existing
 * sessionClaims?.metadata?.plan logic continues working.
 */
async function syncPlanToClerk(userId: string, plan: string): Promise<void> {
    try {
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { plan },
        });
        console.log(`[🔄] Synced plan="${plan}" to Clerk for user ${userId}`);
    } catch (err) {
        console.error(`[⚠️] Failed to sync plan to Clerk for user ${userId}:`, err);
    }
}

/**
 * Get or create a Stripe customer for the given Clerk user.
 */
async function getOrCreateStripeCustomer(userId: string): Promise<string> {
    if (!stripe) throw new Error('Stripe is not configured.');

    // Check if user already has a subscription record with a Stripe customer ID
    const existing = await Subscription.findOne({ userId });
    if (existing?.stripeCustomerId) {
        return existing.stripeCustomerId;
    }

    // Get user info from Clerk for Stripe customer metadata
    let email = '';
    let name = '';
    try {
        const user = await clerkClient.users.getUser(userId);
        email = user.emailAddresses?.[0]?.emailAddress || '';
        name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'OmniContent User';
    } catch {
        // Non-critical — proceed without name/email
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
        metadata: { clerkUserId: userId },
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
    });

    // Upsert the subscription record with the Stripe customer ID
    await Subscription.findOneAndUpdate(
        { userId },
        { stripeCustomerId: customer.id },
        { upsert: true, new: true }
    );

    console.log(`[💳] Created Stripe customer ${customer.id} for user ${userId}`);
    return customer.id;
}

// ═══════════════════ ROUTES ═══════════════════

// ─── Get Current Subscription ───
router.get('/subscription', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        let subscription = await Subscription.findOne({ userId });

        // If no subscription exists, return a default free state
        if (!subscription) {
            return res.json({
                plan: 'free',
                status: 'none',
                trialDaysLeft: null,
                atomizationsUsed: 0,
                atomizationsLimit: FREE_ATOMIZATION_LIMIT,
                cancelAtPeriodEnd: false,
                currentPeriodEnd: null,
            });
        }

        // Auto-expire trials
        if (subscription.status === 'trialing' && subscription.trialEndsAt && new Date(subscription.trialEndsAt) <= new Date()) {
            subscription.status = 'expired';
            await subscription.save();
            await syncPlanToClerk(userId, 'free');
        }

        // Calculate trial days left
        let trialDaysLeft: number | null = null;
        if (subscription.status === 'trialing' && subscription.trialEndsAt) {
            const msLeft = new Date(subscription.trialEndsAt).getTime() - Date.now();
            trialDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
        }

        const isActive = subscription.status === 'active' || (subscription.status === 'trialing' && trialDaysLeft !== null && trialDaysLeft > 0);

        res.json({
            plan: subscription.plan,
            status: subscription.status,
            trialDaysLeft,
            trialEndsAt: subscription.trialEndsAt,
            atomizationsUsed: subscription.atomizationsUsed,
            atomizationsLimit: subscription.plan === 'pro' && isActive ? -1 : FREE_ATOMIZATION_LIMIT,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            currentPeriodEnd: subscription.currentPeriodEnd,
            stripeCustomerId: subscription.stripeCustomerId,
        });
    } catch (error) {
        console.error('[Billing] Failed to fetch subscription:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ─── Start Free Trial ───
router.post('/start-trial', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Check if user already has/had a trial
        const existing = await Subscription.findOne({ userId });
        if (existing && existing.trialStartedAt) {
            // If trial was already started, check if it's still active
            if (existing.status === 'trialing' && existing.trialEndsAt && new Date(existing.trialEndsAt) > new Date()) {
                return res.status(400).json({ message: 'You already have an active trial.', code: 'TRIAL_ACTIVE' });
            }
            if (existing.status === 'active') {
                return res.status(400).json({ message: 'You already have an active Pro subscription.', code: 'ALREADY_PRO' });
            }
            // Trial already used and expired — must upgrade
            if (['expired', 'canceled'].includes(existing.status)) {
                return res.status(400).json({
                    message: 'Your free trial has already been used. Please upgrade to Pro to continue.',
                    code: 'TRIAL_ALREADY_USED',
                });
            }
        }

        const now = new Date();
        const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

        const subscription = await Subscription.findOneAndUpdate(
            { userId },
            {
                plan: 'free', // Trial users only get free features
                status: 'trialing',
                trialStartedAt: now,
                trialEndsAt: trialEnd,
            },
            { upsert: true, new: true }
        );

        // Sync to Clerk so existing plan logic works
        await syncPlanToClerk(userId, 'free');

        console.log(`[🎁] Started ${TRIAL_DURATION_DAYS}-day trial for user ${userId} (ends ${trialEnd.toISOString()})`);

        res.json({
            message: `${TRIAL_DURATION_DAYS}-day free trial started!`,
            trialEndsAt: trialEnd,
            plan: 'free',
            status: 'trialing',
        });
    } catch (error) {
        console.error('[Billing] Failed to start trial:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ─── Create Stripe Checkout Session ───
router.post('/checkout', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        if (!stripe) {
            return res.status(503).json({ message: 'Payment processing is not configured.' });
        }

        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { interval } = req.body; // 'monthly' or 'yearly'
        const priceId = interval === 'yearly' ? STRIPE_PRO_YEARLY_PRICE_ID : STRIPE_PRO_MONTHLY_PRICE_ID;

        if (!priceId) {
            return res.status(503).json({ message: `Stripe price for ${interval || 'monthly'} plan is not configured.` });
        }

        const customerId = await getOrCreateStripeCustomer(userId);

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/billing/cancel`,
            metadata: { clerkUserId: userId },
            subscription_data: {
                metadata: { clerkUserId: userId },
            },
            allow_promotion_codes: true,
        });

        console.log(`[💳] Created Checkout session ${session.id} for user ${userId}`);
        res.json({ url: session.url });
    } catch (error: any) {
        console.error('[Billing] Checkout session creation failed:', error);
        res.status(500).json({ message: error.message || 'Failed to create checkout session.' });
    }
});

// ─── Verify Session (For Local Testing without Webhooks) ───
router.post('/verify-session', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        if (!stripe) return res.status(503).json({ message: 'Stripe not configured' });
        const { session_id } = req.body;
        if (!session_id) return res.status(400).json({ message: 'Missing session ID' });

        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status === 'paid' && session.metadata?.clerkUserId) {
            const userId = session.metadata.clerkUserId;
            await Subscription.findOneAndUpdate(
                { userId },
                { plan: 'pro', status: 'active', stripeCustomerId: session.customer as string },
                { upsert: true, new: true }
            );
            await syncPlanToClerk(userId, 'pro');
        }
        res.json({ success: true });
    } catch (error) {
        console.error('[Billing] Failed to verify session:', error);
        res.status(500).json({ success: false });
    }
});

// ─── Create Stripe Customer Portal Session ───
router.post('/portal', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        if (!stripe) {
            return res.status(503).json({ message: 'Payment processing is not configured.' });
        }

        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const subscription = await Subscription.findOne({ userId });
        if (!subscription?.stripeCustomerId) {
            return res.status(400).json({ message: 'No billing account found. Please subscribe first.' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${FRONTEND_URL}/billing`,
        });

        console.log(`[💳] Created Portal session for user ${userId}`);
        res.json({ url: session.url });
    } catch (error: any) {
        console.error('[Billing] Portal session creation failed:', error);
        res.status(500).json({ message: error.message || 'Failed to open billing portal.' });
    }
});

// ─── Increment Atomization Counter ───
// Called internally when a user creates a new atomization job
router.post('/increment-usage', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const subscription = await Subscription.findOneAndUpdate(
            { userId },
            { $inc: { atomizationsUsed: 1 } },
            { upsert: true, new: true }
        );

        res.json({ atomizationsUsed: subscription.atomizationsUsed });
    } catch (error) {
        console.error('[Billing] Failed to increment usage:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ═══════════════════ STRIPE WEBHOOK ═══════════════════

/**
 * Stripe webhook handler. This endpoint receives raw body (not JSON parsed)
 * because Stripe signature verification requires the raw request body.
 * 
 * Must be mounted BEFORE express.json() middleware in the main app,
 * or use express.raw() specifically for this route.
 */
// Exported separately for mounting before express.json() in index.ts
export async function stripeWebhookHandler(req: express.Request, res: express.Response) {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
        console.warn('[⚠️] Webhook received but Stripe is not configured.');
        return res.sendStatus(400);
    }

    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
        console.error(`[❌] Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[🪝] Stripe webhook received: ${event.type}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const clerkUserId = session.metadata?.clerkUserId;
                const stripeSubscriptionId = session.subscription as string;

                if (clerkUserId && stripeSubscriptionId) {
                    // Fetch the subscription from Stripe for period details
                    const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

                    await Subscription.findOneAndUpdate(
                        { userId: clerkUserId },
                        {
                            plan: 'pro',
                            status: 'active',
                            stripeCustomerId: session.customer as string,
                            stripeSubscriptionId,
                            currentPeriodStart: new Date((stripeSub as any).current_period_start * 1000),
                            currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
                            cancelAtPeriodEnd: (stripeSub as any).cancel_at_period_end,
                            // Clear trial fields since they've upgraded
                            // Keep trialStartedAt for analytics
                        },
                        { upsert: true, new: true }
                    );

                    await syncPlanToClerk(clerkUserId, 'pro');
                    console.log(`[✅] Checkout completed for user ${clerkUserId} — now Pro!`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const clerkUserId = subscription.metadata?.clerkUserId;

                if (clerkUserId) {
                    const statusMap: Record<string, string> = {
                        'active': 'active',
                        'trialing': 'trialing',
                        'past_due': 'past_due',
                        'canceled': 'canceled',
                        'unpaid': 'past_due',
                        'incomplete': 'past_due',
                        'incomplete_expired': 'expired',
                        'paused': 'canceled',
                    };

                    const newStatus = statusMap[subscription.status] || 'expired';
                    const isActive = ['active', 'trialing'].includes(newStatus);

                    await Subscription.findOneAndUpdate(
                        { userId: clerkUserId },
                        {
                            status: newStatus,
                            plan: isActive ? 'pro' : 'free',
                            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                            cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
                        },
                        { upsert: true }
                    );

                    await syncPlanToClerk(clerkUserId, isActive ? 'pro' : 'free');
                    console.log(`[🔄] Subscription updated for user ${clerkUserId}: status=${newStatus}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const clerkUserId = subscription.metadata?.clerkUserId;

                if (clerkUserId) {
                    await Subscription.findOneAndUpdate(
                        { userId: clerkUserId },
                        {
                            status: 'canceled',
                            plan: 'free',
                            cancelAtPeriodEnd: false,
                        }
                    );

                    await syncPlanToClerk(clerkUserId, 'free');
                    console.log(`[❌] Subscription deleted for user ${clerkUserId} — downgraded to free.`);
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as any).subscription as string;

                if (subscriptionId) {
                    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
                    const clerkUserId = (stripeSub as any).metadata?.clerkUserId;

                    if (clerkUserId) {
                        await Subscription.findOneAndUpdate(
                            { userId: clerkUserId },
                            {
                                status: 'active',
                                plan: 'pro',
                                currentPeriodStart: new Date((stripeSub as any).current_period_start * 1000),
                                currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
                            }
                        );
                        console.log(`[💰] Payment succeeded for user ${clerkUserId}`);
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as any).subscription as string;

                if (subscriptionId) {
                    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
                    const clerkUserId = (stripeSub as any).metadata?.clerkUserId;

                    if (clerkUserId) {
                        await Subscription.findOneAndUpdate(
                            { userId: clerkUserId },
                            { status: 'past_due' }
                        );
                        console.log(`[⚠️] Payment failed for user ${clerkUserId} — marked past_due.`);
                    }
                }
                break;
            }

            default:
                console.log(`[🪝] Unhandled webhook event type: ${event.type}`);
        }
    } catch (err) {
        console.error(`[❌] Error processing webhook event ${event.type}:`, err);
        // Return 200 to acknowledge receipt — Stripe will retry on 4xx/5xx
    }

    res.sendStatus(200);
}

export default router;

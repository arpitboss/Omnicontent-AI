// packages/backend/src/models/subscriptionModel.ts
import mongoose from 'mongoose';

export type PlanType = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired' | 'none';

const subscriptionSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    stripeCustomerId: { type: String, default: '' },
    stripeSubscriptionId: { type: String, default: '' },
    plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free',
    },
    status: {
        type: String,
        enum: ['trialing', 'active', 'past_due', 'canceled', 'expired', 'none'],
        default: 'none',
    },
    // Trial tracking
    trialStartedAt: { type: Date },
    trialEndsAt: { type: Date },
    // Billing cycle tracking (from Stripe)
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    // Usage tracking for free plan limits
    atomizationsUsed: { type: Number, default: 0 },
    // Lifecycle email idempotency flags
    trialEndingEmailSentAt: { type: Date },
    publishNudgeSentAt: { type: Date },
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;

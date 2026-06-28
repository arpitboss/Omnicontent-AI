// packages/backend/src/utils/scheduler.ts
//
// Daily cron that drives scheduled lifecycle emails. Idempotency is enforced with
// per-user "sentAt" flags on the Subscription document, so re-running the job never
// double-emails. The scheduler only starts when RESEND_API_KEY is configured.
//
// Note: this assumes a single backend instance (Render's default). If you scale to
// multiple instances, move this to a dedicated cron worker to avoid duplicate runs.
import cron from 'node-cron';
import Subscription from '../models/subscriptionModel';
import Content from '../models/contentModel';
import { sendTrialEndingEmail, sendPublishNudgeEmail } from './email';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Email trial users whose trial ends within the next 2 days (once per trial). */
async function runTrialEndingCheck(): Promise<void> {
    const now = new Date();
    const soon = new Date(now.getTime() + 2 * DAY_MS);

    const subs = await Subscription.find({
        status: 'trialing',
        trialEndsAt: { $gte: now, $lte: soon },
        $or: [{ trialEndingEmailSentAt: { $exists: false } }, { trialEndingEmailSentAt: null }],
    });

    for (const sub of subs) {
        const ends = sub.trialEndsAt;
        if (!ends) continue;
        const daysLeft = Math.max(1, Math.ceil((ends.getTime() - now.getTime()) / DAY_MS));
        await sendTrialEndingEmail(sub.userId, daysLeft);
        sub.set('trialEndingEmailSentAt', new Date());
        await sub.save();
    }

    if (subs.length) console.log(`[⏰] Trial-ending check: emailed ${subs.length} user(s).`);
}

/** Nudge users who completed a job 2+ days ago but have never published successfully. */
async function runPublishNudgeCheck(): Promise<void> {
    const cutoff = new Date(Date.now() - 2 * DAY_MS);

    const userIds: string[] = await Content.distinct('userId', {
        status: 'COMPLETE',
        updatedAt: { $lte: cutoff },
    });

    let nudged = 0;
    for (const userId of userIds) {
        const hasPublished = await Content.exists({ userId, 'publishHistory.status': 'SUCCESS' });
        if (hasPublished) continue;

        const sub = await Subscription.findOne({ userId });
        if (sub?.get('publishNudgeSentAt')) continue;

        await sendPublishNudgeEmail(userId);
        await Subscription.findOneAndUpdate(
            { userId },
            { publishNudgeSentAt: new Date() },
            { upsert: true },
        );
        nudged++;
    }

    if (nudged) console.log(`[⏰] Publish-nudge check: emailed ${nudged} user(s).`);
}

/** Register the daily lifecycle-email cron. No-op unless email is configured. */
export function startScheduler(): void {
    if (!process.env.RESEND_API_KEY) {
        console.log('[ℹ️] RESEND_API_KEY not set — lifecycle email scheduler not started.');
        return;
    }
    if (process.env.DISABLE_CRON === 'true') {
        console.log('[ℹ️] DISABLE_CRON=true — lifecycle email scheduler not started.');
        return;
    }

    // Daily at 14:00 UTC.
    cron.schedule(
        '0 14 * * *',
        async () => {
            console.log('[⏰] Running daily lifecycle email checks...');
            try {
                await runTrialEndingCheck();
            } catch (err) {
                console.error('[⏰] Trial-ending check failed:', err);
            }
            try {
                await runPublishNudgeCheck();
            } catch (err) {
                console.error('[⏰] Publish-nudge check failed:', err);
            }
        },
        { timezone: 'UTC' },
    );

    console.log('[⏰] Lifecycle email scheduler started (daily 14:00 UTC).');
}

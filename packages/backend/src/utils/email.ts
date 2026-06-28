// packages/backend/src/utils/email.ts
//
// Lifecycle email sender built on Resend's REST API (called via native fetch — no SDK,
// so there's no React-email peer-dependency baggage). Opt-in: if RESEND_API_KEY is unset,
// every send is a no-op. These are the scheduled lifecycle emails (trial ending, publish
// nudge); transactional job emails live in the worker.
import clerkClient from '@clerk/clerk-sdk-node';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'OmniContent AI <onboarding@resend.dev>';
const APP_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

if (RESEND_API_KEY) {
    console.log('[📧] Resend lifecycle emails enabled (backend).');
} else {
    console.log('[ℹ️] RESEND_API_KEY not set — lifecycle emails disabled (backend).');
}

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function layout(opts: { heading: string; body: string; ctaText?: string; ctaUrl?: string }): string {
    const cta = opts.ctaText && opts.ctaUrl
        ? `<a href="${opts.ctaUrl}" style="display:inline-block;background:#10b981;color:#0a0a0a;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;margin-top:16px;">${opts.ctaText}</a>`
        : '';
    return `
    <div style="background:#0a0a0a;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:12px;padding:32px;">
        <div style="font-size:18px;font-weight:700;color:#10b981;margin-bottom:24px;">OmniContent AI</div>
        <h1 style="font-size:20px;color:#fafafa;margin:0 0 12px;">${opts.heading}</h1>
        <div style="font-size:14px;line-height:1.6;color:#a3a3a3;">${opts.body}</div>
        ${cta}
        <div style="font-size:12px;color:#525252;margin-top:32px;border-top:1px solid #262626;padding-top:16px;">
          You're receiving this because you have an OmniContent AI account.
        </div>
      </div>
    </div>`;
}

async function getUserEmail(userId: string): Promise<string | null> {
    try {
        const user = await clerkClient.users.getUser(userId);
        return user.emailAddresses?.[0]?.emailAddress || null;
    } catch (err) {
        console.error('[📧] Failed to fetch user email from Clerk:', err);
        return null;
    }
}

async function send(to: string, subject: string, html: string): Promise<void> {
    if (!RESEND_API_KEY) return;
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from: FROM, to, subject, html }),
        });
        if (!res.ok) {
            console.error(`[📧] Resend API error ${res.status}: ${await res.text()}`);
            return;
        }
        console.log(`[📧] Sent "${subject}" to ${to}`);
    } catch (err) {
        console.error('[📧] Failed to send email:', err);
    }
}

export async function sendTrialEndingEmail(userId: string, daysLeft: number): Promise<void> {
    if (!RESEND_API_KEY) return;
    const email = await getUserEmail(userId);
    if (!email) return;
    const dayLabel = daysLeft === 1 ? '1 day' : `${daysLeft} days`;
    const html = layout({
        heading: `Your free trial ends in ${dayLabel}`,
        body: 'Upgrade to Pro to keep unlimited atomizations, 6 clips per video, watermark-free exports, and one-click publishing to LinkedIn, YouTube, and X.',
        ctaText: 'Upgrade to Pro',
        ctaUrl: `${APP_URL}/billing`,
    });
    await send(email, `Your OmniContent trial ends in ${dayLabel}`, html);
}

export async function sendPublishNudgeEmail(userId: string): Promise<void> {
    if (!RESEND_API_KEY) return;
    const email = await getUserEmail(userId);
    if (!email) return;
    const html = layout({
        heading: "You're one click from going live",
        body: "You've generated content but haven't published it yet. Connect LinkedIn, YouTube, or X and ship your first post in seconds — your audience is waiting.",
        ctaText: 'Publish now',
        ctaUrl: `${APP_URL}/dashboard`,
    });
    await send(email, 'Your content is ready to publish', html);
}
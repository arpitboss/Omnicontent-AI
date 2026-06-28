// packages/worker/src/utils/email.ts
//
// Transactional job emails (atomization complete / failed) sent from the worker via
// Resend's REST API (native fetch, no SDK). Opt-in: if RESEND_API_KEY is unset, every
// send is a no-op. The user's email is resolved from Clerk at send time.
import clerkClient from '@clerk/clerk-sdk-node';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'OmniContent AI <onboarding@resend.dev>';
const APP_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

if (RESEND_API_KEY) {
    console.log('[📧] Resend transactional emails enabled (worker).');
} else {
    console.log('[ℹ️] RESEND_API_KEY not set — transactional emails disabled (worker).');
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

export async function sendJobCompleteEmail(userId: string, opts: { title: string; clips: number }): Promise<void> {
    if (!RESEND_API_KEY) return;
    const email = await getUserEmail(userId);
    if (!email) return;
    const clipLabel = opts.clips === 1 ? '1 clip' : `${opts.clips} clips`;
    const html = layout({
        heading: 'Your content is ready 🎉',
        body: `We turned <strong>${escapeHtml(opts.title)}</strong> into ${clipLabel}, a blog article, and ready-to-post social copy. Jump in to edit and publish.`,
        ctaText: 'Open dashboard',
        ctaUrl: `${APP_URL}/dashboard`,
    });
    await send(email, `✅ Your content is ready: ${opts.title}`, html);
}

export async function sendJobFailedEmail(userId: string): Promise<void> {
    if (!RESEND_API_KEY) return;
    const email = await getUserEmail(userId);
    if (!email) return;
    const html = layout({
        heading: "Your content generation didn't finish",
        body: 'Something went wrong while processing your video. No worries — head back and try again with a shorter clip or a different source.',
        ctaText: 'Try again',
        ctaUrl: `${APP_URL}/create`,
    });
    await send(email, "Your OmniContent generation didn't finish", html);
}
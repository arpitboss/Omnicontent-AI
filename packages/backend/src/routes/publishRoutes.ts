// packages/backend/src/routes/publishRoutes.ts
import { requireAuth } from '@clerk/express';
import crypto from 'crypto';
import express from 'express';
import SocialAccount from '../models/socialAccountModel';
import Content from '../models/contentModel';

require('dotenv').config();

const router = express.Router();

// ─────────────────── Configuration ───────────────────

const OAUTH_SECRET = process.env.INTERNAL_API_SECRET || 'default-oauth-secret';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '');

// LinkedIn
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const LINKEDIN_REDIRECT_URI = `${BACKEND_URL}/api/v1/publish/callback/linkedin`;

// YouTube / Google
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const YOUTUBE_REDIRECT_URI = `${BACKEND_URL}/api/v1/publish/callback/youtube`;

// ─────────────────── OAuth State Helpers ───────────────────

function createState(userId: string): string {
    const payload = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');
    const sig = crypto.createHmac('sha256', OAUTH_SECRET).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

function verifyState(state: string): { userId: string } | null {
    try {
        const [payload, sig] = state.split('.');
        if (!payload || !sig) return null;
        const expectedSig = crypto.createHmac('sha256', OAUTH_SECRET).update(payload).digest('base64url');
        if (sig !== expectedSig) return null;
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
        // 10 minute expiry
        if (Date.now() - data.ts > 10 * 60 * 1000) return null;
        return { userId: data.userId };
    } catch {
        return null;
    }
}

// ─────────────────── Token Refresh Helpers ───────────────────

async function getLinkedInToken(account: any): Promise<string> {
    // If token hasn't expired yet, use it
    if (account.expiresAt && new Date(account.expiresAt) > new Date()) {
        return account.accessToken;
    }
    // Try refreshing
    if (!account.refreshToken) {
        throw new Error('LinkedIn token expired and no refresh token available. Please reconnect.');
    }
    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: account.refreshToken,
            client_id: LINKEDIN_CLIENT_ID,
            client_secret: LINKEDIN_CLIENT_SECRET,
        }),
    });
    if (!res.ok) throw new Error('Failed to refresh LinkedIn token. Please reconnect.');
    const data = await res.json();
    account.accessToken = data.access_token;
    account.expiresAt = new Date(Date.now() + (data.expires_in || 5184000) * 1000);
    if (data.refresh_token) account.refreshToken = data.refresh_token;
    await account.save();
    return data.access_token;
}

async function getGoogleToken(account: any): Promise<string> {
    if (account.expiresAt && new Date(account.expiresAt) > new Date()) {
        return account.accessToken;
    }
    if (!account.refreshToken) {
        throw new Error('YouTube token expired and no refresh token available. Please reconnect.');
    }
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: account.refreshToken,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
        }),
    });
    if (!res.ok) throw new Error('Failed to refresh YouTube token. Please reconnect.');
    const data = await res.json();
    account.accessToken = data.access_token;
    account.expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);
    await account.save();
    return data.access_token;
}

// ═══════════════════ ROUTES ═══════════════════

// ─── List connected accounts ───
router.get('/accounts', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const accounts = await SocialAccount.find({ userId }).select(
            'platform profileName profileImageUrl platformUserId createdAt'
        );
        res.json(accounts);
    } catch (error) {
        console.error('Failed to list social accounts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ─── Initiate OAuth (returns auth URL, frontend handles redirect) ───
router.post('/connect/:platform', requireAuth(), async (req: express.Request, res: express.Response) => {
    const { platform } = req.params;
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const state = createState(userId);

    switch (platform) {
        case 'linkedin': {
            if (!LINKEDIN_CLIENT_ID) {
                return res.status(500).json({ message: 'LinkedIn integration is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.' });
            }
            const scopes = 'openid profile w_member_social';
            const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(scopes)}`;
            return res.json({ authUrl });
        }
        case 'youtube': {
            if (!GOOGLE_CLIENT_ID) {
                return res.status(500).json({ message: 'YouTube integration is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
            }
            const scopes = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile';
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
            return res.json({ authUrl });
        }
        default:
            return res.status(400).json({ message: `Unsupported platform: ${platform}` });
    }
});

// ─── OAuth Callback: LinkedIn ───
// NOTE: NOT behind requireAuth() — redirect comes from LinkedIn, not the user's authenticated browser
router.get('/callback/linkedin', async (req: express.Request, res: express.Response) => {
    const { code, state, error } = req.query;

    if (error) {
        console.error('[LinkedIn OAuth] Error:', error, req.query.error_description);
        return res.redirect(`${FRONTEND_URL}/dashboard?publish_error=${encodeURIComponent('LinkedIn authorization was denied.')}`);
    }

    const stateData = verifyState(state as string);
    if (!stateData) {
        return res.redirect(`${FRONTEND_URL}/dashboard?publish_error=${encodeURIComponent('Invalid or expired authorization. Please try again.')}`);
    }

    try {
        // Exchange code for tokens
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code as string,
                redirect_uri: LINKEDIN_REDIRECT_URI,
                client_id: LINKEDIN_CLIENT_ID,
                client_secret: LINKEDIN_CLIENT_SECRET,
            }),
        });

        if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            console.error('[LinkedIn OAuth] Token exchange failed:', errText);
            return res.redirect(`${FRONTEND_URL}/dashboard?publish_error=${encodeURIComponent('Failed to complete LinkedIn authorization.')}`);
        }

        const tokenData = await tokenRes.json();

        // Fetch user profile
        let profileName = 'LinkedIn User';
        let platformUserId = '';
        let profileImageUrl = '';

        const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (profileRes.ok) {
            const profile = await profileRes.json();
            profileName = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim() || 'LinkedIn User';
            platformUserId = profile.sub || '';
            profileImageUrl = profile.picture || '';
        }

        // Upsert social account
        await SocialAccount.findOneAndUpdate(
            { userId: stateData.userId, platform: 'linkedin' },
            {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || '',
                expiresAt: new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000),
                profileName,
                platformUserId,
                profileImageUrl,
            },
            { upsert: true, new: true }
        );

        console.log(`[✅] LinkedIn connected for user ${stateData.userId} (${profileName})`);
        return res.redirect(`${FRONTEND_URL}/dashboard?publish_connected=linkedin&profile=${encodeURIComponent(profileName)}`);
    } catch (err) {
        console.error('[LinkedIn OAuth] Callback error:', err);
        return res.redirect(`${FRONTEND_URL}/dashboard?publish_error=${encodeURIComponent('An unexpected error occurred during LinkedIn authorization.')}`);
    }
});

// ─── OAuth Callback: YouTube ───
router.get('/callback/youtube', async (req: express.Request, res: express.Response) => {
    const { code, state, error } = req.query;

    if (error) {
        console.error('[YouTube OAuth] Error:', error);
        return res.redirect(`${FRONTEND_URL}/dashboard?publish_error=${encodeURIComponent('YouTube authorization was denied.')}`);
    }

    const stateData = verifyState(state as string);
    if (!stateData) {
        return res.redirect(`${FRONTEND_URL}/dashboard?publish_error=${encodeURIComponent('Invalid or expired authorization. Please try again.')}`);
    }

    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code as string,
                redirect_uri: YOUTUBE_REDIRECT_URI,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
            }),
        });

        if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            console.error('[YouTube OAuth] Token exchange failed:', errText);
            return res.redirect(`${FRONTEND_URL}/dashboard?publish_error=${encodeURIComponent('Failed to complete YouTube authorization.')}`);
        }

        const tokenData = await tokenRes.json();

        let profileName = 'YouTube User';
        let platformUserId = '';
        let profileImageUrl = '';

        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (profileRes.ok) {
            const profile = await profileRes.json();
            profileName = profile.name || 'YouTube User';
            platformUserId = profile.id || '';
            profileImageUrl = profile.picture || '';
        }

        await SocialAccount.findOneAndUpdate(
            { userId: stateData.userId, platform: 'youtube' },
            {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || '',
                expiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
                profileName,
                platformUserId,
                profileImageUrl,
            },
            { upsert: true, new: true }
        );

        console.log(`[✅] YouTube connected for user ${stateData.userId} (${profileName})`);
        return res.redirect(`${FRONTEND_URL}/dashboard?publish_connected=youtube&profile=${encodeURIComponent(profileName)}`);
    } catch (err) {
        console.error('[YouTube OAuth] Callback error:', err);
        return res.redirect(`${FRONTEND_URL}/dashboard?publish_error=${encodeURIComponent('An unexpected error occurred during YouTube authorization.')}`);
    }
});

// ─── Disconnect a platform ───
router.delete('/disconnect/:platform', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const { platform } = req.params;
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        await SocialAccount.deleteOne({ userId, platform });
        console.log(`[🔌] ${platform} disconnected for user ${userId}`);
        res.json({ message: `${platform} disconnected successfully.` });
    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ═══════════════════ DIRECT PUBLISH ENDPOINTS ═══════════════════

// ─── Publish to LinkedIn ───
router.post('/linkedin/:contentId', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const { contentId } = req.params;
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const content = await Content.findOne({ _id: contentId, userId });
        if (!content) return res.status(404).json({ message: 'Content not found' });
        if (!content.linkedinPost) return res.status(400).json({ message: 'No LinkedIn post content generated for this item.' });

        const account = await SocialAccount.findOne({ userId, platform: 'linkedin' });
        if (!account) return res.status(400).json({ message: 'LinkedIn account not connected. Please connect first.' });

        const accessToken = await getLinkedInToken(account);

        // Call LinkedIn Posts API
        const postRes = await fetch('https://api.linkedin.com/rest/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': '202401',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify({
                author: `urn:li:person:${account.platformUserId}`,
                commentary: content.linkedinPost,
                visibility: 'PUBLIC',
                distribution: {
                    feedDistribution: 'MAIN_FEED',
                    targetEntities: [],
                    thirdPartyDistributionChannels: [],
                },
                lifecycleState: 'PUBLISHED',
            }),
        });

        if (!postRes.ok) {
            const errorData = await postRes.text();
            console.error(`[❌] LinkedIn publish failed (${postRes.status}):`, errorData);

            (content as any).publishHistory.push({
                platform: 'linkedin', status: 'FAILED',
                errorMessage: `LinkedIn API error (${postRes.status})`,
            });
            await content.save();

            return res.status(502).json({ message: 'LinkedIn rejected the post. Please try again or reconnect your account.' });
        }

        const postId = postRes.headers.get('x-restli-id') || '';
        const postUrl = postId ? `https://www.linkedin.com/feed/update/${postId}` : '';

        (content as any).publishHistory.push({
            platform: 'linkedin', status: 'SUCCESS', postUrl,
        });
        await content.save();

        console.log(`[✅] Published to LinkedIn: ${postUrl || contentId}`);
        res.json({ message: 'Published to LinkedIn!', postUrl });
    } catch (error: any) {
        console.error('[LinkedIn Publish] Error:', error);
        res.status(500).json({ message: error.message || 'Failed to publish to LinkedIn.' });
    }
});

// ─── Publish to YouTube Shorts ───
router.post('/youtube/:contentId/:clipId', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const { contentId, clipId } = req.params;
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const content = await Content.findOne({ _id: contentId, userId });
        if (!content) return res.status(404).json({ message: 'Content not found' });

        const clip = (content as any).clips.id(clipId);
        if (!clip || !clip.s3Url) return res.status(400).json({ message: 'Clip not found or not ready.' });

        const account = await SocialAccount.findOne({ userId, platform: 'youtube' });
        if (!account) return res.status(400).json({ message: 'YouTube account not connected. Please connect first.' });

        const accessToken = await getGoogleToken(account);

        // Download the clip from Cloudinary
        console.log(`[⬇️] Downloading clip from: ${clip.s3Url}`);
        const videoRes = await fetch(clip.s3Url);
        if (!videoRes.ok) throw new Error('Failed to download clip from storage.');
        const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
        console.log(`[📦] Clip downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB`);

        const title = `${(clip.title || content.generatedTitle || 'Short').substring(0, 90)} #Shorts`;
        const description = (clip.summary || (content as any).summary || 'Created with OmniContent AI').substring(0, 5000);

        // Step 1: Initialize resumable upload
        const initRes = await fetch(
            'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Upload-Content-Type': 'video/mp4',
                    'X-Upload-Content-Length': videoBuffer.length.toString(),
                },
                body: JSON.stringify({
                    snippet: {
                        title,
                        description,
                        categoryId: '22', // People & Blogs
                    },
                    status: {
                        privacyStatus: 'public',
                        selfDeclaredMadeForKids: false,
                    },
                }),
            }
        );

        if (!initRes.ok) {
            const errText = await initRes.text();
            console.error(`[❌] YouTube upload init failed (${initRes.status}):`, errText);
            (content as any).publishHistory.push({ platform: 'youtube', status: 'FAILED', errorMessage: `Upload init failed: ${initRes.status}` });
            await content.save();
            return res.status(502).json({ message: 'YouTube upload initiation failed.' });
        }

        const uploadUrl = initRes.headers.get('location');
        if (!uploadUrl) {
            (content as any).publishHistory.push({ platform: 'youtube', status: 'FAILED', errorMessage: 'No upload URL returned.' });
            await content.save();
            return res.status(502).json({ message: 'YouTube did not return an upload URL.' });
        }

        // Step 2: Upload the video
        console.log(`[⬆️] Uploading ${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB to YouTube...`);
        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Length': videoBuffer.length.toString(),
            },
            body: videoBuffer,
        });

        if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            console.error(`[❌] YouTube video upload failed (${uploadRes.status}):`, errText);
            (content as any).publishHistory.push({ platform: 'youtube', status: 'FAILED', errorMessage: `Upload failed: ${uploadRes.status}` });
            await content.save();
            return res.status(502).json({ message: 'YouTube video upload failed.' });
        }

        const uploadResult = await uploadRes.json();
        const videoId = uploadResult.id;
        const postUrl = `https://youtube.com/shorts/${videoId}`;

        (content as any).publishHistory.push({ platform: 'youtube', status: 'SUCCESS', postUrl });
        await content.save();

        console.log(`[✅] Published YouTube Short: ${postUrl}`);
        res.json({ message: 'Uploaded to YouTube Shorts!', postUrl, videoId });
    } catch (error: any) {
        console.error('[YouTube Publish] Error:', error);
        res.status(500).json({ message: error.message || 'Failed to upload to YouTube.' });
    }
});

export default router;

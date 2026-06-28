// packages/backend/src/routes/contentRoutes.ts
import { requireAuth } from '@clerk/express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import archiver from 'archiver';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Content from '../models/contentModel'; // Import the model
import { v2 as cloudinary } from 'cloudinary';
import { jsonrepair } from 'jsonrepair';
import axios from 'axios';

// Cloudinary is configured when this module loads via the import side-effect
import '../utils/cloudinary';
import Subscription from '../models/subscriptionModel';
import VoiceProfile from '../models/voiceProfileModel';
import { requirePlan, getSubscription } from '../middleware/requirePlan';
import { aiLimiter } from '../middleware/rateLimit';
import { publishJob } from '../utils/rabbitmq';
import { track } from '../utils/analytics';

require('dotenv').config();

// --- Security: SSRF Protection ---
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', 'metadata.google.internal', '169.254.169.254'];
const PRIVATE_IP_RANGES = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^0\./,
    /^fc00:/i,
    /^fd00:/i,
];

function isAllowedUrl(rawUrl: string): boolean {
    try {
        const parsed = new URL(rawUrl);
        // Only allow http/https schemes
        if (!['http:', 'https:'].includes(parsed.protocol)) return false;
        // Block known internal hostnames
        if (BLOCKED_HOSTS.includes(parsed.hostname)) return false;
        // Block private IP ranges
        if (PRIVATE_IP_RANGES.some(re => re.test(parsed.hostname))) return false;
        return true;
    } catch {
        return false;
    }
}

// --- Security: File-type validation ---
const ALLOWED_MIME_TYPES = [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
    'video/x-msvideo', 'video/mpeg', 'video/ogg',
];
const VIDEO_MAGIC_BYTES: { prefix: number[]; label: string }[] = [
    { prefix: [0x00, 0x00, 0x00], label: 'ftyp/moov (MP4/MOV)' }, // MP4/MOV (ftyp box, offset varies)
    { prefix: [0x1A, 0x45, 0xDF, 0xA3], label: 'WebM/MKV' },
    { prefix: [0x52, 0x49, 0x46, 0x46], label: 'AVI (RIFF)' },
    { prefix: [0x4F, 0x67, 0x67, 0x53], label: 'OGG' },
];

function hasValidVideoHeader(buffer: Buffer): boolean {
    if (buffer.length < 12) return false;
    // Check for ftyp box (MP4/MOV) — ftyp appears at byte 4
    if (buffer.toString('ascii', 4, 8) === 'ftyp') return true;
    // Check other magic bytes at offset 0
    return VIDEO_MAGIC_BYTES.some(({ prefix }) =>
        prefix.every((byte, i) => buffer[i] === byte)
    );
}

declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId?: string;
                sessionClaims?: any;
            };
        }
    }
}


const router = express.Router();

// Use memory storage instead of disk storage — Render's ephemeral filesystem
// doesn't have a persistent directory. We upload directly from buffer to Cloudinary.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

async function queueJob(payload: any, priority: boolean | null | undefined = false) {
    // Pro jobs use the priority lane so they aren't stuck behind free jobs.
    // Durable, publisher-confirmed publish over a shared connection (see utils/rabbitmq).
    await publishJob(priority ? 'content_jobs_priority' : 'content_jobs', payload);
}


// The ClerkExpressRequireAuth middleware will ensure the user is logged in
// and attach the user's auth info to req.auth
router.post('/atomize', requireAuth(), aiLimiter, async (req: express.Request, res: express.Response) => {
    try {
        const { url, clipLength, enableCaptions, timeframe, captionStyle, voiceTemplate, customPrompt } = req.body;
        const userId = req.auth?.userId;
        console.log("Received atomization request:", { url, clipLength, enableCaptions, timeframe });

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }

        // SSRF Protection: validate the URL before accepting it
        if (!isAllowedUrl(url)) {
            return res.status(400).json({ message: 'Invalid or blocked URL. Only public HTTP/HTTPS URLs are allowed.' });
        }

        // Subscription-based limits
        const subscription = await getSubscription(userId);
        const isPro = subscription && subscription.plan === 'pro' && subscription.status === 'active';
        const clipLimit = isPro ? 6 : 3;

        if (!subscription || subscription.status === 'none') {
            return res.status(403).json({
                message: 'Please start a free trial to create atomizations.',
                code: 'TRIAL_REQUIRED',
            });
        }

        if (['expired', 'canceled', 'past_due'].includes(subscription.status)) {
            return res.status(403).json({
                message: 'Your free trial or subscription has ended. Please upgrade to Pro to continue.',
                code: 'SUBSCRIPTION_INACTIVE',
            });
        }

        // Check atomization limit for free/trial users
        const FREE_ATOMIZATION_LIMIT = 3;
        if (!isPro) {
            const usageCount = subscription?.atomizationsUsed || 0;
            if (usageCount >= FREE_ATOMIZATION_LIMIT) {
                return res.status(403).json({
                    message: `You've reached the free limit of ${FREE_ATOMIZATION_LIMIT} projects. Please upgrade to Pro for unlimited atomizations.`,
                    code: 'ATOMIZATION_LIMIT_REACHED',
                    atomizationsUsed: usageCount,
                    atomizationsLimit: FREE_ATOMIZATION_LIMIT,
                });
            }
        }

        const newContent = new Content({ userId, sourceUrl: url, status: 'PENDING' });
        await newContent.save();

        // Increment usage counter
        await Subscription.findOneAndUpdate(
            { userId },
            { $inc: { atomizationsUsed: 1 } },
            { upsert: true }
        );

        const job = {
            url, userId, contentId: newContent._id,
            options: {
                clipLength, enableCaptions, clipLimit, timeframe, captionStyle,
                // Creative direction is a Pro feature — ignore it for non-Pro users.
                voiceTemplate: isPro ? voiceTemplate : undefined,
                customPrompt: isPro && typeof customPrompt === 'string' ? customPrompt.slice(0, 1000) : undefined,
            }
        };

        console.log("Queueing job:", job);

        await queueJob(job, isPro);

        track(userId, 'atomization_started', { source: 'url', clipLength, captionStyle });

        res.status(202).json({ message: 'Job accepted.', contentId: newContent._id });
    } catch (error) {
        console.error('Failed to queue job:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/atomize-file', requireAuth(), aiLimiter, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    // File-type validation: MIME type check
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ message: `Unsupported file type: ${req.file.mimetype}. Only video files are allowed.` });
    }

    // File-type validation: Magic byte check
    if (!hasValidVideoHeader(req.file.buffer)) {
        return res.status(400).json({ message: 'File content does not match a recognized video format.' });
    }

    const { clipLength, enableCaptions, timeframeStart, timeframeEnd, captionStyle, voiceTemplate, customPrompt } = req.body;
    const userId = req.auth?.userId;

    // Subscription-based limits
    const subscription = await getSubscription(userId!);
    const isPro = subscription && subscription.plan === 'pro' && subscription.status === 'active';
    const clipLimit = isPro ? 6 : 3;

    if (subscription && ['expired', 'canceled', 'past_due'].includes(subscription.status)) {
        return res.status(403).json({
            message: 'Your free trial or subscription has ended. Please upgrade to Pro to continue.',
            code: 'SUBSCRIPTION_INACTIVE',
        });
    }

    // Check atomization limit for non-Pro users
    const FREE_ATOMIZATION_LIMIT = 3;
    if (!isPro) {
        const usageCount = subscription?.atomizationsUsed || 0;
        if (usageCount >= FREE_ATOMIZATION_LIMIT) {
            return res.status(403).json({
                message: `You've reached the free limit of ${FREE_ATOMIZATION_LIMIT} projects. Please upgrade to Pro for unlimited atomizations.`,
                code: 'ATOMIZATION_LIMIT_REACHED',
                atomizationsUsed: usageCount,
                atomizationsLimit: FREE_ATOMIZATION_LIMIT,
            });
        }
    }

    try {
        // Upload buffer directly to Cloudinary using a stream
        const cloudUrl = await new Promise<string>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { 
                    resource_type: 'video', 
                    public_id: `omnicontent/sources/${Date.now()}_${Math.round(Math.random() * 1e9)}`,
                    overwrite: true 
                },
                (error: any, result: any) => {
                    if (error) reject(error);
                    else resolve(result.secure_url);
                }
            );
            stream.end(req.file!.buffer);
        });

        const newContent = new Content({
            userId,
            sourceUrl: cloudUrl,
            status: 'PENDING',
        });
        await newContent.save();

        const job = {
            url: cloudUrl, 
            userId, 
            contentId: newContent._id,
            options: {
                clipLength: Number(clipLength),
                enableCaptions: enableCaptions === 'true',
                clipLimit,
                timeframe: { start: timeframeStart, end: timeframeEnd },
                captionStyle,
                voiceTemplate: isPro ? voiceTemplate : undefined,
                customPrompt: isPro && typeof customPrompt === 'string' ? customPrompt.slice(0, 1000) : undefined,
            }
        };

        await queueJob(job, isPro);

        // Increment usage counter
        await Subscription.findOneAndUpdate(
            { userId },
            { $inc: { atomizationsUsed: 1 } },
            { upsert: true }
        );

        track(userId, 'atomization_started', { source: 'file' });

        res.status(202).json({ message: 'File upload accepted.', contentId: newContent._id });

    } catch (error) {
        console.error("File atomization error:", error);
        res.status(500).json({ message: 'Failed to queue file for processing.' });
    }
});

router.get('/', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const contents = await Content.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(contents);
    } catch (error) {
        console.error('Failed to fetch content:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/translate', requireAuth(), aiLimiter, requirePlan('pro'), async (req, res) => {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
        return res.status(400).json({ message: 'Text and target language are required.' });
    }

    try {
        // This can be a separate, simpler AI client instance
        const apiKey: string = process.env.GEMINI_API_KEY || "";
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in environment variables.");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: "v1" });

        const prompt = `Translate the following text into ${targetLanguage}. Return only the translated text, with no additional commentary or explanations:\n\n${text}`;
        const result = await model.generateContent(prompt);
        const translatedText = result.response.text();

        res.status(200).json({ translatedText });
    } catch (error) {
        console.error("Translation error:", error);
        res.status(500).json({ message: 'Failed to translate content.' });
    }
});

router.get('/:contentId/export-all', requireAuth(), requirePlan('pro'), async (req: express.Request, res: express.Response) => {
    try {
        const { contentId } = req.params;
        const userId = req.auth?.userId;

        const content = await Content.findOne({ _id: contentId, userId });
        if (!content) {
            return res.status(404).send('Content not found.');
        }

        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        // Tell the browser to download the file and give it a name
        res.attachment(`OmniContent_${contentId}.zip`);

        // Pipe the archive data to the response
        archive.pipe(res);

        // --- Add Text Files to the ZIP ---
        if (content.summary) archive.append(content.summary, { name: 'summary.txt' });
        
        if (content.generatedContent) {
            let articleMarkdown = content.generatedContent;
            let imageIndex = 1;

            // 1. Hero image — generated from the hero prompt (or title) via Pollinations and
            //    rendered client-side in the app, so we must fetch it here to embed it in the zip.
            const heroPrompt = content.heroImagePrompt || content.generatedTitle;
            if (heroPrompt) {
                try {
                    const heroUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(heroPrompt)}?width=1280&height=720&model=flux&nologo=true`;
                    const heroRes = await axios({ method: 'GET', url: heroUrl, responseType: 'arraybuffer', timeout: 20000 });
                    archive.append(Buffer.from(heroRes.data), { name: 'images/hero.jpg' });
                    articleMarkdown = `![${heroPrompt}](./images/hero.jpg)\n\n${articleMarkdown}`;
                } catch (err) {
                    console.error('[Export] Failed to fetch hero image:', err);
                }
            }

            // 2. Inline base64 data-URI images (uploaded/generated in the editor) → write them
            //    out as real files so the article .md isn't a wall of base64.
            const base64Regex = /!\[([^\]]*)\]\(data:image\/(\w+);base64,([^)]+)\)/g;
            let b64Match;
            const base64Images: { fullMatch: string; alt: string; ext: string; data: string }[] = [];
            while ((b64Match = base64Regex.exec(articleMarkdown)) !== null) {
                base64Images.push({ fullMatch: b64Match[0], alt: b64Match[1], ext: b64Match[2], data: b64Match[3] });
            }
            for (const img of base64Images) {
                const ext = img.ext === 'jpeg' ? 'jpg' : img.ext;
                const filename = `image_${imageIndex}.${ext}`;
                try {
                    archive.append(Buffer.from(img.data, 'base64'), { name: `images/${filename}` });
                    articleMarkdown = articleMarkdown.replace(img.fullMatch, `![${img.alt}](./images/${filename})`);
                    imageIndex++;
                } catch (err) {
                    console.error('[Export] Failed to decode embedded image:', err);
                }
            }

            // 3. Remote http(s) images → download into the zip.
            const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)/g;
            const imagesToDownload: { fullMatch: string; altText: string; imageUrl: string; filename: string }[] = [];
            let match;
            while ((match = imageRegex.exec(articleMarkdown)) !== null) {
                imagesToDownload.push({ fullMatch: match[0], altText: match[1], imageUrl: match[2], filename: `image_${imageIndex}.jpg` });
                imageIndex++;
            }
            for (const img of imagesToDownload) {
                try {
                    const response = await axios({ method: 'GET', url: img.imageUrl, responseType: 'stream', timeout: 15000 });
                    archive.append(response.data, { name: `images/${img.filename}` });
                    articleMarkdown = articleMarkdown.replace(img.fullMatch, `![${img.altText}](./images/${img.filename})`);
                } catch (err) {
                    console.error(`[Export] Failed to download image from URL: ${img.imageUrl}`, err);
                }
            }

            archive.append(articleMarkdown, { name: 'article.md' });
        }
        if (content.linkedinPost) archive.append(content.linkedinPost, { name: 'linkedin_post.txt' });
        if (content.transcript) {
            const transcriptText = content.transcript.map(t => `${t.timestamp} - ${t.text}`).join('\n');
            archive.append(transcriptText, { name: 'transcript.txt' });
        }
        if (content.twitterThread && content.twitterThread.length > 0) {
            archive.append(content.twitterThread.join('\n\n---\n\n'), { name: 'twitter_thread.txt' });
        }

        // --- Add Video Clip Files to the ZIP ---
        for (let index = 0; index < content.clips.length; index++) {
            const clip = content.clips[index];
            if (clip.status === 'READY' && clip.s3Url) {
                try {
                    // Fetch the video from Cloudinary as a stream
                    const response = await axios({
                        method: 'GET',
                        url: clip.s3Url,
                        responseType: 'stream',
                    });
                    
                    // Append the download stream directly into the zip archive
                    archive.append(response.data, { name: `clips/clip_${index + 1}.mp4` });
                } catch (err) {
                    console.error(`[Export] Failed to fetch clip from URL: ${clip.s3Url}`, err);
                }
            }
        }

        // Finalize the archive (no more files can be added)
        await archive.finalize();

    } catch (error) {
        console.error("Failed to create zip archive:", error);
        res.status(500).send('Error creating content archive.');
    }
});

router.post('/:contentId/clips/:clipId/reformat', requireAuth(), aiLimiter, requirePlan('pro'), async (req, res) => {
    const { contentId, clipId } = req.params;
    const { aspectRatio } = req.body;
    const userId = req.auth?.userId;

    try {
        const content = await Content.findOne({ _id: contentId, userId });
        const clip = content?.clips.id(clipId);
        if (!content || !clip) return res.status(404).send('Clip not found.');

        const newReformatJob = { aspectRatio, status: 'PENDING' };
        content.reformattedClips.push(newReformatJob);
        await content.save();
        const reformatJobId = content.reformattedClips[content.reformattedClips.length - 1]._id;

        const job = {
            contentId,
            clipId, // The worker will use this to find the clip data
            reformatJobId,
            aspectRatio,
            userId
        };

        await publishJob('reformatting_jobs', job);

        res.status(202).json({ message: 'Reformatting job accepted.', reformatJobId });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reformat clip.' });
    }
});

router.get('/:contentId/:videoId', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const { contentId, videoId } = req.params;
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const content = await Content.findOne({ _id: contentId, userId });
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        if (content.sourceUrl && content.sourceUrl.startsWith('http')) {
            res.redirect(content.sourceUrl);
        } else {
            // Path traversal protection: strip directory components
            const safeVideoId = path.basename(videoId);
            res.sendFile(safeVideoId, { root: path.join(__dirname, '../../public/sources') });
        }
    } catch (error) {
        console.error('Failed to fetch content:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// --- Helper to extract JSON from raw text response ---
function extractFirstJsonObject(text: string): string {
    const match = text.match(/{[\s\S]*}/);
    if (!match) throw new Error("No JSON object found in response.");
    return match[0];
}

// --- Helper to regenerate content from video transcript using Gemini ---
async function regenerateContentFromTranscript(transcriptSegments: any[], voiceProfile?: { samples?: string[]; description?: string }): Promise<{
    summary: string;
    generatedTitle: string;
    generatedContent: string;
    linkedinPost: string;
    twitterThread: string[];
}> {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in backend environment variables.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use rapid gemini-2.5-flash on the standard v1 endpoint
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
    }, { apiVersion: "v1" });

    const transcriptText = transcriptSegments.map(t => `${t.timestamp}: ${t.text}`).join("\n");

    // Brand voice: match the creator's past posts + style notes if configured.
    let voiceGuide = "";
    if (voiceProfile && ((Array.isArray(voiceProfile.samples) && voiceProfile.samples.length > 0) || voiceProfile.description)) {
        const samples = (voiceProfile.samples || [])
            .map((s: string, i: number) => `--- Example ${i + 1} ---\n${s}`)
            .join("\n\n");
        voiceGuide = `\n    CRITICAL — Write in the creator's own voice (tone, sentence length, vocabulary, emoji habits). Do not produce generic AI copy.${voiceProfile.description ? `\n    Style notes: ${voiceProfile.description}` : ""}${samples ? `\n    Examples of their past posts:\n${samples}` : ""}\n`;
    }

    const prompt = `
    You are a world-class ghostwriter for B2B founders and operators. ${voiceGuide}Based on the following video transcript segments, generate high-quality marketing assets:
    1. "summary": A concise one-paragraph summary.
    2. "generatedTitle": A catchy, SEO-optimized title for a blog article.
    3. "generatedContent": A beautifully structured blog post in Markdown format. Use H2 (##) headings, bullet points, and place visual suggestions exactly in this format: "[Image: Stock photo description suitable for stock search]".
    4. "linkedinPost": A professional post with emojis and hashtags.
    5. "twitterThread": A viral 3-5 tweet thread (array of strings, each tweet under 280 characters, numbered like 1/, 2/).

    Transcript text:
    ${transcriptText}

    Output must be a single, valid JSON object matching this schema. Do not include markdown wraps:
    {
      "summary": "...",
      "generatedTitle": "...",
      "generatedContent": "...",
      "linkedinPost": "...",
      "twitterThread": ["tweet 1", "tweet 2"]
    }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let parsed;
    try {
        const cleanJson = extractFirstJsonObject(responseText);
        parsed = JSON.parse(cleanJson);
    } catch {
        // Fallback: try jsonrepair for malformed output
        const repaired = jsonrepair(responseText);
        parsed = JSON.parse(repaired);
    }

    return {
        summary: parsed.summary || "",
        generatedTitle: parsed.generatedTitle || "",
        generatedContent: parsed.generatedContent || "",
        linkedinPost: parsed.linkedinPost || "",
        twitterThread: parsed.twitterThread || []
    };
}

// --- Revert content to original draft / Backup restore ---
router.post('/:contentId/revert', requireAuth(), aiLimiter, async (req: express.Request, res: express.Response) => {
    try {
        const { contentId } = req.params;
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const content = await Content.findOne({ _id: contentId, userId });
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // 1. If originalGeneratedContent backup is present in DB, restore active fields immediately
        if (content.get('originalGeneratedContent')) {
            content.generatedTitle = content.get('originalTitle') || content.generatedTitle;
            content.summary = content.get('originalSummary') || content.summary;
            content.generatedContent = content.get('originalGeneratedContent') || content.generatedContent;
            content.linkedinPost = content.get('originalLinkedinPost') || content.linkedinPost;
            content.twitterThread = content.get('originalTwitterThread') || content.twitterThread;

            await content.save();
            console.log(`[🔄] User ${userId} reverted content ${contentId} from database backups`);
            return res.status(200).json(content);
        }

        // 2. Immediate Recovery Fallback: If no backups exist yet, dynamically regenerate from transcript using Gemini
        if (!content.transcript || content.transcript.length === 0) {
            return res.status(400).json({ message: 'Cannot revert or restore: Video transcript is missing from this project.' });
        }

        console.log(`[🔄] No DB backups found for content ${contentId}. Triggering dynamic Gemini transcript recovery...`);
        const voiceProfile = await VoiceProfile.findOne({ userId });
        const restored = await regenerateContentFromTranscript(content.transcript, voiceProfile?.enabled ? { samples: voiceProfile.samples, description: voiceProfile.description } : undefined);

        content.generatedTitle = restored.generatedTitle;
        content.originalTitle = restored.generatedTitle;
        content.summary = restored.summary;
        content.originalSummary = restored.summary;
        content.generatedContent = restored.generatedContent;
        content.originalGeneratedContent = restored.generatedContent;
        content.linkedinPost = restored.linkedinPost;
        content.originalLinkedinPost = restored.linkedinPost;
        content.twitterThread = restored.twitterThread;
        content.originalTwitterThread = restored.twitterThread;

        await content.save();
        console.log(`[🔄] User ${userId} recovered content ${contentId} via transcript-based Gemini regeneration`);
        res.status(200).json(content);
    } catch (error: any) {
        console.error('Failed to revert content:', error);
        res.status(500).json({ message: `Internal server error: ${error.message}` });
    }
});

// --- Explicitly force regeneration of all texts from the video transcript ---
router.post('/:contentId/regenerate', requireAuth(), aiLimiter, async (req: express.Request, res: express.Response) => {
    try {
        const { contentId } = req.params;
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const content = await Content.findOne({ _id: contentId, userId });
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        if (!content.transcript || content.transcript.length === 0) {
            return res.status(400).json({ message: 'Cannot regenerate: Transcript is missing.' });
        }

        console.log(`[🔄] Forcing complete Gemini regeneration for content ${contentId}...`);
        const voiceProfile = await VoiceProfile.findOne({ userId });
        const regenerated = await regenerateContentFromTranscript(content.transcript, voiceProfile?.enabled ? { samples: voiceProfile.samples, description: voiceProfile.description } : undefined);

        content.generatedTitle = regenerated.generatedTitle;
        content.originalTitle = regenerated.generatedTitle;
        content.summary = regenerated.summary;
        content.originalSummary = regenerated.summary;
        content.generatedContent = regenerated.generatedContent;
        content.originalGeneratedContent = regenerated.generatedContent;
        content.linkedinPost = regenerated.linkedinPost;
        content.originalLinkedinPost = regenerated.linkedinPost;
        content.twitterThread = regenerated.twitterThread;
        content.originalTwitterThread = regenerated.twitterThread;

        await content.save();
        console.log(`[🔄] User ${userId} regenerated content ${contentId} from transcript successfully.`);
        res.status(200).json(content);
    } catch (error: any) {
        console.error('Failed to force regenerate content:', error);
        res.status(500).json({ message: `Internal server error: ${error.message}` });
    }
});

// --- Update generated content (Premium features / Edit on the spot) ---
router.put('/:contentId', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const { contentId } = req.params;
        const userId = req.auth?.userId;
        const { generatedTitle, generatedContent, linkedinPost, twitterThread, summary, heroImagePrompt } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const content = await Content.findOne({ _id: contentId, userId });
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // Protection against accidental blank clears (like auto-saving after mistakenly selecting all & deleting)
        const isTryingToClearContent = 
            (generatedContent !== undefined && generatedContent.trim() === "") ||
            (summary !== undefined && summary.trim() === "") ||
            (linkedinPost !== undefined && linkedinPost.trim() === "") ||
            (twitterThread !== undefined && Array.isArray(twitterThread) && twitterThread.length === 0);

        if (isTryingToClearContent && req.query.force !== 'true') {
            return res.status(400).json({ 
                message: 'Draft update blocked: Accidental clear protection active. Empty drafts cannot be auto-saved. If you genuinely want to clear it, use ?force=true in the API query.' 
            });
        }

        if (generatedTitle !== undefined) content.generatedTitle = generatedTitle;
        if (generatedContent !== undefined) content.generatedContent = generatedContent;
        if (linkedinPost !== undefined) content.linkedinPost = linkedinPost;
        if (twitterThread !== undefined) content.twitterThread = twitterThread;
        if (summary !== undefined) content.summary = summary;
        if (heroImagePrompt !== undefined) content.heroImagePrompt = heroImagePrompt;

        await content.save();
        console.log(`[✏️] User ${userId} updated content ${contentId}`);
        res.status(200).json(content);
    } catch (error) {
        console.error('Failed to update content:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// --- Delete a content job (failed or stuck) ---
router.delete('/:contentId', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const { contentId } = req.params;
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const content = await Content.findOne({ _id: contentId, userId });
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        await Content.deleteOne({ _id: contentId, userId });
        console.log(`[🗑️] User ${userId} deleted content ${contentId} (status: ${content.status})`);
        res.status(200).json({ message: 'Content deleted successfully.' });
    } catch (error) {
        console.error('Failed to delete content:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;

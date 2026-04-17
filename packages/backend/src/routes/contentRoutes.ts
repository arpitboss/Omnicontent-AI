// packages/backend/src/routes/contentRoutes.ts
import { requireAuth } from '@clerk/express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import amqplib from 'amqplib';
import archiver from 'archiver';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Content from '../models/contentModel'; // Import the model
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary is configured when this module loads via the import side-effect
import '../utils/cloudinary';

require('dotenv').config();

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

// Allowed MIME types for video uploads
const ALLOWED_VIDEO_MIME_TYPES = new Set([
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-matroska',
    'video/mpeg',
    'video/3gpp',
    'video/x-ms-wmv',
]);

// Use memory storage instead of disk storage — Render's ephemeral filesystem
// doesn't have a persistent directory. We upload directly from buffer to Cloudinary.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

async function queueJob(payload: any) {
    const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    const connection = await amqplib.connect(rabbitMqUrl);
    const channel = await connection.createChannel();
    const queue = 'content_jobs';
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)));
    await channel.close();
    await connection.close();
}

/**
 * Returns true only for http/https URLs whose hostname is not a private,
 * loopback, or link-local address.  Rejects file://, data://, etc. and
 * prevents SSRF against internal network resources.
 */
function isAllowedUrl(rawUrl: string): boolean {
    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return false;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    const privatePatterns = [
        /^localhost$/,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^192\.168\./,
        /^169\.254\./,    // link-local / AWS metadata endpoint
        /^::1$/,
        /^0\.0\.0\.0$/,
        /^fd[0-9a-f]{2}:/i, // IPv6 ULA
    ];
    return !privatePatterns.some((re) => re.test(host));
}

/**
 * Checks the first few bytes (magic numbers) of a buffer to verify it is a
 * recognised video format, regardless of what the client claims in Content-Type.
 * Supports MP4/MOV (ISO Base Media), WebM/MKV, AVI (RIFF), and MPEG.
 */
function isVideoBuffer(buffer: Buffer): boolean {
    if (buffer.length < 12) return false;
    // MP4 / MOV / ISO Base Media: bytes 4–7 == "ftyp"
    if (buffer.slice(4, 8).toString('ascii') === 'ftyp') return true;
    // WebM / Matroska: EBML header starts with 0x1A 0x45 0xDF 0xA3
    if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) return true;
    // AVI: RIFF container (bytes 0–3 == "RIFF") AND bytes 8–11 == "AVI "
    // (distinguishes AVI from other RIFF-based formats such as WAV audio)
    if (buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
        buffer.slice(8, 12).toString('ascii') === 'AVI ') return true;
    // MPEG-1/2: bytes 0–2 == 0x00 0x00 0x01, byte 3 == 0xB3 (video) or 0xBA (pack header)
    if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 &&
        (buffer[3] === 0xB3 || buffer[3] === 0xBA)) return true;
    return false;
}


// The ClerkExpressRequireAuth middleware will ensure the user is logged in
// and attach the user's auth info to req.auth
router.post('/atomize', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const { url, clipLength, enableCaptions, timeframe, captionStyle } = req.body;
        const userId = req.auth?.userId;
        const sessionClaims = req.auth?.sessionClaims as any;
        console.log("Received atomization request:", { url, clipLength, enableCaptions, timeframe });

        const plan = sessionClaims?.metadata?.plan || 'free';
        const clipLimit = plan === 'pro' ? 6 : 3;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }
        if (!isAllowedUrl(url)) {
            return res.status(400).json({ message: 'Invalid or disallowed URL.' });
        }

        const newContent = new Content({ userId, sourceUrl: url, status: 'PENDING' });
        await newContent.save();

        const job = {
            url, userId, contentId: newContent._id,
            options: { clipLength, enableCaptions, clipLimit, timeframe, captionStyle }
        };

        console.log("Queueing job:", job);

        await queueJob(job);

        res.status(202).json({ message: 'Job accepted.', contentId: newContent._id });
    } catch (error) {
        console.error('Failed to queue job:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/atomize-file', requireAuth(), upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    if (!ALLOWED_VIDEO_MIME_TYPES.has(req.file.mimetype)) {
        return res.status(400).json({ message: 'Invalid file type. Only MP4, MOV, WebM, MKV, AVI, MPEG, 3GP, and WMV video files are accepted.' });
    }

    // Secondary check: validate actual file content via magic bytes so a client
    // cannot bypass the MIME type check by lying about Content-Type.
    if (!isVideoBuffer(req.file.buffer)) {
        return res.status(400).json({ message: 'File content does not match a recognised video format.' });
    }

    const { clipLength, enableCaptions, timeframeStart, timeframeEnd, captionStyle } = req.body;
    const userId = req.auth?.userId;
    const sessionClaims = req.auth?.sessionClaims as any;

    const plan = sessionClaims?.metadata?.plan || 'free';
    const clipLimit = plan === 'pro' ? 6 : 3;

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
                captionStyle
            }
        };

        await queueJob(job);

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

router.post('/translate', requireAuth(), async (req, res) => {
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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Translate the following text into ${targetLanguage}. Return only the translated text, with no additional commentary or explanations:\n\n${text}`;
        const result = await model.generateContent(prompt);
        const translatedText = result.response.text();

        res.status(200).json({ translatedText });
    } catch (error) {
        console.error("Translation error:", error);
        res.status(500).json({ message: 'Failed to translate content.' });
    }
});

router.get('/:contentId/export-all', requireAuth(), async (req: express.Request, res: express.Response) => {
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
        if (content.generatedContent) archive.append(content.generatedContent, { name: 'article.md' });
        if (content.linkedinPost) archive.append(content.linkedinPost, { name: 'linkedin_post.txt' });
        if (content.transcript) {
            const transcriptText = content.transcript.map(t => `${t.timestamp} - ${t.text}`).join('\n');
            archive.append(transcriptText, { name: 'transcript.txt' });
        }
        if (content.twitterThread && content.twitterThread.length > 0) {
            archive.append(content.twitterThread.join('\n\n---\n\n'), { name: 'twitter_thread.txt' });
        }

        // --- Add Video Clip Files to the ZIP ---
        content.clips.forEach((clip, index) => {
            if (clip.status === 'READY' && clip.s3Url) {
                // We get the local file path from the URL
                const clipFileName = path.basename(clip.s3Url);
                const clipFilePath = path.join(__dirname, `../../public/clips/${clipFileName}`);
                // Check if file exists before adding
                const fs = require('fs');
                if (fs.existsSync(clipFilePath)) {
                    archive.file(clipFilePath, { name: `clips/clip_${index + 1}.mp4` });
                } else {
                    console.warn(`[Export] Clip file not found: ${clipFilePath}`);
                }
            }
        });

        // Finalize the archive (no more files can be added)
        await archive.finalize();

    } catch (error) {
        console.error("Failed to create zip archive:", error);
        res.status(500).send('Error creating content archive.');
    }
});

router.post('/:contentId/clips/:clipId/reformat', requireAuth(), async (req, res) => {
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

        const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
        const connection = await amqplib.connect(rabbitMqUrl);
        const channel = await connection.createChannel();
        const queue = 'reformatting_jobs';
        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(job)));

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
            // Use path.basename() to strip any directory traversal sequences from the
            // user-supplied videoId parameter before passing it to sendFile.
            const safeVideoId = path.basename(videoId);
            res.sendFile(safeVideoId, { root: path.join(__dirname, '../../public/sources') });
        }
    } catch (error) {
        console.error('Failed to fetch content:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;

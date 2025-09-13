// packages/backend/src/routes/contentRoutes.ts
import express from 'express';
import amqplib from 'amqplib';
import Content from '../models/contentModel'; // Import the model
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from '@clerk/express';
import multer from 'multer';
import path from 'path';
import archiver from 'archiver';

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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/sources'));
    },
    filename: function (req, file, cb) {
        // Keep original extension
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({storage: storage});

async function queueJob(payload: any) {
    const connection = await amqplib.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'content_jobs';
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)));
    await channel.close();
    await connection.close();
}


// The ClerkExpressRequireAuth middleware will ensure the user is logged in
// and attach the user's auth info to req.auth
router.post('/atomize', requireAuth(), async (req: express.Request, res: express.Response) => {
    try {
        const { url, clipLength, enableCaptions, timeframe, captionStyle } = req.body;
        const userId = req.auth?.userId;
        const { sessionClaims } = req.auth?.sessionClaims;
        console.log("Received atomization request:", { url, clipLength, enableCaptions, timeframe, sessionClaims });

        const plan = sessionClaims?.metadata?.plan || 'free';
        const clipLimit = plan === 'pro' ? 6 : 3;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
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

    const { clipLength, enableCaptions, timeframeStart, timeframeEnd, captionStyle } = req.body;
    const userId = req.auth?.userId;
    const { sessionClaims } = req.auth?.sessionClaims;

    const plan = sessionClaims?.metadata?.plan || 'free';
    const clipLimit = plan === 'pro' ? 6 : 3;

    try {
        const newContent = new Content({
            userId,
            sourceUrl: path.basename(req.file.path), // Just store the filename
            localSourcePath: req.file.path, // Save the path where multer stored the file
            status: 'PENDING',
        });
        await newContent.save();

        const job = {
            userId, contentId: newContent._id,
            localSourcePath: newContent.localSourcePath,
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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
                archive.file(clipFilePath, { name: `clips/clip_${index + 1}.mp4` });
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

        const connection = await amqplib.connect('amqp://localhost');
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

        res.sendFile(videoId, { root: path.join(__dirname, '../../public/sources') });
    } catch (error) {
        console.error('Failed to fetch content:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;

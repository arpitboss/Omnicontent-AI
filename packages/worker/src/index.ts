// packages/worker/src/index.ts
// Initialize Sentry before any other import so it can auto-instrument amqplib/mongoose.
import './instrument';
import * as Sentry from '@sentry/node';
import clerkClient from '@clerk/clerk-sdk-node';
import amqplib from 'amqplib';
import { exec, execFile } from 'child_process';
import dotenv from 'dotenv';
import express from 'express';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { URL } from 'url';
import { promisify } from 'util';
import { atomizeVideoContent } from './aiService';
import Content from './models/contentModel';
import VoiceProfile from './models/voiceProfileModel';
import { reformatVideoAndAddCaptions } from './services/videoService';
import { parseTimestampToSeconds } from './utils/time';
import { publish, retryOrDeadLetter } from './utils/queue';
import { track } from './utils/analytics';
import { sendJobCompleteEmail, sendJobFailedEmail } from './utils/email';

dotenv.config();
const execPromise = promisify(exec);
const execFilePromise = promisify(execFile);
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || '';

// --- Security: URL validation (mirrors backend) ---
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
        if (!['http:', 'https:'].includes(parsed.protocol)) return false;
        if (BLOCKED_HOSTS.includes(parsed.hostname)) return false;
        if (PRIVATE_IP_RANGES.some(re => re.test(parsed.hostname))) return false;
        return true;
    } catch {
        return false;
    }
}

// Helper to send authenticated internal notifications
async function notifyBackend(backendUrl: string, body: Record<string, any>): Promise<void> {
    try {
        await fetch(`${backendUrl}/api/internal/notify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(INTERNAL_API_SECRET ? { 'x-internal-secret': INTERNAL_API_SECRET } : {}),
            },
            body: JSON.stringify(body),
        });
    } catch (err) {
        console.error(`[⚠️] Failed to notify backend:`, err);
    }
}

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// const processContentJob = async (job: { url: string; userId: string; contentId: string }) => {
//     console.log(`[▶️] Processing job for contentId: ${job.contentId}`);
//     // Define a persistent path in the backend's public directory
//     const sourceVideoPath = path.join(__dirname, `../../../backend/public/sources/${job.contentId}_source.mp4`);

//     try {
//         // 1. Get the full suite of content from the AI
//         const analysis = await atomizeVideoContent(job.url);

//         // 2. Download the source video ONCE
//         console.log(`[🔽] Caching source video at ${sourceVideoPath}`);
//         await execPromise(`yt-dlp -f bestvideo+bestaudio/best -o "${sourceVideoPath}" ${job.url}`);

//         // 3. Process video clips to save them locally
//         const clipsData = [];
//         for (const moment of analysis.viralMoments) {
//             const outputFileName = `${job.contentId}_${moment.startTime.toString().replace('.', '_')}_9x16`;
//             // For now, all clips are generated for the 'free' plan. This will be dynamic later.
//             const localUrl = await reformatVideoAndAddCaptions({
//                 sourceVideoPath: sourceVideoPath,
//                 wordEvents: moment.wordEvents,
//                 aspectRatio: '9:16',
//                 outputFileName: outputFileName,
//             });
//             clipsData.push({
//                 title: moment.title,
//                 summary: moment.summary,
//                 s3Url: localUrl,
//                 wordEvents: moment.wordEvents,
//             });
//         }

//         // For now, let's just use the first line of the blog post as the title.
//         // A more advanced prompt could ask Gemini to provide a title separately.
//         // const title = blogPost.split('\n')[0].replace('# ', '').trim();

//         // 3. Save everything to the database
//         await Content.findByIdAndUpdate(job.contentId, {
//             status: 'COMPLETED',
//             localSourcePath: sourceVideoPath,
//             generatedTitle: analysis.blogPostMarkdown.split('\n')[0].replace(/#+\s*/, '').trim(),
//             summary: analysis.summary,
//             generatedContent: analysis.blogPostMarkdown,
//             transcript: analysis.transcript,
//             linkedinPost: analysis.linkedinPost,
//             twitterThread: analysis.twitterThread,
//             clips: clipsData,
//         });

//         console.log(`[✅] Finished and saved all content for contentId: ${job.contentId}`);
//     } catch (error: any) {
//         console.error(`[❌] Failed to process job for ${job.contentId}:`, error);
//         await Content.findByIdAndUpdate(job.contentId, {
//             status: 'FAILED',
//             errorMessage: error.message,
//         });
//     }
//     // } finally {
//     //     // 4. Clean up the large source video file
//     //     if (existsSync(sourceVideoPath)) {
//     //         unlinkSync(sourceVideoPath);
//     //         console.log(`[🧹] Cleaned up source video file.`);
//     //     }
//     // }
// };

const startWorker = async () => {
    // Start dummy Express server for Render Web Service compatibility
    const app = express();
    const PORT = process.env.PORT || 8081;
    app.get('/', (req, res) => res.send('OmniContent Worker is running.'));
    app.listen(PORT, () => console.log(`Worker dummy server listening on port ${PORT}`));

    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Worker connected to MongoDB.');
    try {
        const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://localhost?heartbeat=60';
        console.log(`[⏳] Connecting to RabbitMQ...`);
        const connection = await amqplib.connect(rabbitMqUrl);
        console.log(`[✅] Worker connected to RabbitMQ!`);
        
        connection.on("error", (err) => console.error("RabbitMQ Connection Error:", err));
        connection.on("close", () => console.error("RabbitMQ Connection Closed"));

        // Confirm channel so publishes (video jobs, retries, dead-letters) are broker-acknowledged.
        const channel = await connection.createConfirmChannel();
        const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

        // WORKER 1: Fast Text & Caching ('content_jobs' + the Pro 'content_jobs_priority' lane)
        const textQueue = 'content_jobs';
        const priorityQueue = 'content_jobs_priority';
        await channel.assertQueue(textQueue, { durable: true });
        await channel.assertQueue(priorityQueue, { durable: true });

        const handleContentMessage = async (msg: any) => {
            if (msg) {
                const job = JSON.parse(msg.content.toString());
                const { contentId, url, localSourcePath, options, userId } = job;
                let finalSourcePath = localSourcePath;

                try {
                    await Content.findByIdAndUpdate(contentId, { status: 'GENERATING_TEXT' });

                    if (url && !localSourcePath) {
                        // Security: Validate URL before downloading
                        if (!isAllowedUrl(url)) {
                            throw new Error(`Blocked URL: ${url}. Only public HTTP/HTTPS URLs are allowed.`);
                        }

                        const tempDir = path.join('/tmp', 'omnicontent-sources');

                        // Ensure directory exists
                        if (!existsSync(tempDir)) {
                            console.log(`[📁] Creating directory: ${tempDir}`);
                            mkdirSync(tempDir, { recursive: true });
                        }

                        finalSourcePath = path.join(tempDir, `${contentId}_source.mp4`);

                        console.log(`[🔽] Caching source video for ${contentId}...`);
                        const cleanUrl = url.trim();

                        // Detect if URL is a direct download link (Cloudinary/S3) vs YouTube
                        const isDirectUrl = cleanUrl.includes('cloudinary.com') || 
                                            cleanUrl.includes('res.cloudinary.com') ||
                                            cleanUrl.match(/^https?:\/\/.+\.(mp4|webm|mkv|mov)(\?|$)/i);

                        if (isDirectUrl) {
                            // Direct HTTP download for Cloudinary/uploaded files — use execFile to prevent injection
                            console.log(`[▶️] Downloading from direct URL via curl...`);
                            try {
                                await execFilePromise('curl', ['-L', '-o', finalSourcePath, cleanUrl]);
                                console.log(`[✅] Direct download complete. Path: ${finalSourcePath}`);
                            } catch (execError: any) {
                                console.error(`[❌] Direct download failed!`);
                                console.error(`Error: ${execError.message}`);
                                throw new Error(`Failed to download video from URL: ${execError.message}`);
                            }
                        } else {
                            // YouTube / other platform download via yt-dlp — use execFile to prevent injection
                            const ytdlpArgs: string[] = [
                                '--js-runtimes', 'node',
                                '--remote-components', 'ejs:github',
                                '--force-ipv4',
                            ];
                            
                            if (process.env.YOUTUBE_COOKIES) {
                                const cookiesPath = path.join(__dirname, 'youtube_cookies.txt');
                                writeFileSync(cookiesPath, process.env.YOUTUBE_COOKIES);
                                ytdlpArgs.push('--cookies', cookiesPath);
                                console.log(`[🍪] Loaded YouTube cookies from environment.`);
                            } else {
                                console.log(`[⚠️] YOUTUBE_COOKIES env var not set. If YouTube blocks the download, add a Netscape cookies text to this variable in Render.`);
                            }

                            ytdlpArgs.push(
                                '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                                '--merge-output-format', 'mp4',
                                '--no-playlist',
                                '-o', finalSourcePath,
                                cleanUrl
                            );

                            console.log(`[▶️] Executing yt-dlp with safe args...`);
                            try {
                                const { stdout } = await execFilePromise('yt-dlp', ytdlpArgs);
                                console.log(`[✅] Caching complete. Path: ${finalSourcePath}`);
                                if (stdout) console.log(`[yt-dlp stdout]: ${stdout.slice(0, 200)}...`);
                            } catch (execError: any) {
                                console.error(`[❌] yt-dlp failed!`);
                                console.error(`Error: ${execError.message}`);
                                if (execError.stderr) console.error(`Stderr: ${execError.stderr}`);
                                throw new Error(`Failed to download video: ${execError.message}`);
                            }
                        }
                    } else {
                        console.log(`[💿] Using pre-uploaded file for ${contentId} at ${finalSourcePath}`);
                    }

                    await Content.findByIdAndUpdate(contentId, { localSourcePath: finalSourcePath });

                    // Inject the user's brand voice (if configured) so the AI writes like them.
                    if (userId) {
                        try {
                            const voiceProfile = await VoiceProfile.findOne({ userId });
                            if (voiceProfile?.enabled && ((voiceProfile.samples && voiceProfile.samples.length > 0) || voiceProfile.description)) {
                                options.voiceProfile = {
                                    samples: voiceProfile.samples,
                                    description: voiceProfile.description,
                                };
                                console.log(`[🎙️] Applied brand voice for user ${userId} (${voiceProfile.samples?.length || 0} samples).`);
                            }
                        } catch (voiceErr) {
                            console.error('[🎙️] Failed to load brand voice profile:', voiceErr);
                        }
                    }

                    const analysis = await atomizeVideoContent(finalSourcePath, options);

                    // Strictly enforce clipLimit (AI might hallucinate more clips than allowed)
                    const maxClips = options.clipLimit || 3;
                    const maxClipLength = options.clipLength || 30;
                    const safeViralMoments = (analysis.viralMoments || []).slice(0, maxClips);

                    const clipMetadata = safeViralMoments.map(moment => {
                        console.log(`[🕒] Parsing timestamps for moment: ${moment.title}`);
                        
                        const startTime = parseTimestampToSeconds(moment.startTime as any);
                        let rawEndTime = parseTimestampToSeconds(moment.endTime as any);
                        
                        // Strictly enforce clipLength (AI might ignore the prompt limit)
                        const endTime = Math.min(rawEndTime, startTime + maxClipLength);
                        console.log(`    Parsed: ${startTime} - ${endTime} (Clamped duration: ${endTime - startTime}s)`);

                        const wordEvents = (moment.wordEvents || [])
                            .map(ev => ({
                                word: ev.word,
                                start: parseTimestampToSeconds(ev.start as any),
                                end: parseTimestampToSeconds(ev.end as any),
                            }))
                            // Drop any captions that fall after the clamped endTime
                            .filter(ev => ev.start < endTime);

                        return {
                            title: moment.title,
                            summary: moment.summary,
                            hookVariants: Array.isArray(moment.hookVariants) ? moment.hookVariants.slice(0, 3) : [],
                            wordEvents: wordEvents,
                            status: 'PENDING',
                            startTime: startTime,
                            endTime: endTime,
                        };
                    });

                    const generatedTitle = analysis.blogPostMarkdown ? analysis.blogPostMarkdown.split('\n')[0].replace(/#+\s*/, '').trim() : "Untitled Project";

                    await Content.findByIdAndUpdate(contentId, {
                        status: clipMetadata.length > 0 ? 'GENERATING_VIDEOS' : 'FAILED',
                        errorMessage: clipMetadata.length === 0 ? 'AI failed to generate video clips (JSON truncation). Please try a shorter video.' : undefined,
                        localSourcePath: finalSourcePath,
                        summary: analysis.summary,
                        originalSummary: analysis.summary,
                        generatedTitle: generatedTitle,
                        originalTitle: generatedTitle,
                        generatedContent: analysis.blogPostMarkdown,
                        originalGeneratedContent: analysis.blogPostMarkdown,
                        transcript: analysis.transcript,
                        linkedinPost: analysis.linkedinPost,
                        originalLinkedinPost: analysis.linkedinPost,
                        twitterThread: analysis.twitterThread,
                        originalTwitterThread: analysis.twitterThread,
                        clips: clipMetadata,
                    });

                    const videoQueue = 'video_processing_jobs';
                    const content = await Content.findById(contentId);
                    for (const clip of content?.clips ?? []) {
                        const videoJob = { contentId, clipId: clip._id, options };
                        await publish(channel, videoQueue, videoJob);
                    }
                    console.log(`[✅] Text generation for ${contentId} complete. Queued ${content?.clips.length} video jobs.`);

                    // Success — acknowledge so the broker drops the source message.
                    channel.ack(msg);
                } catch (err) {
                    Sentry.captureException(err, { tags: { queue: 'content_jobs' }, extra: { contentId } });
                    const { deadLettered } = await retryOrDeadLetter(channel, msg, textQueue, job, err);
                    if (deadLettered) {
                        await Content.findByIdAndUpdate(contentId, { status: 'FAILED', errorMessage: (err as Error).message });
                    }
                    // Ack the original; a retry copy (or dead-letter copy) has been published.
                    channel.ack(msg);
                }
            }
        };

        // Pro jobs flow through the priority lane; both lanes share the same handler so a
        // flood of free jobs never blocks paid ones.
        channel.consume(priorityQueue, handleContentMessage);
        channel.consume(textQueue, handleContentMessage);

        // WORKER 2: Slow Video Clip Generation (Listens to 'video_processing_jobs')
        const videoQueue = 'video_processing_jobs';
        await channel.assertQueue(videoQueue, { durable: true });

        // CRITICAL: Process only 1 video at a time to avoid OOM crash on Render free tier (512MB RAM)
        channel.prefetch(1);

        channel.consume(videoQueue, async (msg) => {
            if (msg) {
                const { contentId, clipId, options } = JSON.parse(msg.content.toString());
                console.log(`[📹] Processing clip ${clipId} for content ${contentId}...`);

                try {
                    const content = await Content.findById(contentId);
                    const clip = content?.clips.id(clipId);
                    if (!content || !clip || !content.localSourcePath) throw new Error('Content or clip data not found.');

                    const user = await clerkClient.users.getUser(content.userId);
                    const plan = user.publicMetadata?.plan as 'pro' | 'free' || 'free';

                    const startTime = clip.startTime;
                    const endTime = clip.endTime;

                    const outputFileName = `${clipId}_9x16`;
                    const downloadUrl = await reformatVideoAndAddCaptions({
                        sourceVideoPath: content.localSourcePath,
                        wordEvents: clip.wordEvents,
                        aspectRatio: '9:16',
                        outputFileName: outputFileName,
                        startTime: startTime,
                        endTime: endTime,
                        plan: plan,
                        enableCaptions: options.enableCaptions,
                        captionStyle: options.captionStyle
                    });

                    await Content.updateOne(
                        { "clips._id": clipId },
                        { $set: { "clips.$.s3Url": downloadUrl, "clips.$.status": 'READY' } }
                    );
                    console.log(`[📹] Clip ${clipId} finished processing.`);
                } catch (err) {
                    Sentry.captureException(err, { tags: { queue: 'video_processing_jobs' }, extra: { contentId, clipId } });
                    await Content.updateOne({ "clips._id": clipId }, { $set: { "clips.$.status": 'FAILED' } });
                    console.error(`Failed to process video for clip ${clipId}:`, err);
                } finally {
                    // ACK even on failure so we don't get stuck in an infinite retry loop
                    channel.ack(msg);

                    // Check if all clips are done (including failures) to update parent status
                    const updatedContent = await Content.findById(contentId);
                    const allClipsProcessed = updatedContent?.clips.every(c => c.status === 'READY' || c.status === 'FAILED');

                    if (allClipsProcessed) {
                        const allFailed = updatedContent?.clips.every(c => c.status === 'FAILED');
                        if (allFailed) {
                            await Content.findByIdAndUpdate(contentId, { status: 'FAILED', errorMessage: 'All video clips failed to generate.' });
                            track(updatedContent?.userId, 'atomization_failed', { reason: 'all_clips_failed' });
                            if (updatedContent?.userId) await sendJobFailedEmail(updatedContent.userId);
                            console.log(`[❌] All clips for content ${contentId} failed. Job marked as FAILED.`);
                        } else {
                            await Content.findByIdAndUpdate(contentId, { status: 'COMPLETE' });
                            track(updatedContent?.userId, 'atomization_completed', { clips: updatedContent?.clips.length ?? 0 });
                            if (updatedContent?.userId) {
                                await sendJobCompleteEmail(updatedContent.userId, {
                                    title: updatedContent.generatedTitle || 'your project',
                                    clips: updatedContent.clips.length,
                                });
                            }
                            console.log(`[🎉] All clips for content ${contentId} are processed. Job is COMPLETE.`);
                        }
                    }
                }
            }
        });

        // WORKER 3: Fast On-Demand Reformatting (Listens to 'reformatting_jobs')
        const reformatQueue = 'reformatting_jobs';
        await channel.assertQueue(reformatQueue, { durable: true });
        
        console.log(`[🚀] Worker successfully fully initialized and listening on all queues!`);
        
        channel.consume(reformatQueue, async (msg) => {
            if (msg) {
                const job = JSON.parse(msg.content.toString());
                const { contentId, clipId, reformatJobId, aspectRatio, userId } = job;
                // const outputFileName = `${reformatJobId}_${aspectRatio.replace(':', 'x')}`;

                try {
                    await Content.updateOne({ _id: contentId, "reformattedClips._id": reformatJobId }, { $set: { "reformattedClips.$.status": 'PROCESSING' } });
                    const content = await Content.findById(contentId);
                    const clip = content?.clips.id(clipId);
                    if (!content || !clip || !content.localSourcePath) throw new Error('Source data for reformatting not found.');

                    const user = await clerkClient.users.getUser(content.userId);
                    const plan = user.publicMetadata?.plan as 'pro' | 'free' || 'free';

                    const startTime = clip.wordEvents && clip.wordEvents.length > 0 ? clip.wordEvents[0].start! : clip.startTime;
                    const endTime = clip.wordEvents && clip.wordEvents.length > 0 ? clip.wordEvents[clip.wordEvents.length - 1].end! : clip.endTime;
                    const outputFileName = `${reformatJobId}_${aspectRatio.replace(':', 'x')}`;
                    const captionStyle = 'default'; // Could be dynamic based on user preference

                    const downloadUrl = await reformatVideoAndAddCaptions({
                        sourceVideoPath: content.localSourcePath,
                        wordEvents: clip.wordEvents,
                        aspectRatio,
                        outputFileName,
                        startTime,
                        endTime,
                        plan: plan,
                        enableCaptions: true,
                        captionStyle: captionStyle
                    });

                    await Content.updateOne({ _id: contentId, "reformattedClips._id": reformatJobId }, { $set: { "reformattedClips.$.status": 'COMPLETE', "reformattedClips.$.url": downloadUrl } });

                    await notifyBackend(BACKEND_URL, { userId, downloadUrl, reformatJobId });

                    // Success — acknowledge so the broker drops the source message.
                    channel.ack(msg);
                } catch (err) {
                    Sentry.captureException(err, { tags: { queue: 'reformatting_jobs' }, extra: { contentId, clipId, reformatJobId, userId } });
                    const { deadLettered } = await retryOrDeadLetter(channel, msg, reformatQueue, job, err);
                    if (deadLettered) {
                        await Content.updateOne({ _id: contentId, "reformattedClips._id": reformatJobId }, { $set: { "reformattedClips.$.status": 'FAILED' } });
                        await notifyBackend(BACKEND_URL, { userId, reformatJobId, error: 'Failed to generate video.' });
                    }
                    console.error(`Reformatting job ${reformatJobId} failed:`, err);
                    // Ack the original; a retry copy (or dead-letter copy) has been published.
                    channel.ack(msg);
                }
            }
        });
    } catch (error) {
        Sentry.captureException(error, { tags: { phase: 'startup' } });
        console.error('Failed to start worker:', error);
    }
};

startWorker();

// packages/worker/src/index.ts
import clerkClient from '@clerk/clerk-sdk-node';
import amqplib from 'amqplib';
import { execFile } from 'child_process';
import dotenv from 'dotenv';
import express from 'express';
import { existsSync, mkdirSync } from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { promisify } from 'util';
import { atomizeVideoContent } from './aiService';
import Content from './models/contentModel';
import { reformatVideoAndAddCaptions } from './services/videoService';
import { parseTimestampToSeconds } from './utils/time';

dotenv.config();
const execFilePromise = promisify(execFile);

if (!process.env.INTERNAL_API_SECRET) {
    console.warn('[SECURITY] INTERNAL_API_SECRET is not set. Notify calls to the backend will be rejected with 403 until this variable is configured in both the backend and worker.');
}

/**
 * Returns true only for http/https URLs whose hostname is not a private or
 * link-local address.  Blocks SSRF and non-HTTP schemes.
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
        /^169\.254\./,    // link-local / AWS metadata
        /^::1$/,
        /^0\.0\.0\.0$/,
        /^fd[0-9a-f]{2}:/i, // IPv6 ULA
    ];
    return !privatePatterns.some((re) => re.test(host));
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

        const channel = await connection.createChannel();
        const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
        const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

        /** Build headers for internal notify calls, including the shared secret when set. */
        const buildNotifyHeaders = (): Record<string, string> => {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (INTERNAL_API_SECRET) headers['x-internal-secret'] = INTERNAL_API_SECRET;
            return headers;
        };

        // WORKER 1: Fast Text & Caching (Listens to 'content_jobs')
        const textQueue = 'content_jobs';
        await channel.assertQueue(textQueue, { durable: true });

        channel.consume(textQueue, async (msg) => {
            if (msg) {
                channel.ack(msg);
                const job = JSON.parse(msg.content.toString());
                const { contentId, url, localSourcePath, options } = job;
                let finalSourcePath = localSourcePath;

                try {
                    await Content.findByIdAndUpdate(contentId, { status: 'GENERATING_TEXT' });

                    if (url && !localSourcePath) {
                        const tempDir = path.join('/tmp', 'omnicontent-sources');

                        // Ensure directory exists
                        if (!existsSync(tempDir)) {
                            console.log(`[📁] Creating directory: ${tempDir}`);
                            mkdirSync(tempDir, { recursive: true });
                        }

                        finalSourcePath = path.join(tempDir, `${contentId}_source.mp4`);

                        console.log(`[🔽] Caching source video for ${contentId}...`);
                        const cleanUrl = url.trim();

                        // Reject non-HTTP(S) schemes and private/internal network addresses (SSRF guard)
                        if (!isAllowedUrl(cleanUrl)) {
                            throw new Error(`Blocked download from disallowed or private URL: ${cleanUrl}`);
                        }

                        // Detect if URL is a direct download link (Cloudinary/S3) vs YouTube
                        const isDirectUrl = cleanUrl.includes('cloudinary.com') || 
                                            cleanUrl.includes('res.cloudinary.com') ||
                                            cleanUrl.match(/^https?:\/\/.+\.(mp4|webm|mkv|mov)(\?|$)/i);

                        if (isDirectUrl) {
                            // Direct HTTP download for Cloudinary/uploaded files.
                            // Use execFile (no shell) to prevent command injection via URL.
                            console.log(`[▶️] Downloading from direct URL (curl, no shell): ${cleanUrl}`);
                            try {
                                await execFilePromise('curl', ['-L', '-o', finalSourcePath, cleanUrl]);
                                console.log(`[✅] Direct download complete. Path: ${finalSourcePath}`);
                            } catch (execError: any) {
                                console.error(`[❌] Direct download failed!`);
                                console.error(`Error: ${execError.message}`);
                                throw new Error(`Failed to download video from URL: ${execError.message}`);
                            }
                        } else {
                            // YouTube download via yt-dlp.
                            // Build args array (no shell) to prevent command injection via URL.
                            const ytdlpArgs: string[] = [
                                '--js-runtimes', 'node',
                                '--remote-components', 'ejs:github',
                                '--force-ipv4',
                            ];

                            if (process.env.YOUTUBE_COOKIES) {
                                const cookiesPath = path.join(__dirname, 'youtube_cookies.txt');
                                require('fs').writeFileSync(cookiesPath, process.env.YOUTUBE_COOKIES);
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
                                cleanUrl,
                            );

                            console.log(`[▶️] Executing yt-dlp (no shell) for: ${cleanUrl}`);

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

                    const analysis = await atomizeVideoContent(finalSourcePath, options);

                    const clipMetadata = (analysis.viralMoments || []).map(moment => {
                        console.log(`[🕒] Parsing timestamps for moment: ${moment.title}`);
                        console.log(`    Moment Keys: ${Object.keys(moment).join(', ')}`);
                        console.log(`    Raw startTime: ${moment.startTime} (${typeof moment.startTime})`);
                        console.log(`    Raw endTime: ${moment.endTime} (${typeof moment.endTime})`);

                        const startTime = parseTimestampToSeconds(moment.startTime as any);
                        const endTime = parseTimestampToSeconds(moment.endTime as any);
                        console.log(`    Parsed: ${startTime} - ${endTime} (Duration: ${endTime - startTime})`);

                        const wordEvents = (moment.wordEvents || []).map(ev => ({
                            word: ev.word,
                            start: parseTimestampToSeconds(ev.start as any),
                            end: parseTimestampToSeconds(ev.end as any),
                        }));

                        return {
                            title: moment.title,
                            summary: moment.summary,
                            wordEvents: wordEvents,
                            status: 'PENDING',
                            startTime: startTime,
                            endTime: endTime,
                        };
                    });

                    await Content.findByIdAndUpdate(contentId, {
                        status: 'GENERATING_VIDEOS',
                        localSourcePath: finalSourcePath,
                        summary: analysis.summary,
                        generatedTitle: analysis.blogPostMarkdown.split('\n')[0].replace(/#+\s*/, '').trim(),
                        generatedContent: analysis.blogPostMarkdown,
                        transcript: analysis.transcript,
                        linkedinPost: analysis.linkedinPost,
                        twitterThread: analysis.twitterThread,
                        clips: clipMetadata,
                    });

                    const videoQueue = 'video_processing_jobs';
                    await channel.assertQueue(videoQueue, { durable: true });
                    const content = await Content.findById(contentId);
                    content?.clips.forEach(clip => {
                        const videoJob = { contentId, clipId: clip._id, options };
                        channel.sendToQueue(videoQueue, Buffer.from(JSON.stringify(videoJob)));
                    });
                    console.log(`[✅] Text generation for ${contentId} complete. Queued ${content?.clips.length} video jobs.`);

                } catch (err) {
                    await Content.findByIdAndUpdate(contentId, { status: 'FAILED', errorMessage: (err as Error).message });
                }
            }
        });

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

                    // ACK only AFTER successful processing — if worker crashes, message stays in queue
                    channel.ack(msg);

                    // After updating, refetch the document to check the status of all clips
                    const updatedContent = await Content.findById(contentId);
                    const allClipsProcessed = updatedContent?.clips.every(c => c.status === 'READY' || c.status === 'FAILED');

                    if (allClipsProcessed) {
                        const allFailed = updatedContent?.clips.every(c => c.status === 'FAILED');
                        if (allFailed) {
                            await Content.findByIdAndUpdate(contentId, { status: 'FAILED', errorMessage: 'All video clips failed to generate.' });
                            console.log(`[❌] All clips for content ${contentId} failed. Job marked as FAILED.`);
                        } else {
                            await Content.findByIdAndUpdate(contentId, { status: 'COMPLETE' });
                            console.log(`[🎉] All clips for content ${contentId} are processed. Job is COMPLETE.`);
                        }
                    }
                } catch (err) {
                    await Content.updateOne({ "clips._id": clipId }, { $set: { "clips.$.status": 'FAILED' } });
                    console.error(`Failed to process video for clip ${clipId}:`, err);
                    // ACK even on failure so we don't get stuck in an infinite retry loop
                    channel.ack(msg);
                }
            }
        });

        // WORKER 3: Fast On-Demand Reformatting (Listens to 'reformatting_jobs')
        const reformatQueue = 'reformatting_jobs';
        await channel.assertQueue(reformatQueue, { durable: true });
        
        console.log(`[🚀] Worker successfully fully initialized and listening on all queues!`);
        
        channel.consume(reformatQueue, async (msg) => {
            if (msg) {
                channel.ack(msg);
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

                    const startTime = clip.wordEvents[0].start!;
                    const endTime = clip.wordEvents[clip.wordEvents.length - 1].end!;
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

                    await fetch(`${BACKEND_URL}/api/internal/notify`, {
                        method: 'POST', headers: buildNotifyHeaders(),
                        body: JSON.stringify({ userId, downloadUrl, reformatJobId }),
                    });
                } catch (err) {
                    await Content.updateOne({ _id: contentId, "reformattedClips._id": reformatJobId }, { $set: { "reformattedClips.$.status": 'FAILED' } });
                    await fetch(`${BACKEND_URL}/api/internal/notify`, {
                        method: 'POST', headers: buildNotifyHeaders(),
                        body: JSON.stringify({ userId, reformatJobId, error: 'Failed to generate video.' }),
                    });
                    console.error(`Reformatting job ${reformatJobId} failed:`, err);
                }
            }
        });
    } catch (error) {
        console.error('Failed to start worker:', error);
    }
};

startWorker();

import { exec } from 'child_process';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { uploadToCloudinary } from '../utils/cloudinary';

const execPromise = promisify(exec);

type CaptionStyle = 'default' | 'highlight' | 'karaoke';

// --- Security: Input sanitization for shell commands ---
// Since ffmpeg filter graphs require shell interpretation (exec), we validate inputs instead.
const SHELL_METACHARACTERS = /[;&|`$(){}!\n\r]/;

function validateFilePath(filePath: string, label: string): void {
    if (SHELL_METACHARACTERS.test(filePath)) {
        throw new Error(`[Security] Invalid characters in ${label}: ${filePath}`);
    }
}

function validateNumber(value: number, label: string): void {
    if (!Number.isFinite(value) || value < 0) {
        throw new Error(`[Security] Invalid ${label}: ${value}`);
    }
}

// Format seconds → ASS timestamp `H:MM:SS.cs` (single-digit hour, 2-digit centiseconds).
// libass silently drops malformed lines, so this format must be exact.
const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
const formatAssTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds - Math.floor(seconds)) * 100);
    return `${h}:${pad2(m)}:${pad2(s)}.${pad2(cs)}`;
};

// All style names use a single shared key ("Default") so the Dialogue rows always resolve.
const STYLE_BLOCKS: Record<CaptionStyle, string> = {
    // White text, thick black outline, mid-bottom alignment, large readable size for 1080×1920.
    default:   "Style: Default,Arial,68,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,1,2,40,40,180,1",
    // Yellow accent with shadow — pops over busy footage.
    highlight: "Style: Default,Impact,76,&H0000FFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,5,2,2,40,40,180,1",
    // Cyan/karaoke vibe.
    karaoke:   "Style: Default,Verdana,70,&H00FFFFFF,&H00FFAA00,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,1,2,40,40,180,1",
};

const generateAssFile = (
    wordEvents: any[],
    outputPath: string,
    style: CaptionStyle = 'default',
    /** Clip start in source-video seconds. wordEvents are absolute, the trimmed clip starts at 0,
     *  so we subtract `clipStart` to get caption times relative to the output clip. */
    clipStart: number = 0,
    /** Clip duration in seconds — used to clamp/skip events outside the trimmed window. */
    clipDuration: number = Number.POSITIVE_INFINITY,
) => {
    if (!wordEvents || !Array.isArray(wordEvents) || wordEvents.length === 0) {
        console.warn("[⚠️] No wordEvents provided for captions.");
        writeFileSync(outputPath, ""); // write empty file or skip
        return;
    }

    const header = `[Script Info]
Title: OmniContent AI Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${STYLE_BLOCKS[style] || STYLE_BLOCKS.default}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    // Group ~3 words per cue so the screen isn't a flicker-storm of single words.
    const WORDS_PER_CUE = 3;
    const cues: { start: number; end: number; text: string }[] = [];

    const valid = wordEvents.filter(e => e && typeof e.word === 'string' && e.word.trim());
    for (let i = 0; i < valid.length; i += WORDS_PER_CUE) {
        const group = valid.slice(i, i + WORDS_PER_CUE);
        const startAbs = Number(group[0].start);
        const endAbs   = Number(group[group.length - 1].end);
        if (!Number.isFinite(startAbs) || !Number.isFinite(endAbs)) continue;

        // Convert absolute → clip-relative.
        let start = startAbs - clipStart;
        let end   = endAbs   - clipStart;

        // Skip cues that fall entirely outside the trimmed window.
        if (end <= 0 || start >= clipDuration) continue;
        if (start < 0) start = 0;
        if (end > clipDuration) end = clipDuration;
        if (end <= start) continue;

        const text = group
            .map(g => String(g.word)
                .replace(/[\r\n]+/g, ' ')
                .replace(/\\/g, '')
                .replace(/[{}]/g, '')
                .trim())
            .filter(Boolean)
            .join(' ');

        if (!text) continue;
        cues.push({ start, end, text });
    }

    // Fallback: if the AI's word timestamps all fell outside the clip window (a common
    // cause of "missing captions"), distribute the words evenly across the clip so the
    // captions still appear and stay roughly in sync with the speech.
    if (cues.length === 0 && valid.length > 0 && Number.isFinite(clipDuration)) {
        const groups = Math.ceil(valid.length / WORDS_PER_CUE);
        const per = clipDuration / groups;
        let t = 0;
        for (let i = 0; i < valid.length; i += WORDS_PER_CUE) {
            const group = valid.slice(i, i + WORDS_PER_CUE);
            const text = group
                .map(g => String(g.word).replace(/[\r\n]+/g, ' ').replace(/\\/g, '').replace(/[{}]/g, '').trim())
                .filter(Boolean)
                .join(' ');
            if (text) cues.push({ start: t, end: Math.min(t + per, clipDuration), text });
            t += per;
        }
    }

    const events = cues
        .map(c => `Dialogue: 0,${formatAssTime(c.start)},${formatAssTime(c.end)},Default,,0,0,0,,${c.text}`)
        .join('\n');

    writeFileSync(outputPath, header + events + '\n');
};

export const reformatVideoAndAddCaptions = async (options: {
    sourceVideoPath: string;
    wordEvents: any[];
    aspectRatio: '9:16' | '1:1' | '4:5';
    outputFileName: string;
    startTime: number;
    endTime: number;
    plan: 'free' | 'pro';
    enableCaptions: boolean;
    captionStyle: CaptionStyle;
}): Promise<string> => {
    const { sourceVideoPath, wordEvents, aspectRatio, outputFileName, startTime, endTime, plan, enableCaptions, captionStyle } = options;

    // Security: Validate all inputs that will be interpolated into shell commands
    validateFilePath(sourceVideoPath, 'sourceVideoPath');
    validateFilePath(outputFileName, 'outputFileName');
    validateNumber(startTime, 'startTime');
    validateNumber(endTime, 'endTime');

    const tempDir = path.join(__dirname, '..', 'temp');
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

    const assFilePath = path.join(tempDir, `${outputFileName}.ass`);
    const finalClipPath = path.join(tempDir, `${outputFileName}.mp4`);

    const duration = endTime - startTime;
    if (duration <= 0) {
        throw new Error("Clip duration is zero or negative. Check AI timestamps.");
    }

    console.log(`[✍️] Generating stylized captions file (clipStart=${startTime}s, duration=${duration}s, ${wordEvents?.length ?? 0} words)...`);
    generateAssFile(wordEvents, assFilePath, captionStyle, startTime, duration);

    const ratios = { '9:16': 1080 / 1920, '1:1': 1, '4:5': 1080 / 1350 };
    // Free downscales to 720p to avoid Render OOM. Pro renders full HD (1080p) by default;
    // set PRO_CLIP_WIDTH=2160 once the worker runs on a higher-RAM instance to ship true 4K.
    const proWidth = Number(process.env.PRO_CLIP_WIDTH) || 1080;
    const targetW = plan === 'free' ? 720 : proWidth;
    const targetH = Math.round(targetW / ratios[aspectRatio]);

    // Optimize boxblur (from 20:5 to 10:2) to drastically reduce CPU/RAM usage
    let filterGraph = `[0:v]split[original][copy];[copy]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},boxblur=10:2[background];[original]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease[foreground];[background][foreground]overlay=(W-w)/2:(H-h)/2`;

    if (plan === 'free') {
        const watermarkText = "Made with OmniContent AI";
        // Improved watermark: Top-center, semi-transparent background, better font size
        filterGraph += `,drawtext=text='${watermarkText}':x=(w-text_w)/2:y=50:fontcolor=white@0.8:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=10`;
    }

    if (enableCaptions && wordEvents && wordEvents.length > 0) {
        // FIX: Ensure path is absolute and correctly formatted for FFmpeg
        const absoluteAssPath = path.resolve(assFilePath).replace(/\\/g, '\\\\').replace(/:/g, '\\:');
        filterGraph += `,subtitles='${absoluteAssPath}'`;
    }

    console.log('filter graph: ', filterGraph);

    // Encoding tuned for social platforms (IG Reels / YT Shorts / TikTok):
    //  - libx264 + yuv420p → universal compatibility (no green/black frames on mobile)
    //  - a real preset + CRF instead of `ultrafast` (which produced blocky, low-grade clips)
    //  - AAC 128k audio and +faststart so the file plays/streams instantly
    // Pro encodes at a lower CRF (higher quality); free stays slightly lighter for Render limits.
    const preset = 'veryfast';
    const crf = plan === 'free' ? 23 : 20;

    const ffmpegCommand = `ffmpeg -ss ${startTime} -i "${sourceVideoPath}" -t ${duration} -vf "${filterGraph}" -c:v libx264 -preset ${preset} -crf ${crf} -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${finalClipPath}" -y`;

    try {
        console.log(`[🔄] Clipping and reformatting to ${aspectRatio}... (Resolution: ${targetW}x${targetH}, CRF ${crf})`);
        // Generous timeout so the better preset isn't killed mid-encode on weak CPUs.
        await execPromise(ffmpegCommand, { timeout: 180000 });

        console.log(`[📤] Uploading clipped video to Cloudinary...`);
        const publicUrl = await uploadToCloudinary(finalClipPath, `omnicontent/clips/${outputFileName}`, true);
        
        console.log(`[✅] Correctly clipped and saved video at: ${publicUrl}`);
        return publicUrl;
    } catch (error: any) {
        console.error("--- FFMPEG PROCESSING FAILED ---");
        console.error("Command:", ffmpegCommand);
        console.error("Error details:", error.message);
        if (error.stderr) console.error("FFmpeg stderr:", error.stderr);
        throw new Error(`FFmpeg failed to process the video clip: ${error.message}`);
    } finally {
        if (existsSync(assFilePath)) unlinkSync(assFilePath);
        if (existsSync(finalClipPath)) unlinkSync(finalClipPath);
    }
};
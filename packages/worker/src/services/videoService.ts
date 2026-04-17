import { execFile } from 'child_process';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { uploadToCloudinary } from '../utils/cloudinary';

const execFilePromise = promisify(execFile);

type CaptionStyle = 'default' | 'highlight' | 'karaoke';

const generateAssFile = (wordEvents: any[], outputPath: string, style: CaptionStyle = 'default') => {
    if (!wordEvents || !Array.isArray(wordEvents) || wordEvents.length === 0) {
        console.warn("[⚠️] No wordEvents provided for captions.");
        writeFileSync(outputPath, ""); // write empty file or skip
        return;
    }

    const styles: Record<CaptionStyle, string> = {
        default: "Style: Default,Arial,70,&H00FFFFFF,&H000000FF,&H00222222,&H00000000,-1,0,0,0,100,100,0,0,1,3,1,2,10,10,120,1",
        highlight: "Style: Highlight,Impact,80,&H0000FFFF,&H000000FF,&H00000000,&H00FFFFFF,-1,0,0,0,100,100,0,0,1,4,2,2,10,10,120,1",
        karaoke: "Style: Karaoke,Verdana,75,&H00FFFFFF,&H000088FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,1,2,10,10,120,1"
    };

    const header = `[Script Info]
Title: OmniContent AI Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styles[style] || styles.default}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const events = wordEvents.filter(e => e && e.word) // skip invalid
        .map(event => {
            const start = new Date(event.start * 1000).toISOString().substr(11, 8) + '.' + (event.start % 1).toFixed(2).substr(2);
            const end = new Date(event.end * 1000).toISOString().substr(11, 8) + '.' + (event.end % 1).toFixed(2).substr(2);
            const cleanWord = event.word.replace(/[,.]/g, '').replace(/{/g, '').replace(/}/g, '');
            return `Dialogue: 0,${start},${end},Default,,0,0,0,,${cleanWord}`;
        }).join('\n');

    writeFileSync(outputPath, header + events);
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
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

    const assFilePath = path.join(tempDir, `${outputFileName}.ass`);
    const finalClipPath = path.join(tempDir, `${outputFileName}.mp4`);

    console.log(`[✍️] Generating stylized captions file...`);
    generateAssFile(wordEvents, assFilePath, captionStyle);

    const duration = endTime - startTime;
    if (duration <= 0) {
        throw new Error("Clip duration is zero or negative. Check AI timestamps.");
    }
    const ratios = { '9:16': 1080 / 1920, '1:1': 1, '4:5': 1080 / 1350 };
    const targetW = 1080;
    const targetH = Math.round(targetW / ratios[aspectRatio]);

    let filterGraph = `[0:v]split[original][copy];[copy]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},boxblur=20:5[background];[original]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease[foreground];[background][foreground]overlay=(W-w)/2:(H-h)/2`;

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

    const ffmpegArgs = [
        '-ss', String(startTime),
        '-i', sourceVideoPath,
        '-t', String(duration),
        '-vf', filterGraph,
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        finalClipPath,
        '-y',
    ];

    try {
        console.log(`[🔄] Clipping and reformatting to ${aspectRatio}...`);
        await execFilePromise('ffmpeg', ffmpegArgs);

        console.log(`[📤] Uploading clipped video to Cloudinary...`);
        const publicUrl = await uploadToCloudinary(finalClipPath, `omnicontent/clips/${outputFileName}`, true);
        
        console.log(`[✅] Correctly clipped and saved video at: ${publicUrl}`);
        return publicUrl;
    } catch (error: any) {
        console.error("--- FFMPEG PROCESSING FAILED ---");
        console.error("Args:", ffmpegArgs.join(' '));
        console.error("Error details:", error.message);
        if (error.stderr) console.error("FFmpeg stderr:", error.stderr);
        throw new Error(`FFmpeg failed to process the video clip: ${error.message}`);
    } finally {
        if (existsSync(assFilePath)) unlinkSync(assFilePath);
        if (existsSync(finalClipPath)) unlinkSync(finalClipPath);
    }
};
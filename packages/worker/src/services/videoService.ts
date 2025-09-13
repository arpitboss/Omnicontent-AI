// packages/worker/src/services/videoService.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { unlinkSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const execPromise = promisify(exec);

// This is the path to the public folder IN THE BACKEND PROJECT.
// This assumes your backend and worker are in the same `packages` directory.
const publicClipsDir = path.join(__dirname, '../../../backend/public/clips');

type CaptionStyle = 'default' | 'highlight' | 'karaoke';

const generateAssFile = (wordEvents: any[], outputPath: string, style: CaptionStyle = 'default') => {
    if (!wordEvents || !Array.isArray(wordEvents) || wordEvents.length === 0) {
        console.warn("[⚠️] No wordEvents provided for captions.");
        writeFileSync(outputPath, ""); // write empty file or skip
        return;
    }

    const styles: Record<CaptionStyle, string> = {
        default: "Style: Default,Arial,70,&H00FFFFFF,&H000000FF,&H00222222,&H00000000,-1,0,0,0,100,100,0,0,1,3,1,2,10,10,60,1",
        highlight: "Style: Highlight,Impact,80,&H0000FFFF,&H000000FF,&H00000000,&H00FFFFFF,-1,0,0,0,100,100,0,0,1,4,2,2,10,10,60,1",
        karaoke: "Style: Karaoke,Verdana,75,&H00FFFFFF,&H000088FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,1,2,10,10,60,1"
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
    if (!existsSync(publicClipsDir)) mkdirSync(publicClipsDir, { recursive: true });

    const assFilePath = path.join(tempDir, `${outputFileName}.ass`);
    const finalClipPath = path.join(publicClipsDir, `${outputFileName}.mp4`);


    console.log(`[✍️] Generating stylized captions file...`);
    // generateAssFile(wordEvents, assFilePath);

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
        filterGraph += `,drawtext=text='${watermarkText}':x=10:y=H-th-10:fontcolor=white:fontsize=32:box=1:boxcolor=black@0.5`;
    }

    if (enableCaptions && wordEvents && wordEvents.length > 0) {
        generateAssFile(wordEvents, assFilePath, captionStyle);
        // FIX: Ensure path is absolute and correctly formatted for FFmpeg
        const absoluteAssPath = path.resolve(assFilePath).replace(/\\/g, '\\\\').replace(/:/g, '\\:');
        filterGraph += `,subtitles='${absoluteAssPath}'`;
    }

    // const subtitlesFilter = `subtitles='${assFilePath.replace(/\\/g, '\\\\').replace(/:/g, '\\:')}'`;
    // filterGraph += `,${subtitlesFilter}`;
    console.log('filter graph: ', filterGraph);

    const ffmpegCommand = `ffmpeg -ss ${startTime} -i "${sourceVideoPath}" -t ${duration} -vf "${filterGraph}" -preset ultrafast -c:a copy "${finalClipPath}" -y`;

    try {
        console.log(`[🔄] Clipping and reformatting to ${aspectRatio}...`);
        await execPromise(ffmpegCommand);

        const publicUrl = `http://localhost:8080/clips/${outputFileName}.mp4`;
        console.log(`[✅] Correctly clipped and saved video at: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error("--- FFMPEG PROCESSING FAILED ---", error);
        throw new Error("FFmpeg failed to process the video clip.");
    } finally {
        if (existsSync(assFilePath)) unlinkSync(assFilePath);
    }
};

// export const processVideoSegment = async (
//     youtubeUrl: string,
//     startTime: number,
//     endTime: number,
//     outputFileName: string,
//     plan: 'free' | 'pro'
// ): Promise<string> => {
//     const tempDir = path.join(__dirname, '..', 'temp');
//     if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
//     if (!existsSync(publicClipsDir)) mkdirSync(publicClipsDir, { recursive: true });

//     const sourceVideoPath = path.join(tempDir, `source_${outputFileName}.mp4`);
//     const finalClipPath = path.join(publicClipsDir, `${outputFileName}.mp4`);
//     console.log("Saving clip to:", finalClipPath);
//     try {
//         // 1. Download the source video to a temporary location
//         await execPromise(`yt-dlp -f "best[ext=mp4]" -o "${sourceVideoPath}" ${youtubeUrl}`);

//         // 2. Build the FFmpeg command based on the user's plan
//         let ffmpegCommand: string;
//         if (plan === 'pro') {
//             ffmpegCommand = `ffmpeg -i "${sourceVideoPath}" -ss ${startTime} -to ${endTime} -c:a copy "${finalClipPath}"`;
//         } else {
//             const watermarkText = "Made with OmniContent AI";
//             ffmpegCommand = `ffmpeg -i "${sourceVideoPath}" -ss ${startTime} -to ${endTime} -vf "setdar=9/16,scale=-2:1920,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,drawtext=text='${watermarkText}':x=10:y=H-th-10:fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5" -c:a copy "${finalClipPath}"`;
//         }

//         // 3. Execute the command to create the clip in the backend's public folder
//         await execPromise(ffmpegCommand);

//         // 4. Construct and return the public URL for the locally-served clip
//         const publicUrl = `http://localhost:8080/clips/${outputFileName}.mp4`;
//         console.log(`[✅] Clip saved locally at: ${publicUrl}`);

//         return publicUrl;
//     } catch (error) {
//         console.error('Error in video processing pipeline:', error);
//         throw error;
//     } finally {
//         // 5. Clean up the temporary source file
//         if (existsSync(sourceVideoPath)) unlinkSync(sourceVideoPath);
//     }
// };
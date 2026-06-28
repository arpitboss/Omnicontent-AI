// packages/worker/src/aiService.ts
import {
    GoogleGenAI,
    createPartFromUri,
    createUserContent,
} from "@google/genai";
import { jsonrepair } from "jsonrepair";

require('dotenv').config();

export interface AtomizationResult {
    summary: string;
    blogPostMarkdown: string;
    transcript: string;
    linkedinPost: string;
    twitterThread: string[];
    viralMoments: {
        title: string;
        summary: string;
        startTime: number;
        endTime: number;
        wordEvents: { word: string; start: number; end: number }[];
    }[];
}

// Initialize the client using the API key from environment variable
const apiKey: string = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

// Model is configurable via env var so you can switch from Render dashboard without redeploying
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Fallback model chain: if the primary model is rate-limited or down, try the next one automatically.
const MODEL_FALLBACK_CHAIN = [
    PRIMARY_MODEL,
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-3-flash',
].filter((model, index, self) => self.indexOf(model) === index); // Deduplicate

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function uploadAndWait(filePath: string, mimeType: string) {
    let myfile = await ai.files.upload({ file: filePath, config: { mimeType } });
    console.log("📤 Uploaded file:", myfile);

    // Poll until processed
    while (!myfile.state || myfile.state.toString() !== "ACTIVE") {
        console.log("⏳ Processing file... state=", myfile.state);
        await sleep(5000);
        myfile = await ai.files.get({ name: myfile.name! });
    }
    console.log("✅ File ready:", myfile);
    return myfile;
}

/**
 * Attempts to generate content with automatic model failover.
 * If the primary model returns 429/503/overloaded, it cascades to the next fallback model.
 */
async function generateWithFailover(contents: any): Promise<{ text: string; modelUsed: string }> {
    for (let i = 0; i < MODEL_FALLBACK_CHAIN.length; i++) {
        const model = MODEL_FALLBACK_CHAIN[i];
        try {
            console.log(`[🤖] Attempting model: ${model} (${i + 1}/${MODEL_FALLBACK_CHAIN.length})`);
            const result = await ai.models.generateContent({ 
                model, 
                contents,
                config: {
                    responseMimeType: 'application/json',
                    maxOutputTokens: 65536,
                }
            });
            console.log(`[✅] Model ${model} succeeded.`);
            return { text: result.text!, modelUsed: model };
        } catch (error: any) {
            const status = error?.status || error?.code;
            const isRetryable = status === 429 || status === 503 ||
                                error?.message?.includes('RESOURCE_EXHAUSTED') ||
                                error?.message?.includes('overloaded') ||
                                error?.message?.includes('unavailable');

            if (isRetryable && i < MODEL_FALLBACK_CHAIN.length - 1) {
                console.warn(`[⚠️] Model ${model} failed (${status || 'unknown'}). Falling back to next model...`);
                await sleep(2000);
                continue;
            }

            console.error(`[❌] Model ${model} failed fatally:`, error.message || error);
            throw error;
        }
    }
    throw new Error('All models in the failover chain failed.');
}

export const atomizeVideoContent = async (source: string, options: any): Promise<AtomizationResult> => {
    console.log(`[🤖] Starting AI analysis with options:`, options);
    console.log(`[🤖] Model failover chain: ${MODEL_FALLBACK_CHAIN.join(' → ')}`);

    let timeframeConstraint = "";
    if (options.timeframe?.start && options.timeframe?.end) {
        timeframeConstraint = `CRITICAL: You must only analyze the video content between the timestamps ${options.timeframe.start} and ${options.timeframe.end}. All generated clips and content must come from this specific segment.`;
    }

    const prompt = `
        You are an A-list content strategist for top creators and brands. Your work is viral, professional, and has immense value. Analyze the provided video and deconstruct it into the following assets, formatted as a single, valid JSON object.

        ${timeframeConstraint}

        Based on the video, generate the following:
        1.  "summary": A concise, one-paragraph summary of the entire video.
        2.  "blogPostMarkdown": A high-quality blog post in the style of a top-tier Medium or Forbes article. It must include:
            - A compelling, SEO-optimized title (H1).
            - An engaging introduction that hooks the reader.
            - Well-structured sections with Markdown headings (##) and subheadings (###).
            - **Placeholders for visuals**, formatted exactly like this: "[Image: A vibrant, abstract image representing creative ideas]" or "[Image: A close-up of a person typing on a laptop]". Use descriptive terms suitable for a stock photo search.
        3.  "transcript": A structured transcript as an array of objects. CRITICAL: Combine multiple sentences into a single large text block (approx 30-60 seconds of speech) per object to keep the array small. Each object must have a "timestamp" (string, e.g., "01:23") and the corresponding "text" (string).
        4.  "linkedinPost": A professional post for LinkedIn. It must:
            - Start with a strong, relatable hook (e.g., "Ever struggle with...?").
            - Use bullet points with professional emojis (e.g., ✅, 💡, 🚀) to list 3-4 key insights.
            - End with a thought-provoking question to drive engagement.
            - Finish with 4-5 relevant, professional hashtags.
        5.  "twitterThread": A viral-style Twitter thread (an array of strings). It must:
            - Start with a powerful, curiosity-driving hook in the first tweet.
            - Use popular emojis to add personality (e.g., 🤯, 👉, 🔥).
            - Keep each tweet concise and under 280 characters.
            - Be numbered (1/, 2/, 3/).
            - End with a strong call-to-action and 3-4 high-traffic hashtags.
        6.  "viralMoments": An array of up to ${options.clipLimit} engaging video clips. Each clip must be under ${options.clipLength} seconds long. For each clip, provide a "title", "summary", "startTime" (number, in seconds), "endTime" (number, in seconds), and "wordEvents" with word-level timestamps for captions.

        Example of "viralMoments" structure:
        "viralMoments": [
            {
                "title": "Clip Title",
                "summary": "Clip Summary",
                "startTime": 10.5,
                "endTime": 25.0,
                "wordEvents": [
                    { "word": "Hello", "start": 10.5, "end": 10.9 },
                    { "word": "world", "start": 10.9, "end": 11.2 }
                ]
            }
        ]

        CRITICAL: All string values in the JSON must have special characters properly escaped. Double quotes inside strings must be escaped as \\". Newlines must be escaped as \\n. Backslashes must be escaped as \\\\.
        Your entire output must be a single, valid JSON object with the keys listed above.
    `;

    const myfile = await uploadAndWait(source, "video/mp4");
    const contents = createUserContent([
        createPartFromUri(myfile.uri!, myfile.mimeType!),
        prompt,
    ]);

    const { text, modelUsed } = await generateWithFailover(contents);
    console.log(`[🤖] Content generated successfully using model: ${modelUsed}`);
    console.log(`[🔍] Raw response length: ${text.length} chars`);
    console.log("[🔍] Response preview (first 300 chars):", text.slice(0, 300) + "...");

    // Step 1: Try direct parse — responseMimeType: 'application/json' should give us clean JSON
    try {
        const parsedResult: AtomizationResult = JSON.parse(text);
        parsedResult.viralMoments = parsedResult.viralMoments || [];
        console.log(`[✅] AI analysis complete. Found ${parsedResult.viralMoments.length} viral moments.`);
        return parsedResult;
    } catch (directError) {
        console.warn("[⚠️] Direct JSON.parse failed:", (directError as Error).message);
    }

    // Step 2: Try jsonrepair — handles truncation, trailing commas, unescaped chars, etc.
    try {
        console.log('[🔧] Attempting JSON repair with jsonrepair library...');
        const repaired = jsonrepair(text);
        const parsedResult: AtomizationResult = JSON.parse(repaired);
        parsedResult.viralMoments = parsedResult.viralMoments || [];
        console.log(`[✅] JSON repair succeeded. Found ${parsedResult.viralMoments.length} viral moments.`);
        return parsedResult;
    } catch (repairError) {
        console.error("FATAL: jsonrepair also failed:", (repairError as Error).message);
        console.error("Raw response (first 1000 chars):", text.slice(0, 1000));
        throw new Error("Failed to parse AI response as JSON even after repair.");
    }
};

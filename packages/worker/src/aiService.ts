// packages/worker/src/aiService.ts
import {
    GoogleGenAI,
    Type,
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
        hookVariants: string[];
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
 * Strict JSON schema that activates Gemini's constrained decoding.
 * With this schema, the model physically cannot produce invalid JSON —
 * every token is validated against the schema at generation time.
 */
const ATOMIZATION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A concise, one-paragraph summary of the entire video.",
        },
        blogPostMarkdown: {
            type: Type.STRING,
            description: "A high-quality blog post in Markdown format.",
        },
        transcript: {
            type: Type.ARRAY,
            description: "Video transcript grouped into ~30-60 second blocks.",
            items: {
                type: Type.OBJECT,
                properties: {
                    timestamp: { type: Type.STRING },
                    text: { type: Type.STRING },
                },
                required: ["timestamp", "text"],
            },
        },
        linkedinPost: {
            type: Type.STRING,
            description: "A professional LinkedIn post with emojis and hashtags.",
        },
        twitterThread: {
            type: Type.ARRAY,
            description: "A viral Twitter thread as an array of tweet strings.",
            items: { type: Type.STRING },
        },
        viralMoments: {
            type: Type.ARRAY,
            description: "Engaging video clips with word-level timestamps.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    hookVariants: {
                        type: Type.ARRAY,
                        description: "Exactly 3 alternative scroll-stopping opening hooks/captions for this clip.",
                        items: { type: Type.STRING },
                    },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    wordEvents: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                start: { type: Type.NUMBER },
                                end: { type: Type.NUMBER },
                            },
                            required: ["word", "start", "end"],
                        },
                    },
                },
                required: ["title", "summary", "hookVariants", "startTime", "endTime", "wordEvents"],
            },
        },
    },
    required: ["summary", "blogPostMarkdown", "transcript", "linkedinPost", "twitterThread", "viralMoments"],
};

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
                    responseSchema: ATOMIZATION_SCHEMA,
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

    // Brand voice: inject the creator's past posts + style notes so output sounds like them.
    let voiceGuide = "";
    const vp = options.voiceProfile;
    if (vp && ((Array.isArray(vp.samples) && vp.samples.length > 0) || vp.description)) {
        const samples = (vp.samples || [])
            .map((s: string, i: number) => `--- Example ${i + 1} ---\n${s}`)
            .join('\n\n');
        voiceGuide = `
        CRITICAL — WRITE IN THE CREATOR'S OWN VOICE:
        The blog post, LinkedIn post, and Twitter thread MUST sound like this specific creator wrote them — match their tone, sentence length, rhythm, vocabulary, punctuation, and emoji habits. Do NOT produce generic, polished "AI" copy. Favor their phrasing over yours.${vp.description ? `\n        Style notes from the creator: ${vp.description}` : ''}${samples ? `\n        Real examples of the creator's past posts to emulate:\n${samples}` : ''}
        `;
    }

    // Creative direction (Pro): an optional tone template + a freeform custom instruction.
    const TONE_TEMPLATES: Record<string, string> = {
        punchy: "Adopt a punchy, bold, high-energy tone — short sentences, strong verbs, confident claims.",
        analytical: "Adopt a thoughtful, analytical tone — precise, structured, evidence-led, no hype.",
        casual: "Adopt a friendly, casual, conversational tone, like talking to a peer.",
        authoritative: "Adopt an authoritative expert tone — credible, direct, and clear.",
        storytelling: "Use a narrative, storytelling approach with a clear arc and vivid, concrete detail.",
    };
    const toneInstruction = options.voiceTemplate ? TONE_TEMPLATES[options.voiceTemplate] : "";
    let creativeDirection = "";
    if (toneInstruction || options.customPrompt) {
        creativeDirection = `
        CREATIVE DIRECTION:${toneInstruction ? `\n        - ${toneInstruction}` : ''}${options.customPrompt ? `\n        - Specific instruction from the user (follow it closely): "${String(options.customPrompt).slice(0, 1000)}"` : ''}
        `;
    }

    const prompt = `
        You are a world-class ghostwriter for B2B founders and operators. You turn long-form video into sharp, credible, non-fluffy content that builds authority and pipeline — never generic or clickbaity. Analyze the provided video and deconstruct it into the following assets.

        ${timeframeConstraint}

        ${voiceGuide}

        ${creativeDirection}

        Generate the following:
        1.  "summary": A concise, one-paragraph summary of the entire video.
        2.  "blogPostMarkdown": A high-quality blog post in the style of a top-tier Medium or Forbes article. It must include:
            - A compelling, SEO-optimized title (H1).
            - An engaging introduction that hooks the reader.
            - Well-structured sections with Markdown headings (##) and subheadings (###).
            - Placeholders for visuals, formatted exactly like this: [Image: A vibrant, abstract image representing creative ideas]. Use descriptive terms suitable for a stock photo search.
        3.  "transcript": A structured transcript as an array of objects. CRITICAL: Combine multiple sentences into a single large text block (approx 30-60 seconds of speech) per object to keep the array small. Each object must have a "timestamp" (string, e.g., "01:23") and the corresponding "text" (string).
        4.  "linkedinPost": A professional post for LinkedIn. Start with a strong hook, use bullet points with professional emojis, end with a question, and finish with 4-5 relevant hashtags.
        5.  "twitterThread": A viral-style Twitter thread (an array of strings). Start with a curiosity-driving hook, use emojis, keep each tweet under 280 characters, number them (1/, 2/, 3/), and end with a call-to-action and hashtags.
        6.  "viralMoments": An array of up to ${options.clipLimit} short-form clips engineered to perform on Instagram Reels, TikTok, and YouTube Shorts. Each clip MUST:
            - Be a self-contained moment that fully makes sense on its own, with no missing setup or context.
            - Open on a strong hook in the first 1-2 seconds (a bold claim, a question, or a surprising line) to stop the scroll.
            - Be under ${options.clipLength} seconds long, starting and ending on natural sentence boundaries — never mid-sentence or mid-word.
            Provide "title", "summary", "hookVariants", "startTime" (number, seconds), "endTime" (number, seconds), and "wordEvents". "hookVariants" is an array of exactly 3 alternative scroll-stopping opening lines/captions (each under 12 words) the creator could post with this clip — punchy, curiosity-driving, and distinct from each other. CRITICAL for caption sync: each wordEvent's "start" and "end" MUST be the real spoken time of that word in the source video (seconds), accurate to ~0.2s, and MUST fall between this clip's startTime and endTime. Each wordEvent has "word" (string), "start" (number), and "end" (number).
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

    // Step 1: Try direct parse — responseSchema guarantees valid JSON structure
    try {
        const parsedResult: AtomizationResult = JSON.parse(text);
        parsedResult.viralMoments = parsedResult.viralMoments || [];
        console.log(`[✅] AI analysis complete. Found ${parsedResult.viralMoments.length} viral moments.`);
        return parsedResult;
    } catch (directError) {
        console.warn("[⚠️] Direct JSON.parse failed:", (directError as Error).message);
    }

    // Step 2: Safety net — jsonrepair for edge cases
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

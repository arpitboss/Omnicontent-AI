// packages/worker/src/aiService.ts
import { getYoutubeVideoId } from "./utils/youtube";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
} from "@google/genai";
import { extractJsonObject } from "./utils/json";
import axios from "axios";
import fs from "fs";
import path from "path";
import { createStreamingJsonParser } from "./utils/streaming-json-parser";

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
// const ai = new GoogleGenerativeAI(apiKey);
const ai = new GoogleGenAI({ apiKey: apiKey });


function cleanAIJson(text: string): string {
    // Remove code fences
    text = text.replace(/```json\s*([\s\S]*?)```/i, '$1').replace(/```[\s\S]*?```/g, '').trim();
    // Remove trailing commas before } or ]
    text = text.replace(/,\s*([}\]])/g, '$1');
    // Replace smart quotes with regular quotes
    text = text.replace(/[\u2018\u2019\u201C\u201D]/g, '"');
    return text;
}

function extractFirstJsonObject(text: string): string {
    const match = text.match(/{[\s\S]*}/);
    if (!match) throw new Error("No JSON object found in response.");
    return match[0];
}

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
 * Attempts to repair a broken JSON string using a fast AI model.
 * @param brokenJson The potentially malformed JSON string.
 * @returns A string of the repaired JSON.
 */
const repairJsonWithAi = async (brokenJson: string): Promise<string> => {
    console.warn('[⚠️] Malformed JSON detected. Attempting AI-powered repair...');

    // Use a fast and cheap model for this simple task
    // const repairModel = ai.models.get({ model: "gemini-2.5-flash-lite", });

    const prompt = `The following text is supposed to be a single, valid JSON object, but it contains a syntax error. Please analyze the text, fix the error (e.g., missing commas, unescaped quotes, trailing commas), and return ONLY the corrected, valid JSON object. Do not add any new data or explanations.

BROKEN JSON:
${brokenJson}

CORRECTED JSON:`;
    const result = await ai.models.generateContent({ model: "gemini-2.5-flash-lite", contents: prompt });

    return result.text!;
};


export const atomizeVideoContent = async (source: string, options: any): Promise<AtomizationResult> => {
    console.log(`[🤖] Starting AI analysis with options:`, options);

    let timeframeConstraint = "";
    if (options.timeframe?.start && options.timeframe?.end) {
        timeframeConstraint = `CRITICAL: You must only analyze the video content between the timestamps ${options.timeframe.start} and ${options.timeframe.end}. All generated clips and content must come from this specific segment.`;
    }

    // Gemini API can work with YouTube URLs, but let's provide it in a structured way
    // const videoId = getYoutubeVideoId(url);
    // if (!videoId) throw new Error("Invalid YouTube URL");
    // const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

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
        3.  "transcript": A structured transcript as an array of objects. Each object must have a "timestamp" (string, e.g., "01:23.540") and the corresponding "text" (string).
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
        6.  "viralMoments": An array of up to ${options.clipLimit} engaging video clips. Each clip must be under ${options.clipLength} seconds long. For each clip, provide a "title", "summary", "startTime", "endTime", and "wordEvents" with word-level timestamps for captions. Each object in this array must have unique keys. Do not repeat keys like "summary" or "startTime".

        Your entire output must be a single, valid JSON object with the keys listed above.
        CRITICAL: Your entire response must be ONLY the valid JSON object, starting with { and ending with }. Do not include any other text, explanations, or markdown formatting like \`\`\`json before or after the object.
    `;

    // const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    // let promptParts: Part[] = [];
    let contents;

    if (source.includes("youtube.com") || source.includes("youtu.be")) {
        contents = createUserContent([
            prompt,
            `Here is the YouTube link: ${source}`,
        ]);
    } else {
        const myfile = await uploadAndWait(source, "video/mp4");
        contents = createUserContent([
            createPartFromUri(myfile.uri!, myfile.mimeType!),
            prompt,
        ]);
    }
    try {
        const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: contents });
        let text = result.text;
        const rawResponseText = extractFirstJsonObject(text!);
        let cleanJsonString: string;

        try {
            cleanJsonString = extractJsonObject(rawResponseText);
        } catch (error) {
            console.error("Could not extract any JSON object from the AI response.", error);
            throw new Error("AI response did not contain a recognizable JSON object.");
        }

        try {
            // First attempt to parse the cleaned string
            const parsedResult: AtomizationResult = JSON.parse(cleanJsonString);
            console.log(`[✅] AI analysis complete. Found ${parsedResult.viralMoments.length} viral moments.`);
            console.log(parsedResult);
            return parsedResult;
        } catch (error) {
            // If the first parse fails, trigger the self-healing mechanism
            console.error("Initial JSON.parse failed. Original error:", (error as Error).message);

            try {
                // Attempt to repair the broken JSON using the AI
                const repairedJsonString = await repairJsonWithAi(cleanJsonString);

                // Clean the repaired string just in case the repair AI added extra text
                const cleanRepairedJson = extractJsonObject(repairedJsonString);

                // Second and final attempt to parse
                console.log('[✅] AI repair successful. Parsing repaired JSON.');
                const parsedResult: AtomizationResult = JSON.parse(cleanRepairedJson);
                console.log(`[✅] AI analysis complete. Found ${parsedResult.viralMoments.length} viral moments.`);
                console.log(parsedResult);
                return parsedResult;
            } catch (repairError) {
                // If the repair or the second parse fails, we give up and fail the job
                console.error("FATAL: AI-powered JSON repair failed. Final error:", (repairError as Error).message);
                // Log the original broken JSON for debugging
                console.error("Original malformed JSON string:", cleanJsonString);
                throw new Error("Failed to generate and repair valid JSON from AI response.");
            }
        }
    }
    catch (error) {
        console.error("Error generating content:", error);
        // Return a default AtomizationResult in case of error
        return {
            blogPostMarkdown: "",
            viralMoments: [],
            transcript: "",
            summary: "",
            linkedinPost: "",
            twitterThread: [],
        };
    }
};

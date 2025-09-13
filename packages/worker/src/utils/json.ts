// packages/worker/src/utils/json.ts

/**
 * Extracts a JSON object from a string that might contain other text.
 * It finds the first '{' and the last '}' to bound the object.
 * @param str The raw string response from the AI.
 * @returns A string containing only the JSON object.
 */
export const extractJsonObject = (str: string): string => {
    const firstBracket = str.indexOf('{');
    const lastBracket = str.lastIndexOf('}');

    if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
        throw new Error("Could not find a valid JSON object in the string.");
    }

    return str.substring(firstBracket, lastBracket + 1);
};
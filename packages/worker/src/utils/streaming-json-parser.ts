// This is a simple stateful parser to handle streaming JSON from the AI
export function createStreamingJsonParser(onUpdate: (key: string, valueChunk: string) => void, onComplete: (finalJson: any) => void) {
    let buffer = '';
    let jsonObject: any = {};
    let currentKey = '';
    let isInsideString = false;
    let isKey = true;

    return function processToken(token: string) {
        buffer += token;

        // Try to find the start of a key
        const keyMatch = buffer.match(/"([^"]+)":\s*"/);
        if (keyMatch && !isInsideString) {
            currentKey = keyMatch[1];
            isKey = false;
            isInsideString = true;
            // Clear buffer up to the start of the string value
            buffer = buffer.substring(keyMatch[0].length);
        }

        // While we are inside a string value
        if (isInsideString) {
            // Look for the end of the string, being careful not to end on an escaped quote
            const endQuoteMatch = buffer.match(/(?<!\\)"/);
            if (endQuoteMatch) {
                const valueChunk = buffer.substring(0, endQuoteMatch.index);
                onUpdate(currentKey, valueChunk); // Send the completed value for this key
                jsonObject[currentKey] = (jsonObject[currentKey] || '') + valueChunk;

                buffer = buffer.substring(endQuoteMatch.index! + 1);
                isInsideString = false;
                isKey = true;
                currentKey = '';
            } else {
                // If no end quote, the whole buffer is part of the string value
                onUpdate(currentKey, buffer);
                jsonObject[currentKey] = (jsonObject[currentKey] || '') + buffer;
                buffer = '';
            }
        }

        // A simple check for completion
        if (buffer.includes('}')) {
            try {
                // Try to parse the final object to get arrays and other types correct
                const finalObject = JSON.parse(extractJsonObject(buffer + '}')); // Re-add bracket for parsing
                onComplete(finalObject);
            } catch (e) {
                // Fallback for simple completion
                onComplete(jsonObject);
            }
        }
    };
}
// Helper from a previous step, needed here
function extractJsonObject(str: string): string {
    const firstBracket = str.indexOf('{');
    const lastBracket = str.lastIndexOf('}');
    if (firstBracket === -1 || lastBracket === -1) return "{}";
    return str.substring(firstBracket, lastBracket + 1);
}
/**
 * Converts a timestamp string (e.g., "01:23.540" or "45.123") into total seconds.
 * @param ts The timestamp string from the AI.
 * @returns The total time in seconds as a number.
 */
export const parseTimestampToSeconds = (ts: string): number => {
    if (!ts) return 0;
    
    const parts = ts.split(':').map(part => parseFloat(part));
    let seconds = 0;
    if (parts.length === 3) { // HH:MM:SS.ms
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) { // MM:SS.ms
        seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) { // SS.ms
        seconds = parts[0];
    }
    return seconds;
};
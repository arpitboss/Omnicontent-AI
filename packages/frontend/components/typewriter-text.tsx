// packages/frontend/components/typewriter-text.tsx
"use client";

import ReactMarkdown, { Options } from 'react-markdown';
import { useTypewriter } from '@/hooks/use-typewriter';


interface TypewriterTextProps {
    text: string;
    id: string;
    components?: Options["components"];
}

// A simple component for the animated ellipsis
const BlinkingCursor = () => (
    <span className="blinking-cursor">...</span>
);

export const TypewriterText = ({ text, id, components }: TypewriterTextProps) => {
    // This hook is now much more performant. It only gets updates for this specific ID.
    const { displayText, isDone } = useTypewriter(id, text);

    // We add a check here. If the component mounts but the animation hasn't even started
    // (displayText is empty), we show the loading dots. Once the first character appears,
    // this condition becomes false.
    const showCursor = !isDone && displayText.length > 0; // Adjust speed (ms per character) as needed

    return (
        <span className="inline-block min-h-[1em]"> {/* Prevents layout shift */}
            <ReactMarkdown components={components}>
                {displayText}
            </ReactMarkdown>
            {showCursor && <BlinkingCursor />}
        </span>
    );
};
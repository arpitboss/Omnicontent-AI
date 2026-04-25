"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
    textToCopy: string;
}

export const CopyButton = ({ textToCopy }: CopyButtonProps) => {
    const [hasCopied, setHasCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setHasCopied(true);
        setTimeout(() => {
            setHasCopied(false);
        }, 2000); // Reset the icon after 2 seconds
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2.5 text-xs hover:bg-accent transition-colors rounded-md text-muted-foreground"
        >
            {hasCopied ? (
                <span className="flex items-center text-[var(--accent-500)]">
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Copied
                </span>
            ) : (
                <span className="flex items-center hover:text-foreground transition-colors">
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy
                </span>
            )}
        </Button>
    );
};
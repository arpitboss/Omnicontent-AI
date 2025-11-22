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
            className="h-8 px-3 font-mono text-xs uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 rounded-none"
        >
            {hasCopied ? (
                <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3 mr-2" />
                    Copied
                </span>
            ) : (
                <span className="flex items-center text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
                    <Copy className="h-3 w-3 mr-2" />
                    Copy
                </span>
            )}
        </Button>
    );
};
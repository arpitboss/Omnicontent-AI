"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Check, Copy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

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
            className="h-8 px-2.5 text-xs hover:bg-accent transition-all duration-200 rounded-md text-muted-foreground active:scale-95"
        >
            <AnimatePresence mode="wait" initial={false}>
                {hasCopied ? (
                    <motion.span
                        key="copied"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center text-[var(--accent-500)] font-medium"
                    >
                        <Check className="h-3.5 w-3.5 mr-1.5 stroke-[2.5px]" />
                        Copied!
                    </motion.span>
                ) : (
                    <motion.span
                        key="copy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center hover:text-foreground transition-colors"
                    >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy
                    </motion.span>
                )}
            </AnimatePresence>
        </Button>
    );
};
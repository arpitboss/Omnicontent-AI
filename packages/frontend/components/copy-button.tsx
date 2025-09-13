"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Copy, Check } from 'lucide-react';

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
        <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
            {hasCopied ? (
                <Check className="h-4 w-4 text-green-500" />
            ) : (
                <Copy className="h-4 w-4" />
            )}
        </Button>
    );
};
"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    // Reusing the NotFound component design for consistency, 
    // but we could customize the text if the NotFound component accepts props.
    // Since NotFound is currently hardcoded, we'll use it as a fallback UI 
    // or we can wrap it to inject "Something went wrong" if we modify NotFound.

    // For now, let's assume the user wants the "System Error" aesthetic.
    // We will modify NotFound to accept props for title/message to make it reusable.

    return (
        <div className="w-full h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
            <div className="text-center space-y-6 max-w-lg px-6">
                <div className="w-24 h-24 bg-black dark:bg-white mx-auto flex items-center justify-center mb-8 relative group">
                    <div className="absolute inset-0 border-2 border-black dark:border-white translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="text-4xl font-bold text-white dark:text-black font-mono">!</span>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase">System Malfunction</h1>
                    <p className="text-neutral-500 font-mono text-sm uppercase tracking-widest">
                        Critical Error Detected
                    </p>
                </div>

                <div className="font-mono text-xs text-red-500 border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-left overflow-auto max-h-32">
                    {error.message || "Unknown error occurred during operation sequence."}
                </div>

                <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                        Reboot System
                    </button>
                </div>
            </div>
        </div>
    );
}

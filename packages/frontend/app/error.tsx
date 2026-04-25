"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
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

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-background px-6">
            <div className="text-center space-y-6 max-w-lg">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                        Something went wrong
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        We hit an unexpected error. You can try again or head back home.
                    </p>
                </div>

                {error.message && (
                    <div className="text-xs text-red-500 border border-red-500/30 bg-red-500/[0.06] rounded-lg p-3 text-left overflow-auto max-h-32 font-mono">
                        {error.message}
                    </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity active:translate-y-px"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="h-10 inline-flex items-center justify-center px-5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
                    >
                        Go home
                    </Link>
                </div>
            </div>
        </div>
    );
}

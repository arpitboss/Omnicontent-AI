"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";

const ease = [0.16, 1, 0.3, 1] as const;

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refetch } = useSubscription();
    const { getToken } = useAuth();
    const [verifying, setVerifying] = React.useState(true);

    const sessionId = searchParams.get("session_id");

    React.useEffect(() => {
        const verify = async () => {
            if (sessionId) {
                try {
                    const token = await getToken();
                    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, "");
                    await fetch(`${API_BASE}/api/v1/billing/verify-session`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ session_id: sessionId })
                    });
                } catch (err) {
                    console.error("Verification failed", err);
                }
            }
            await refetch();
            setVerifying(false);
        };
        verify();
    }, [refetch, sessionId, getToken]);

    if (verifying) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 text-brand animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse">Finalizing your upgrade...</p>
            </div>
        );
    }

    return (
        <>
            <Header />
            <main className="relative pt-32 pb-24 min-h-screen flex items-center justify-center">
                {/* Celebration glow */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[70%] -z-10"
                    style={{
                        background: "radial-gradient(closest-side, var(--accent-glow), transparent 65%)",
                        opacity: 0.6,
                    }}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease }}
                    className="text-center max-w-lg mx-auto px-6"
                >
                    {/* Success icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, ease, delay: 0.15 }}
                        className="mx-auto mb-8"
                    >
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/30 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-10 w-10 text-brand" />
                        </div>
                    </motion.div>

                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                        Welcome to Pro
                    </h1>
                    <p className="text-[16px] text-muted-foreground leading-relaxed mb-10 max-w-md mx-auto">
                        Your upgrade is complete. You now have unlimited access to every feature in OmniContent AI.
                        Time to create something amazing.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                            onClick={() => router.push("/create")}
                            className="h-11 px-6 rounded-lg bg-foreground text-background hover:opacity-90 text-[14px] font-semibold group"
                        >
                            Create Content
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                        <Button
                            onClick={() => router.push("/dashboard")}
                            variant="outline"
                            className="h-11 px-6 rounded-lg border-border hover:border-foreground/30 text-[14px]"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </motion.div>
            </main>
            <Footer />
        </>
    );
}

export default function BillingSuccessPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>}>
            <SuccessContent />
        </React.Suspense>
    );
}

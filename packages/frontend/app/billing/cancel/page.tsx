"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, ShieldCheck } from "lucide-react";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

export default function BillingCancelPage() {
    const router = useRouter();

    return (
        <>
            <Header />
            <main className="relative pt-32 pb-24 min-h-screen flex items-center justify-center">
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-[400px] w-[60%] -z-10"
                    style={{
                        background: "radial-gradient(closest-side, var(--accent-glow), transparent 70%)",
                        opacity: 0.3,
                    }}
                />

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="text-center max-w-lg mx-auto px-6"
                >
                    <div className="mx-auto mb-8 h-16 w-16 rounded-2xl bg-secondary border border-border flex items-center justify-center">
                        <Heart className="h-8 w-8 text-muted-foreground" />
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
                        No worries!
                    </h1>
                    <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
                        Your checkout was canceled and you haven&apos;t been charged.
                        You can upgrade anytime from your dashboard or billing page.
                    </p>

                    <div className="rounded-xl border border-border bg-card p-5 mb-8 text-left max-w-sm mx-auto">
                        <h3 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-brand" />
                            What you&apos;re missing with Pro
                        </h3>
                        <ul className="space-y-2 text-[13px] text-muted-foreground">
                            <li>• Unlimited atomization projects</li>
                            <li>• Multi-platform publishing</li>
                            <li>• AI translation in 40+ languages</li>
                            <li>• Premium content editor</li>
                            <li>• Priority processing</li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                            onClick={() => router.push("/billing")}
                            className="h-10 px-5 rounded-lg bg-foreground text-background hover:opacity-90 text-[13.5px] font-medium"
                        >
                            Try Again
                        </Button>
                        <Button
                            onClick={() => router.push("/dashboard")}
                            variant="outline"
                            className="h-10 px-5 rounded-lg border-border hover:border-foreground/30 text-[13.5px]"
                        >
                            <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>
                </motion.div>
            </main>
            <Footer />
        </>
    );
}

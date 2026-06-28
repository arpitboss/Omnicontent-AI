"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Layers, X, Loader2, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";

const PRO_BENEFITS = [
    "Unlimited atomization projects",
    "6 clips per video (vs 3)",
    "Multi-platform publishing",
    "AI content translation",
    "Premium content editor",
    "Video reformatting & export",
    "Priority processing",
];

interface UpgradeModalProps {
    open: boolean;
    onClose: () => void;
    feature?: string;
}

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
    const { createCheckout, startTrial, status, plan } = useSubscription();
    const [loading, setLoading] = React.useState<"monthly" | "yearly" | "trial" | null>(null);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const showTrialOption = (status === "none" || (!plan || plan === "free")) && status !== "canceled";

    const handleCheckout = async (interval: "monthly" | "yearly") => {
        setLoading(interval);
        const result = await createCheckout(interval);
        if (result.url) {
            window.location.href = result.url;
        } else {
            setLoading(null);
        }
    };

    const handleStartTrial = async () => {
        setLoading("trial");
        const result = await startTrial();
        if (result.success) {
            onClose();
        }
        setLoading(null);
    };

    if (!isMounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    >
                        {/* Top accent */}
                        <span
                            aria-hidden
                            className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent"
                        />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute right-3 top-3 z-20 h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="relative z-10 px-7 pt-8 pb-7 bg-card">
                            {/* Icon */}
                            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/30">
                                <Layers className="h-7 w-7 text-brand" />
                            </div>

                            {/* Header */}
                            <h2 className="text-center text-xl font-bold tracking-tight text-foreground mb-2">
                                Upgrade to Pro
                            </h2>
                            {feature ? (
                                <p className="text-center text-sm text-muted-foreground mb-6">
                                    {feature === 'Project limit reached' ? (
                                        <>You've reached your free project limit. Upgrade to unlock unlimited projects and everything else.</>
                                    ) : (
                                        <><span className="font-medium text-foreground">{feature}</span> is a Pro feature. Upgrade to unlock it and everything else.</>
                                    )}
                                </p>
                            ) : (
                                <p className="text-center text-sm text-muted-foreground mb-6">
                                    Unlock the full power of OmniContent AI with unlimited access to every feature.
                                </p>
                            )}

                            {/* Benefits */}
                            <ul className="space-y-2.5 mb-7">
                                {PRO_BENEFITS.map((benefit) => (
                                    <li key={benefit} className="flex items-center gap-2.5 text-[13.5px]">
                                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand/15">
                                            <Check className="h-2.5 w-2.5 text-brand" strokeWidth={3} />
                                        </span>
                                        <span className="text-foreground/85">{benefit}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTAs */}
                            <div className="space-y-2.5">
                                <Button
                                    onClick={() => handleCheckout("monthly")}
                                    disabled={loading !== null}
                                    className={cn(
                                        "w-full h-11 rounded-lg text-[14px] font-semibold",
                                        "bg-foreground text-background hover:opacity-90 transition-opacity"
                                    )}
                                >
                                    {loading === "monthly" ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <ArrowRight className="h-4 w-4 mr-2" />
                                    )}
                                    Upgrade — $49/month
                                </Button>
                                <Button
                                    onClick={() => handleCheckout("yearly")}
                                    disabled={loading !== null}
                                    variant="outline"
                                    className="w-full h-11 rounded-lg text-[14px] font-medium border-border hover:border-foreground/30"
                                >
                                    {loading === "yearly" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Upgrade — $39/mo billed yearly
                                    <span className="ml-2 text-[11px] text-brand font-semibold">SAVE 20%</span>
                                </Button>
                                {showTrialOption && status !== "expired" && status !== "trialing" && (
                                    <Button
                                        onClick={handleStartTrial}
                                        disabled={loading !== null}
                                        variant="ghost"
                                        className="w-full h-10 text-[13px] text-muted-foreground hover:text-foreground"
                                    >
                                        {loading === "trial" && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                                        Or start a 7-day free trial
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

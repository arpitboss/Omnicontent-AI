"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Check,
    Clock,
    Layers,
    Loader2,
    Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";

const ease = [0.16, 1, 0.3, 1] as const;

export default function BillingPage() {
    const {
        status,
        trialDaysLeft,
        trialEndsAt,
        atomizationsUsed,
        atomizationsLimit,
        cancelAtPeriodEnd,
        currentPeriodEnd,
        isProFeatureAvailable,
        isLoading,
        createCheckout,
        openPortal,
    } = useSubscription();

    const [portalLoading, setPortalLoading] = React.useState(false);
    const [checkoutLoading, setCheckoutLoading] = React.useState<"monthly" | "yearly" | null>(null);

    const handleOpenPortal = async () => {
        setPortalLoading(true);
        const result = await openPortal();
        if (result.url) {
            window.location.href = result.url;
        }
        setPortalLoading(false);
    };

    const handleCheckout = async (interval: "monthly" | "yearly") => {
        setCheckoutLoading(interval);
        const result = await createCheckout(interval);
        if (result.url) {
            window.location.href = result.url;
        }
        setCheckoutLoading(null);
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <main className="relative pt-32 pb-24 min-h-screen flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="relative pt-32 pb-24 min-h-screen">
                {/* Glow */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 h-[420px] w-[80%] -z-10"
                    style={{
                        background: "radial-gradient(closest-side, var(--accent-glow), transparent 70%)",
                        opacity: 0.5,
                    }}
                />

                <div className="container-page max-w-3xl">
                    <motion.header
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease }}
                        className="mb-10"
                    >
                        <p className="eyebrow mb-4">Billing</p>
                        <h1 className="section-title">
                            Manage your plan.
                        </h1>
                    </motion.header>

                    {/* Current Plan Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease, delay: 0.05 }}
                        className="rounded-xl border border-border bg-card overflow-hidden mb-6"
                    >
                        <div className="px-6 py-5 border-b border-border bg-secondary/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center",
                                    isProFeatureAvailable
                                        ? "bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/30"
                                        : "bg-secondary border border-border"
                                )}>
                                    {isProFeatureAvailable ? (
                                        <Layers className="h-5 w-5 text-brand" />
                                    ) : (
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                                        {isProFeatureAvailable 
                                            ? cancelAtPeriodEnd 
                                                ? "Pro Plan (Canceling)" 
                                                : "Pro Plan" 
                                            : "Free Plan"}
                                    </h2>
                                    <p className="text-[13px] text-muted-foreground">
                                        {status === "trialing" && trialDaysLeft !== null
                                            ? `Trial — ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} remaining`
                                            : status === "active"
                                                ? cancelAtPeriodEnd
                                                    ? `Active — cancels ${currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : "soon"}`
                                                    : `Active — renews ${currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : ""}`
                                                : status === "expired"
                                                    ? "Trial ended"
                                                    : status === "past_due"
                                                        ? "Payment past due"
                                                        : status === "canceled"
                                                            ? "Canceled"
                                                            : "No active subscription"
                                        }
                                    </p>
                                </div>
                            </div>
                            <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                                isProFeatureAvailable
                                    ? cancelAtPeriodEnd
                                        ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                                        : "border-brand/30 text-brand bg-brand/10"
                                    : status === "past_due"
                                        ? "border-red-500/30 text-red-500 bg-red-500/10"
                                        : "border-border text-muted-foreground bg-secondary"
                            )}>
                                <span className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    isProFeatureAvailable 
                                        ? cancelAtPeriodEnd
                                            ? "bg-amber-500"
                                            : "bg-brand animate-pulse" 
                                        : status === "past_due" 
                                            ? "bg-red-500" 
                                            : "bg-muted-foreground"
                                )} />
                                {isProFeatureAvailable ? (cancelAtPeriodEnd ? "CANCELING" : "PRO") : status === "past_due" ? "PAST DUE" : "FREE"}
                            </span>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Usage stats */}
                            <div className="rounded-lg border border-border bg-secondary/20 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                                        Projects used
                                    </span>
                                    <span className="text-[13px] font-semibold tabular-nums text-foreground">
                                        {atomizationsUsed} / {atomizationsLimit === Infinity ? "∞" : atomizationsLimit}
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: atomizationsLimit === Infinity
                                                ? "5%"
                                                : `${Math.min(100, (atomizationsUsed / atomizationsLimit) * 100)}%`
                                        }}
                                        transition={{ duration: 0.8, ease }}
                                        className={cn(
                                            "h-full rounded-full",
                                            atomizationsLimit !== Infinity && atomizationsUsed >= atomizationsLimit
                                                ? "bg-red-500"
                                                : "bg-brand"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Trial countdown */}
                            {status === "trialing" && trialDaysLeft !== null && trialEndsAt && (
                                <div className="rounded-lg border border-brand/20 bg-brand/5 p-4 flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-brand flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-[13.5px] font-medium text-foreground">
                                            Your trial ends {new Date(trialEndsAt).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                        <p className="text-[12.5px] text-muted-foreground">
                                            Upgrade to Pro to keep all features after your trial ends.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-3">
                                {isProFeatureAvailable && status === "active" && (
                                    <Button
                                        onClick={handleOpenPortal}
                                        disabled={portalLoading}
                                        variant="outline"
                                        className="h-10 rounded-lg border-border hover:border-foreground/30 text-[13.5px]"
                                    >
                                        {portalLoading ? (
                                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                        ) : (
                                            <Settings className="h-3.5 w-3.5 mr-2" />
                                        )}
                                        Manage Subscription
                                    </Button>
                                )}

                                {!isProFeatureAvailable && (
                                    <>
                                        <Button
                                            onClick={() => handleCheckout("monthly")}
                                            disabled={checkoutLoading !== null}
                                            className="h-10 rounded-lg bg-foreground text-background hover:opacity-90 text-[13.5px] font-semibold"
                                        >
                                            {checkoutLoading === "monthly" ? (
                                                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                            ) : (
                                                <ArrowRight className="h-3.5 w-3.5 mr-2" />
                                            )}
                                            Upgrade — $49/month
                                        </Button>
                                        <Button
                                            onClick={() => handleCheckout("yearly")}
                                            disabled={checkoutLoading !== null}
                                            variant="outline"
                                            className="h-10 rounded-lg border-border hover:border-foreground/30 text-[13.5px]"
                                        >
                                            {checkoutLoading === "yearly" && (
                                                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                            )}
                                            $39/mo yearly
                                            <span className="ml-2 text-[10px] text-brand font-bold">SAVE 20%</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Plan comparison */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease, delay: 0.1 }}
                        className="rounded-xl border border-border bg-card overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-border bg-secondary/20">
                            <h3 className="text-[14px] font-semibold text-foreground">Plan Comparison</h3>
                        </div>
                        <div className="divide-y divide-border">
                            {[
                                { feature: "Atomization projects", free: "3 total", pro: "Unlimited" },
                                { feature: "Clips per video", free: "3", pro: "6" },
                                { feature: "Transcription quality", free: "Standard", pro: "99.8% accuracy" },
                                { feature: "Export quality", free: "1080p", pro: "4K" },
                                { feature: "Multi-platform publishing", free: false, pro: true },
                                { feature: "AI translation", free: false, pro: true },
                                { feature: "Premium content editor", free: false, pro: true },
                                { feature: "Video reformatting", free: false, pro: true },
                                { feature: "Priority processing", free: false, pro: true },
                            ].map((row) => (
                                <div key={row.feature} className="grid grid-cols-3 px-6 py-3 text-[13px]">
                                    <span className="text-foreground/85">{row.feature}</span>
                                    <span className="text-center text-muted-foreground">
                                        {typeof row.free === "boolean" ? (
                                            row.free ? <Check className="h-4 w-4 text-brand mx-auto" /> : <span className="text-muted-foreground/50">—</span>
                                        ) : row.free}
                                    </span>
                                    <span className="text-center text-foreground font-medium">
                                        {typeof row.pro === "boolean" ? (
                                            row.pro ? <Check className="h-4 w-4 text-brand mx-auto" /> : <span>—</span>
                                        ) : row.pro}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 px-6 py-3 border-t border-border bg-secondary/10">
                            <span className="text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground" />
                            <span className="text-center text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground">Free</span>
                            <span className="text-center text-[12px] font-mono uppercase tracking-[0.16em] text-brand font-semibold">Pro</span>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    );
}

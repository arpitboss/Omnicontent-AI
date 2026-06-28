"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Clock, CreditCard, Loader2, Layers, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";

/**
 * Contextual banner shown at the top of the dashboard based on
 * the user's subscription status.
 * 
 * - Trial active: "X days left" with upgrade CTA
 * - Trial expired: "Trial ended" with urgent upgrade CTA
 * - Past due: Payment failed warning
 * - Pro active: No banner
 * - No subscription: Start trial prompt
 */
export function SubscriptionBanner() {
    const {
        plan,
        status,
        trialDaysLeft,
        atomizationsUsed,
        atomizationsLimit,
        createCheckout,
        startTrial,
        isLoading,
    } = useSubscription();

    const [dismissed, setDismissed] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    // Reset dismiss on status change
    React.useEffect(() => {
        setDismissed(false);
    }, [status]);

    // Don't show anything while loading to prevent hydration flickers
    if (isLoading) return null;

    // Pro active users see nothing
    if (status === "active" && plan === "pro") return null;
    if (dismissed) return null;

    const handleUpgrade = async () => {
        setLoading(true);
        const result = await createCheckout("monthly");
        if (result.url) {
            window.location.href = result.url;
        }
        setLoading(false);
    };

    const handleStartTrial = async () => {
        setLoading(true);
        await startTrial();
        setLoading(false);
    };

    let variant: "info" | "warning" | "urgent" | "trial" = "info";
    let icon = <Layers className="h-4 w-4" />;
    let message = "";
    let cta = "";
    let ctaAction: (() => void) | null = null;

    if (status === "none") {
        variant = "info";
        icon = <Layers className="h-4 w-4" />;
        message = "Start your 7-day free trial to explore OmniContent AI — no card required.";
        cta = "Start Free Trial";
        ctaAction = handleStartTrial;
    } else if (status === "trialing" && trialDaysLeft !== null) {
        variant = trialDaysLeft <= 2 ? "warning" : "trial";
        icon = <Clock className="h-4 w-4" />;
        message = trialDaysLeft === 0
            ? "Your free trial ends today! Upgrade now to keep your Pro features."
            : trialDaysLeft === 1
                ? "Your free trial ends tomorrow. Upgrade to keep all Pro features."
                : `You have ${trialDaysLeft} days left on your free trial. Upgrade anytime to go Pro.`;
        cta = "Upgrade to Pro";
        ctaAction = handleUpgrade;
    } else if (status === "expired") {
        variant = "urgent";
        icon = <AlertCircle className="h-4 w-4" />;
        message = `Your free trial has ended. You've used ${atomizationsUsed} of ${atomizationsLimit} free projects. Upgrade to unlock unlimited access.`;
        cta = "Upgrade Now";
        ctaAction = handleUpgrade;
    } else if (status === "past_due") {
        variant = "urgent";
        icon = <CreditCard className="h-4 w-4" />;
        message = "Your payment failed. Please update your billing information to keep your Pro access.";
        cta = "Update Payment";
        ctaAction = handleUpgrade;
    } else if (status === "canceled") {
        variant = "warning";
        icon = <AlertCircle className="h-4 w-4" />;
        message = "Your subscription was canceled. Upgrade again to re-enable Pro features.";
        cta = "Resubscribe";
        ctaAction = handleUpgrade;
    } else {
        // Unknown state — show nothing
        return null;
    }

    const colorMap = {
        info: {
            bg: "bg-brand/[0.06] border-brand/20",
            text: "text-brand",
            btn: "bg-foreground text-background hover:opacity-90",
        },
        trial: {
            bg: "bg-brand/[0.06] border-brand/20",
            text: "text-brand",
            btn: "bg-foreground text-background hover:opacity-90",
        },
        warning: {
            bg: "bg-amber-500/[0.06] border-amber-500/20",
            text: "text-amber-500",
            btn: "bg-amber-500 text-white hover:bg-amber-600",
        },
        urgent: {
            bg: "bg-red-500/[0.06] border-red-500/20",
            text: "text-red-500",
            btn: "bg-red-500 text-white hover:bg-red-600",
        },
    };

    const colors = colorMap[variant];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                    "relative rounded-xl border p-4 mb-6",
                    colors.bg
                )}
            >
                <div className="flex items-center gap-3">
                    <span className={cn("flex-shrink-0", colors.text)}>{icon}</span>
                    <p className="flex-1 text-[13.5px] text-foreground/85 leading-relaxed">
                        {message}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {ctaAction && (
                            <Button
                                onClick={ctaAction}
                                disabled={loading}
                                size="sm"
                                className={cn("h-8 px-4 text-[12.5px] font-semibold rounded-md transition-all", colors.btn)}
                            >
                                {loading && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
                                {cta}
                            </Button>
                        )}
                        <button
                            onClick={() => setDismissed(true)}
                            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

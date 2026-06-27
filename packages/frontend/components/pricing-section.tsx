"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Clock, Layers, X, Building2, Mail, Loader2 } from "lucide-react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { useSubscription } from "@/hooks/use-subscription";

const ease = [0.16, 1, 0.3, 1] as const;

interface PlanFeature {
    text: string;
    included: boolean;
}

interface Plan {
    name: string;
    icon: React.ReactNode;
    price: string;
    priceYearly?: string;
    period?: string;
    periodYearly?: string;
    description: string;
    features: PlanFeature[];
    cta: string;
    ctaTrial?: string;
    popular?: boolean;
    enterprise?: boolean;
}

export function PricingSection() {
    const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">("monthly");

    const plans: Plan[] = [
        {
            name: "Free Trial",
            icon: <Clock className="h-4 w-4" />,
            price: "$0",
            period: "for 7 days",
            description: "Explore OmniContent AI with limited access. No credit card required.",
            features: [
                { text: "3 atomization projects", included: true },
                { text: "3 clips per video", included: true },
                { text: "Standard transcription", included: true },
                { text: "1080p export", included: true },
                { text: "Article & social content", included: true },
                { text: "Multi-platform publishing", included: false },
                { text: "AI translation", included: false },
                { text: "Content editor", included: false },
                { text: "Video reformatting", included: false },
            ],
            cta: "Start Free Trial",
        },
        {
            name: "Pro",
            icon: <Layers className="h-4 w-4" />,
            price: "$49",
            priceYearly: "$39",
            period: "/month",
            periodYearly: "/mo, billed yearly",
            description: "For creators and teams who ship content every week.",
            features: [
                { text: "Unlimited atomization projects", included: true },
                { text: "6 clips per video", included: true },
                { text: "99.8% transcription accuracy", included: true },
                { text: "4K export", included: true },
                { text: "Article & social content", included: true },
                { text: "Multi-platform publishing", included: true },
                { text: "AI translation (40+ languages)", included: true },
                { text: "Premium content editor", included: true },
                { text: "Video reformatting & export", included: true },
                { text: "Priority processing", included: true },
            ],
            cta: "Upgrade to Pro",
            ctaTrial: "Start Free Trial",
            popular: true,
        },
        {
            name: "Enterprise",
            icon: <Building2 className="h-4 w-4" />,
            price: "Custom",
            description: "For media organizations with bespoke requirements.",
            features: [
                { text: "Everything in Pro", included: true },
                { text: "Dedicated GPU clusters", included: true },
                { text: "Custom model fine-tuning", included: true },
                { text: "SSO & RBAC", included: true },
                { text: "SLA guarantees", included: true },
                { text: "24/7 dedicated support", included: true },
                { text: "Custom integrations", included: true },
            ],
            cta: "Contact Sales",
            enterprise: true,
        },
    ];

    return (
        <section id="pricing" className="section-y">
            <div className="container-page">
                <header className="mb-12 md:mb-14 mx-auto max-w-2xl text-center">
                    <p className="eyebrow mb-3 text-brand">Pricing</p>
                    <h2 className="section-title mx-auto text-balance">
                        Simple, transparent.{" "}
                        <span className="text-muted-foreground">No surprises.</span>
                    </h2>
                    <p className="section-lede mx-auto mt-4 text-balance">
                        Start with a free trial. Upgrade when you ship more. Cancel anytime.
                    </p>

                    {/* Billing cycle toggle */}
                    <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-lg border border-border bg-secondary/40">
                        <button
                            onClick={() => setBillingCycle("monthly")}
                            className={cn(
                                "px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-200",
                                billingCycle === "monthly"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("yearly")}
                            className={cn(
                                "px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-200 relative",
                                billingCycle === "yearly"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Yearly
                            <span className="ml-2 text-[10px] text-brand font-bold uppercase tracking-wider">
                                Save 20%
                            </span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.5, ease, delay: i * 0.06 }}
                            className="h-full"
                        >
                            <PricingCard
                                plan={plan}
                                billingCycle={billingCycle}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function PricingCard({
    plan,
    billingCycle,
}: {
    plan: Plan;
    billingCycle: "monthly" | "yearly";
}) {
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const { status, plan: currentPlan, createCheckout, startTrial } = useSubscription();
    const [loading, setLoading] = React.useState(false);

    const displayPrice = billingCycle === "yearly" && plan.priceYearly ? plan.priceYearly : plan.price;
    const displayPeriod = billingCycle === "yearly" && plan.periodYearly ? plan.periodYearly : plan.period;

    const isCurrentPlan =
        (plan.name === "Free Trial" && (status === "trialing" || status === "none")) ||
        (plan.name === "Pro" && currentPlan === "pro" && status === "active");

    const handleCta = async () => {
        if (!isSignedIn) return; // SignInButton handles this case

        if (plan.enterprise) {
            window.location.href = "mailto:contact@arpitverma.me?subject=OmniContent%20AI%20Enterprise%20Inquiry";
            return;
        }

        if (plan.name === "Free Trial") {
            setLoading(true);
            const result = await startTrial();
            if (result.success) {
                router.push("/dashboard");
            } else {
                toast.error(result.error || "Failed to start trial.");
            }
            setLoading(false);
            return;
        }

        if (plan.name === "Pro") {
            setLoading(true);
            const result = await createCheckout(billingCycle);
            if (result.url) {
                window.location.href = result.url;
            }
            setLoading(false);
        }
    };

    const ctaLabel = (() => {
        if (isCurrentPlan && plan.name === "Pro") return "Current Plan";
        if (isCurrentPlan && plan.name === "Free Trial") {
            if (status === "trialing") return "Trial Active";
            return plan.cta;
        }
        if (plan.name === "Pro" && status === "trialing") return "Upgrade to Pro";
        return plan.cta;
    })();

    const ctaDisabled = (isCurrentPlan && plan.name === "Pro") || loading;

    return (
        <CardSpotlight
            className={cn(
                "relative h-full p-7 md:p-8 flex flex-col rounded-xl overflow-visible transition-all duration-300",
                plan.popular
                    ? "border-brand/40 shadow-[0_0_0_1px_var(--accent-glow),0_24px_60px_-30px_var(--accent-glow)]"
                    : "border-border hover:border-foreground/30 hover:shadow-sm"
            )}
        >
            {plan.popular && (
                <>
                    <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent"
                    />
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-xl"
                        style={{
                            background:
                                "radial-gradient(120% 80% at 50% 0%, var(--accent-glow), transparent 60%)",
                            opacity: 0.5,
                        }}
                    />
                </>
            )}

            <div className="relative z-20">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-md",
                            plan.popular ? "bg-brand/15 text-brand" : "bg-secondary text-muted-foreground"
                        )}>
                            {plan.icon}
                        </span>
                        <h3 className="eyebrow text-[10.5px] m-0">{plan.name}</h3>
                    </div>
                    {plan.popular && (
                        <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full bg-brand/12 border border-brand/35 text-[10px] font-mono uppercase tracking-[0.16em] text-brand">
                            <span className="h-1 w-1 rounded-full bg-brand animate-pulse" />
                            Recommended
                        </span>
                    )}
                </div>
                <div className="flex items-baseline gap-1">
                    <span
                        className="font-heading text-[40px] leading-none tracking-[-0.035em] font-semibold text-foreground"
                    >
                        {displayPrice}
                    </span>
                    {displayPeriod && (
                        <span className="text-[13px] text-muted-foreground">
                            {displayPeriod}
                        </span>
                    )}
                </div>
                {billingCycle === "yearly" && plan.priceYearly && (
                    <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[12px] text-muted-foreground line-through">$49/mo</span>
                        <span className="text-[11px] font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                            SAVE $120/yr
                        </span>
                    </div>
                )}
                <p className="mt-3 text-[13.5px] leading-6 text-muted-foreground">
                    {plan.description}
                </p>
            </div>

            <ul className="relative z-20 mt-7 flex-1 space-y-3">
                {plan.features.map((feat) => (
                    <li
                        key={feat.text}
                        className={cn(
                            "flex items-start gap-2.5 text-[13.5px]",
                            !feat.included && "opacity-45"
                        )}
                    >
                        <span
                            className={cn(
                                "mt-[3px] inline-flex h-4 w-4 items-center justify-center rounded-full",
                                feat.included
                                    ? plan.popular ? "bg-brand/20" : "bg-brand/12"
                                    : "bg-muted"
                            )}
                        >
                            {feat.included ? (
                                <Check className="h-2.5 w-2.5 text-brand" strokeWidth={3} />
                            ) : (
                                <X className="h-2.5 w-2.5 text-muted-foreground" strokeWidth={3} />
                            )}
                        </span>
                        <span className={feat.included ? "text-foreground/85" : "text-muted-foreground"}>
                            {feat.text}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="relative z-20 mt-8 space-y-2">
                {isSignedIn ? (
                    <Button
                        onClick={handleCta}
                        disabled={ctaDisabled}
                        className={cn(
                            "w-full h-10 rounded-md text-[13.5px] font-medium transition-all",
                            plan.popular
                                ? "bg-foreground text-background hover:opacity-90"
                                : plan.enterprise
                                    ? "bg-secondary text-foreground hover:bg-secondary/80"
                                    : "bg-secondary text-foreground hover:bg-secondary/80"
                        )}
                    >
                        {loading && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                        {plan.enterprise && <Mail className="h-3.5 w-3.5 mr-2" />}
                        {ctaLabel}
                    </Button>
                ) : (
                    <SignInButton mode="modal">
                        <Button
                            className={cn(
                                "w-full h-10 rounded-md text-[13.5px] font-medium transition-opacity",
                                plan.popular
                                    ? "bg-foreground text-background hover:opacity-90"
                                    : "bg-secondary text-foreground hover:bg-secondary/80"
                            )}
                        >
                            {plan.cta}
                        </Button>
                    </SignInButton>
                )}
                {plan.name === "Free Trial" && (
                    <p className="text-center text-[11.5px] text-muted-foreground">
                        No credit card required
                    </p>
                )}
                {plan.enterprise && (
                    <p className="text-center text-[11.5px] text-muted-foreground">
                        contact@arpitverma.me
                    </p>
                )}
            </div>
        </CardSpotlight>
    );
}

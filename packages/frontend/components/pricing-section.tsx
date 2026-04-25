"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "@/components/ui/card-spotlight";

const ease = [0.16, 1, 0.3, 1] as const;

interface Plan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

/**
 * Pricing — single signature: CardSpotlight (cursor-follow
 * glow). Popular tier no longer scales; instead it gets a
 * thicker emerald accent rail at the top + slightly stronger
 * border. Quieter, more confident.
 */
export function PricingSection() {
  const plans: Plan[] = [
    {
      name: "Starter",
      price: "$0",
      period: "/month",
      description: "For individuals exploring AI content workflows.",
      features: [
        "500 clips per month",
        "Standard transcription",
        "1080p export",
        "Community support",
      ],
      cta: "Start for free",
    },
    {
      name: "Pro",
      price: "$49",
      period: "/month",
      description: "For creators and teams shipping every week.",
      features: [
        "Unlimited clips",
        "99.8% transcription accuracy",
        "4K export",
        "Brand voice templates",
        "Priority processing",
      ],
      cta: "Upgrade to Pro",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For media organizations with bespoke requirements.",
      features: [
        "Dedicated GPU clusters",
        "Custom model fine-tuning",
        "SSO & RBAC",
        "SLA guarantees",
        "24/7 dedicated support",
      ],
      cta: "Contact sales",
    },
  ];

  return (
    <section id="pricing" className="section-y">
      <div className="container-page">
        <header className="mb-12 md:mb-14 mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">Pricing</p>
          <h2 className="section-title mx-auto text-balance">
            Simple, transparent.{" "}
            <span className="text-muted-foreground">No surprises.</span>
          </h2>
          <p className="section-lede mx-auto mt-4 text-balance">
            Start free. Upgrade when you ship more. Cancel anytime.
          </p>
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
              <CardSpotlight
                className={cn(
                  "relative h-full p-7 md:p-8 flex flex-col rounded-xl overflow-visible transition-all duration-300",
                  plan.popular
                    ? "border-brand/40 shadow-[0_0_0_1px_var(--accent-glow),0_24px_60px_-30px_var(--accent-glow)]"
                    : "border-border hover:border-foreground/25"
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
                    <h3 className="eyebrow text-[10.5px] m-0">{plan.name}</h3>
                    {plan.popular && (
                      <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full bg-brand/12 border border-brand/35 text-[10px] font-mono uppercase tracking-[0.16em] text-brand">
                        <span className="h-1 w-1 rounded-full bg-brand animate-pulse" />
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "font-heading text-[40px] leading-none tracking-[-0.035em] font-semibold",
                        plan.popular ? "text-foreground" : "text-foreground"
                      )}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-[13px] text-muted-foreground">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[13.5px] leading-6 text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <ul className="relative z-20 mt-7 flex-1 space-y-3">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2.5 text-[13.5px]"
                    >
                      <span
                        className={cn(
                          "mt-[3px] inline-flex h-4 w-4 items-center justify-center rounded-full",
                          plan.popular ? "bg-brand/20" : "bg-brand/12"
                        )}
                      >
                        <Check className="h-2.5 w-2.5 text-brand" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/85">{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="relative z-20 mt-8">
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
                </div>
              </CardSpotlight>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

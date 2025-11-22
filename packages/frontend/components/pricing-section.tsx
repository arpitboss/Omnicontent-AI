"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      description: "Perfect for individuals exploring neural content generation.",
      features: [
        "500 AI-generated clips / mo",
        "Basic neural transcription",
        "720p export quality",
        "Community support"
      ],
      cta: "Start Building",
      popular: false
    },
    {
      name: "Pro",
      price: "$49",
      description: "For creators and teams requiring high-velocity output.",
      features: [
        "Unlimited AI clips",
        "99.8% accuracy transcription",
        "4K export quality",
        "Custom brand templates",
        "Priority neural processing"
      ],
      cta: "Upgrade to Pro",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Scalable infrastructure for media organizations.",
      features: [
        "Dedicated GPU clusters",
        "Custom model fine-tuning",
        "SSO & RBAC",
        "SLA guarantees",
        "24/7 dedicated support"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section className="py-32 relative overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-neutral-900 dark:text-neutral-100 mb-6">
            Simple, Transparent <br />
            <span className="text-neutral-400 dark:text-neutral-600">Pricing.</span>
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Choose the plan that fits your scale. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 border flex flex-col h-full transition-all duration-500 group ${plan.popular
                ? "bg-white dark:bg-black border-black dark:border-white shadow-2xl scale-105 z-10"
                : "bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg hover:-translate-y-1"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black px-4 py-1 text-sm font-bold shadow-md uppercase tracking-widest animate-pulse">
                  Recommended
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2 uppercase tracking-widest">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-neutral-500 dark:text-neutral-400">/month</span>}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 group/feature">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center group-hover/feature:bg-black dark:group-hover/feature:bg-white transition-colors duration-300">
                      <Check className="w-2.5 h-2.5 text-black dark:text-white group-hover/feature:text-white dark:group-hover/feature:text-black transition-colors duration-300" />
                    </div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full h-12 rounded-none font-bold transition-all duration-300 uppercase tracking-widest relative overflow-hidden ${plan.popular
                  ? "bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 shadow-lg"
                  : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  }`}
              >
                <span className="relative z-10">{plan.cta}</span>
                {plan.popular && (
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

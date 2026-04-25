"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { CardSpotlight } from "@/components/ui/card-spotlight";

export function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      description: "Perfect for individuals exploring AI content generation.",
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
    <section className="relative overflow-hidden bg-transparent">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="section-title mx-auto mb-6">
            Simple, transparent{" "}
            <span className="text-muted-foreground/60">pricing.</span>
          </h2>
          <p className="section-subtitle mx-auto">
            Choose the plan that fits your scale. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full"
            >
              <CardSpotlight
                className={`relative rounded-xl p-8 flex flex-col h-full transition-all duration-500 group ${plan.popular
                  ? "bg-card border-emerald-500/30 shadow-xl shadow-emerald-500/[0.05] scale-[1.02] z-10"
                  : "bg-card border-border/60"
                  }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-4 py-1 text-xs font-bold rounded-full shadow-md z-30">
                    Recommended
                  </div>
                )}

                <div className="mb-8 relative z-20">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4 text-foreground">
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground text-sm">/month</span>}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="flex-1 space-y-3.5 mb-8 relative z-20">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 group/feature">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover/feature:bg-emerald-500 transition-colors duration-300">
                        <Check className="w-3 h-3 text-emerald-500 group-hover/feature:text-white dark:group-hover/feature:text-black transition-colors duration-300" />
                      </div>
                      <span className="text-sm text-muted-foreground group-hover/feature:text-foreground transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className={`w-full h-11 rounded-lg font-bold transition-all duration-300 relative overflow-hidden z-20 ${plan.popular
                    ? "bg-foreground text-background hover:bg-foreground/90 shadow-lg hover:shadow-xl hover:-translate-y-px"
                    : "bg-muted hover:bg-accent text-foreground"
                    }`}
                >
                  <span className="relative z-10">{plan.cta}</span>
                </Button>
              </CardSpotlight>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

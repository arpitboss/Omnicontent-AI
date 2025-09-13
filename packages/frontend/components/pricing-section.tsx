"use client";

import { Check, Star, Crown, Zap } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    description: "Perfect for trying out the platform",
    price: "$0",
    period: "/month",
    features: [
      "5 uploads per month",
      "Basic transcription",
      "10 language support", 
      "Standard export formats"
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    icon: Zap,
    popular: false
  },
  {
    name: "Pro", 
    description: "For serious content creators",
    price: "$29",
    period: "/month", 
    features: [
      "Unlimited uploads",
      "Advanced AI transcription",
      "40+ language support",
      "All export formats",
      "Real-time processing",
      "Priority support"
    ],
    buttonText: "Start Pro Trial",
    buttonVariant: "default" as const,
    icon: Star,
    popular: true
  },
  {
    name: "Enterprise",
    description: "For teams and businesses", 
    price: "$99",
    period: "/month",
    features: [
      "Everything in Pro",
      "Team collaboration", 
      "Custom integrations",
      "Advanced analytics",
      "Dedicated support",
      "SLA guarantee"
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    icon: Crown,
    popular: false
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-5xl font-bold gradient-text text-shadow-lg">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your content creation needs
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <GlassCard
                variant={plan.popular ? "premium" : undefined}
                className={`p-8 relative transition-all duration-500 ${
                  plan.popular 
                    ? "border-2 border-primary/50 scale-[1.03] shadow-2xl"
                    : "hover:shadow-xl"
                }`}
                data-testid={`pricing-plan-${index}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-2 font-semibold">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        plan.popular
                          ? "bg-gradient-to-br from-primary to-secondary"
                          : "bg-muted"
                      }`}
                    >
                      <plan.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground">
                        {plan.name}
                      </h3>
                      <p className="text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline">
                    <span
                      className={`text-5xl font-bold ${
                        plan.popular ? "gradient-text" : "text-foreground"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {plan.period}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center space-x-3"
                      >
                        <Check className="w-5 h-5 text-chart-2 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <AnimatedButton
                    animation={plan.popular ? "glow" : "scale"}
                    variant={plan.buttonVariant}
                    aria-label={`Select ${plan.name} plan`}
                    className={`w-full py-3 font-semibold transition-all duration-300 ${
                      plan.popular
                        ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg hover:shadow-xl"
                        : "glass-effect hover:bg-accent/20"
                    }`}
                    data-testid={`pricing-button-${index}`}
                  >
                    {plan.buttonText}
                  </AnimatedButton>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-sm text-muted-foreground">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-chart-2" />
              <span>No credit card required</span>
            </span>
            <span className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-chart-2" />
              <span>24/7 support</span>
            </span>
            <span className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-chart-2" />
              <span>Secure & private</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Metrics — a single horizontal stat band with vertical
 * dividers. Linear's signature stat-band pattern. No card
 * chrome around the numbers; the dividers do the work.
 */
export function MetricsSection() {
  const metrics = [
    {
      value: 10,    suffix: "×",   decimals: 0,
      label: "Faster shipping",
      detail: "vs. manual content workflows",
    },
    {
      value: 300,   suffix: "%",   decimals: 0,
      label: "Engagement uplift",
      detail: "average across published clips",
    },
    {
      value: 50,    suffix: "k+",  decimals: 0,
      label: "Active creators",
      detail: "publishing every week",
    },
    {
      value: 99.8,  suffix: "%",   decimals: 1,
      label: "Transcription accuracy",
      detail: "across 40+ languages",
    },
  ];

  return (
    <section className="section-y">
      <div className="container-page">
        <header className="mb-12 md:mb-14 max-w-2xl">
          <p className="eyebrow mb-3">Performance</p>
          <h2 className="section-title text-balance">
            Numbers that move{" "}
            <span className="text-muted-foreground">the work forward.</span>
          </h2>
          <p className="section-lede mt-4 text-balance">
            Measured across thousands of hours of source video and millions of
            published assets.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-border">
          {metrics.map((m, i) => {
            const isLastCol = i === metrics.length - 1;
            const isMobileRightCol = i % 2 === 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease, delay: i * 0.06 }}
                className={cn(
                  "group relative py-8 md:py-10 px-5 md:px-7 transition-colors duration-300",
                  "hover:bg-muted/30",
                  // Mobile: 2 cols → only right column gets no right-border
                  !isMobileRightCol && "border-r border-border",
                  // Mobile: bottom border on top row only (first 2 items)
                  i < 2 && "border-b border-border md:border-b-0",
                  // Desktop: 4 cols → only last item gets no right-border
                  isLastCol && "md:border-r-0",
                  // Desktop: ensure all items have a right-border except last
                  !isLastCol && "md:border-r md:border-border",
                )}
              >
                {/* Active accent rail under hovered metric */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-5 md:inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="font-heading text-[44px] md:text-[56px] leading-none tracking-[-0.035em] font-semibold text-foreground">
                  <NumberTicker
                    value={m.value}
                    suffix={m.suffix}
                    decimalPlaces={m.decimals}
                    delay={0.1}
                  />
                </div>
                <div className="mt-3 text-[14px] font-medium text-foreground">
                  {m.label}
                </div>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  {m.detail}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

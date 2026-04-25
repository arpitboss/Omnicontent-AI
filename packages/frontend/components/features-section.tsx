"use client";


import { cn } from "@/lib/utils";
import {
  Cpu,
  Globe,
  Share2,
  Type,
  Zap
} from "lucide-react";
import { motion } from "motion/react";

import { WobbleCard } from "@/components/ui/wobble-card";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

export function FeaturesSection() {
  const features = [
    {
      title: "Neural Transcription",
      description: "Enterprise-grade speech-to-text with 99.8% accuracy across 40+ languages.",
      header: <NeuralTranscriptionVisual />,
      icon: <Type className="h-4 w-4" />,
      className: "col-span-1 lg:col-span-2 min-h-[300px]",
    },
    {
      title: "Global CDN",
      description: "Edge-cached content delivery ensuring <50ms latency worldwide.",
      header: <GlobalCDNVisual />,
      icon: <Globe className="h-4 w-4" />,
      className: "col-span-1 min-h-[300px]",
    },
    {
      title: "Contextual Intelligence",
      description: "AI that understands nuance, humor, and cultural context for better clips.",
      header: <ContextualIntelligenceVisual />,
      icon: <Cpu className="h-4 w-4" />,
      className: "col-span-1 min-h-[300px]",
    },
    {
      title: "Multi-Platform Distribution",
      description: "One-click publishing to LinkedIn, Twitter, Instagram, and TikTok.",
      header: <MultiPlatformVisual />,
      icon: <Share2 className="h-4 w-4" />,
      className: "col-span-1 lg:col-span-2 min-h-[300px]",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Core Capabilities</span>
        </div>
        <h2 className="section-title mb-6">
          Engineered for{" "}
          <span className="text-muted-foreground/60">maximum velocity.</span>
        </h2>
        <p className="section-subtitle">
          Our distributed neural network processes petabytes of video data daily with sub-millisecond latency.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full px-6">
        {features.map((item, i) => (
          <WobbleCard
            key={i}
            containerClassName={cn(
              item.className,
              "h-full border border-border/50 bg-card/50 overflow-hidden"
            )}
          >
            <div className="flex flex-col h-full z-20 relative">
              <div className="flex-1 w-full flex items-center justify-center">
                {item.header}
              </div>
              <div className="p-4 bg-background/20 backdrop-blur-sm mt-auto relative z-30 flex items-center gap-4 border-t border-border/30">
                <div className="p-2 bg-background rounded-lg border border-border/50 text-foreground">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          </WobbleCard>
        ))}
      </div>
    </section>
  );
}

const NeuralTranscriptionVisual = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-muted/40 to-muted/10 relative overflow-hidden group">
      <div className="w-full max-w-md space-y-4 relative z-10">
        {[
          { text: "Analyzing audio stream...", width: "60%" },
          { text: "Detecting speakers...", width: "40%" },
          { text: "Generating transcript...", width: "80%" },
        ].map((line, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>{line.text}</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                className="text-primary"
              >
                PROCESSING
              </motion.span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary/60 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: line.width }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.4,
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GlobalCDNVisual = () => {
  return (
    <div className="w-full h-full relative group/canvas-card flex items-center justify-center bg-card dark:bg-card p-4">
      <div className="absolute inset-0 z-0">
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-emerald-900/10"
          colors={[
            [0, 255, 255],
            [232, 121, 249],
          ]}
          dotSize={2}
        />
      </div>
      <div className="relative z-10 flex items-center justify-center">
        <div className="p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-border/50 shadow-xl group-hover/canvas-card:-translate-y-2 transition-transform duration-500">
          <Globe className="w-12 h-12 text-emerald-500" />
        </div>
      </div>
    </div>
  );
};

const ContextualIntelligenceVisual = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-muted/30 to-transparent relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/[0.04] via-transparent to-transparent" />

      <div className="space-y-4 w-full max-w-[200px] relative z-10">
        {[
          { label: "Sentiment", value: 94, color: "bg-emerald-500" },
          { label: "Context", value: 87, color: "bg-blue-500" },
          { label: "Intent", value: 91, color: "bg-purple-500" },
        ].map((item, i) => (
          <div key={i} className="group cursor-default">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
              <span className="text-[10px] font-mono text-foreground/70">{item.value}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", item.color)}
                initial={{ width: "0%" }}
                whileInView={{ width: `${item.value}%` }}
                transition={{ duration: 1, delay: i * 0.2, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MultiPlatformVisual = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-card relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="w-full h-full grid grid-cols-12 grid-rows-6">
          {[...Array(72)].map((_, i) => (
            <div key={i} className="border-r border-b border-foreground" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 relative z-10">
        {[
          { color: "bg-[#0A66C2]", icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /> },
          { color: "bg-foreground", icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />, fill: "fill-background" },
          { color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]", icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /> },
          { color: "bg-foreground", icon: <path d="M12.53.02C13.18 0 13.82 0 14.47.02c2.72.07 4.47 1.15 5.54 2.13.78.72 1.38 1.57 1.81 2.43.82 1.62 1.05 3.45 1.15 5.42.03.62.05 1.23.05 1.85v.3c0 .62-.02 1.23-.05 1.85-.1 1.97-.33 3.8-1.15 5.42-.43.86-1.03 1.71-1.81 2.43-1.07.98-2.82 2.06-5.54 2.13-.65.02-1.29.02-1.94.02h-.06c-.65 0-1.29 0-1.94-.02-2.72-.07-4.47-1.15-5.54-2.13-.78-.72-1.38-1.57-1.81-2.43C1.37 17.81 1.15 15.98 1.05 14.01 1.02 13.39 1 12.77 1 12.15v-.3c0-.62.02-1.23.05-1.85C1.15 8.03 1.37 6.19 2.19 4.58c.43-.86 1.03-1.71 1.81-2.43C5.07 1.17 6.82.09 9.54.02 10.19 0 10.82 0 11.47.02h1.06zM9.54 8.87c-.34 0-.62.28-.62.62v5.02c0 .34.28.62.62.62.34 0 .62-.28.62-.62V9.49c0-.34-.28-.62-.62-.62zm2.46 2.27c-1.01 0-1.84.82-1.84 1.84s.82 1.84 1.84 1.84 1.84-.82 1.84-1.84-.82-1.84-1.84-1.84zm4.5-2.27c-.34 0-.62.28-.62.62v5.02c0 .34.28.62.62.62.34 0 .62-.28.62-.62V9.49c0-.34-.28-.62-.62-.62z" />, fill: "fill-background" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            whileHover={{ scale: 1.08, y: -2 }}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center relative cursor-pointer shadow-md hover:shadow-lg transition-shadow",
              item.color
            )}
          >
            <svg className={cn("w-6 h-6", item.fill || "fill-white")} viewBox="0 0 24 24">
              {item.icon}
            </svg>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

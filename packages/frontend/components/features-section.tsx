"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Cpu, Globe, Share2, Type } from "lucide-react";

import { cn } from "@/lib/utils";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Features — single signature: BentoGrid (Linear's
 * asymmetric showcase pattern). One large hero tile +
 * three supporting tiles. Each header is rendered in
 * JSX (no canvas/wobble). Restrained motion only.
 */
export function FeaturesSection() {
  return (
    <section id="features" className="section-y">
      <div className="container-page">
        <header className="mb-12 md:mb-14 max-w-2xl">
          <p className="eyebrow mb-3">Core capabilities</p>
          <h2 className="section-title text-balance">
            Engineered for velocity.{" "}
            <span className="text-muted-foreground">Built for craft.</span>
          </h2>
          <p className="section-lede mt-4 text-balance">
            A single pipeline that transcribes, atomizes, and adapts your work
            to every channel — without sanding off the edges.
          </p>
        </header>

        <BentoGrid className="md:auto-rows-[15.5rem] md:grid-cols-4 gap-3 md:gap-4">
          <BentoGridItem
            className="md:col-span-2 md:row-span-2"
            title="Neural transcription"
            description="99.8% accuracy across 40+ languages. Speaker-aware, timecode-perfect, ready to caption."
            icon={<Type className="h-3.5 w-3.5" />}
            header={<TranscriptionHeader />}
          />
          <BentoGridItem
            className="md:col-span-2"
            title="Multi-platform distribution"
            description="One pipeline, every channel. Native formatting for LinkedIn, X, Instagram, YouTube, and more."
            icon={<Share2 className="h-3.5 w-3.5" />}
            header={<DistributionHeader />}
          />
          <BentoGridItem
            className="md:col-span-1"
            title="Contextual intelligence"
            description="Tone, intent, and brand voice — preserved across formats."
            icon={<Cpu className="h-3.5 w-3.5" />}
            header={<ContextHeader />}
          />
          <BentoGridItem
            className="md:col-span-1"
            title="Edge delivery"
            description="Sub-50ms global CDN for every clip and asset."
            icon={<Globe className="h-3.5 w-3.5" />}
            header={<EdgeHeader />}
          />
        </BentoGrid>
      </div>
    </section>
  );
}

/* ─── Tile headers (restrained, monochrome) ─── */

function TranscriptionHeader() {
  const lines = [
    { w: "78%", t: "Hey everyone — welcome back to the show…" },
    { w: "62%", t: "We've been iterating on three core ideas…" },
    { w: "84%", t: "And here's what we shipped this quarter." },
    { w: "46%", t: "Let's dig in." },
  ];
  return (
    <div className="absolute inset-0 p-6 flex flex-col gap-2.5 justify-center">
      {lines.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease, delay: i * 0.06 }}
          className="flex items-center gap-3"
        >
          <span
            className="font-mono text-[10px] text-muted-foreground tabular-nums"
            style={{ minWidth: 44 }}
          >
            00:0{i}:{((i + 1) * 7).toString().padStart(2, "0")}
          </span>
          <span className="truncate text-[13px] text-foreground/85">
            {l.t}
          </span>
        </motion.div>
      ))}
      <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
        Live transcription • English
      </div>
    </div>
  );
}

function DistributionHeader() {
  const items = [
    { label: "LinkedIn", w: 64 },
    { label: "X",        w: 48 },
    { label: "Instagram",w: 56 },
    { label: "YouTube",  w: 72 },
    { label: "TikTok",   w: 40 },
  ];
  return (
    <div className="absolute inset-0 p-6 flex flex-col justify-center gap-2">
      {items.map((it, i) => (
        <div key={it.label} className="flex items-center gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground w-[68px]">
            {it.label}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${it.w}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease, delay: i * 0.08 }}
              className={cn(
                "h-full rounded-full",
                i === 3 ? "bg-brand" : "bg-foreground/55"
              )}
            />
          </div>
          <span className="font-mono text-[10.5px] text-muted-foreground tabular-nums w-8 text-right">
            {it.w}%
          </span>
        </div>
      ))}
    </div>
  );
}

function ContextHeader() {
  return (
    <div className="absolute inset-0 p-6 flex items-center justify-center">
      <div className="relative h-24 w-24 rounded-full border border-border flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(closest-side, var(--accent-glow), transparent 70%)",
          }}
        />
        <Cpu className="h-7 w-7 text-foreground relative z-10" />
        <motion.span
          aria-hidden
          className="absolute inset-[-6px] rounded-full border border-brand/30"
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

function EdgeHeader() {
  return (
    <div className="absolute inset-0 p-6 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <motion.span
                key={i}
                className={cn(
                  "h-2.5 w-2.5 rounded-sm",
                  i === 4 ? "bg-brand" : "bg-foreground/15"
                )}
                initial={{ opacity: 0.3 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              />
            ))}
          </div>
          {/* Pulsing radius around the centre node */}
          <motion.span
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-sm border border-brand/50"
            animate={{ scale: [1, 2.4, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
        </div>
        <div className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-foreground">42</span>ms · global
        </div>
      </div>
    </div>
  );
}

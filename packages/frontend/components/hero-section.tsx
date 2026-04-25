"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FlipWords } from "@/components/ui/flip-words";
import { Spotlight } from "@/components/ui/spotlight";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Hero — Linear.app inspired
 *
 * Single signature glow (Spotlight), one animated word (FlipWords),
 * and a below-the-fold scroll-tilt product peek (ContainerScroll)
 * that reveals a faux dashboard placeholder rendered in JSX.
 *
 * The faux dashboard is intentionally a placeholder; it will be
 * replaced with a real screenshot/MP4 after the /dashboard redesign.
 */
export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden pt-32 md:pt-36">
      {/* Single, subtle spotlight from upper-left */}
      <Spotlight
        className="-top-40 left-0 md:-top-20 md:left-40"
        fill="var(--accent-500)"
      />

      {/* Hairline grid behind content — barely there */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.6] dark:opacity-[0.35]"
        style={{
          maskImage:
            "radial-gradient(60% 50% at 50% 0%, black 0%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(60% 50% at 50% 0%, black 0%, transparent 80%)",
          backgroundImage: `
            linear-gradient(to right, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
        }}
      />

      <div className="container-page relative">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          {/* Eyebrow / status pill */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className={cn(
              "inline-flex items-center gap-2 h-7 px-3 rounded-full",
              "border border-border bg-background/60 backdrop-blur-sm",
              "text-[12px] text-muted-foreground"
            )}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
            <span>Now in public beta</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.06 }}
            className="display mt-6"
          >
            Upload once.
            <br />
            <span className="inline-flex items-baseline">
              <FlipWords
                words={["Publish", "Distribute", "Reach"]}
                duration={3200}
                className="!p-0 !m-0 text-foreground"
              />
              <span className="ml-3 text-muted-foreground">everywhere.</span>
            </span>
          </motion.h1>

          {/* Lede */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.16 }}
            className="section-lede mx-auto mt-6"
          >
            OmniContent atomizes one long-form video into clips, articles, and
            platform-native posts — in your voice, ready to ship in minutes.
          </motion.p>

          {/* CTA pair */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.24 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/create">
              <Button
                className={cn(
                  "h-10 px-5 rounded-md text-[13.5px] font-medium",
                  "bg-foreground text-background hover:opacity-92",
                  "transition-[opacity,transform] duration-200 active:translate-y-px",
                  "group"
                )}
              >
                Start for free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                variant="ghost"
                className={cn(
                  "h-10 px-4 rounded-md text-[13.5px] font-medium",
                  "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Play className="mr-2 h-3.5 w-3.5" />
                See how it works
              </Button>
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease, delay: 0.4 }}
            className="mt-14 w-full"
          >
            <p className="eyebrow mb-5">Trusted by teams shipping content at</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground">
              {["Northwind", "Acme", "Globex", "Initech", "Hooli", "Umbrella"].map(
                (name) => (
                  <span
                    key={name}
                    className="font-heading text-[15px] font-semibold tracking-[-0.01em] opacity-60 hover:opacity-100 transition-opacity duration-200"
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Below-the-fold product peek ───────────────
            ContainerScroll provides the scroll-tilt; the
            inner JSX is a tasteful placeholder dashboard. */}
        <div className="mt-0 md:mt-2">
          <ContainerScroll titleComponent={<></>}>
            <FauxDashboard />
          </ContainerScroll>
        </div>
      </div>
    </section>
  );
}

/* ─── Faux dashboard preview ────────────────────────
   Mirrors the real /dashboard layout (header, stats,
   project card with tabs) so the hero scroll-tilt
   shows users what they'll actually get. */
function FauxDashboard() {
  return (
    <div
      className={cn(
        "relative h-full w-full rounded-2xl overflow-hidden",
        "bg-background border border-border shadow-[0_24px_56px_-16px_rgba(0,0,0,0.18)]"
      )}
    >
      {/* Browser chrome */}
      <div className="h-9 px-4 flex items-center gap-2 border-b border-border bg-secondary/40 shrink-0">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="mx-auto h-5 px-3 inline-flex items-center rounded-md border border-border bg-background text-[10px] text-muted-foreground font-mono">
          omnicontent.ai/dashboard
        </div>
      </div>

      {/* Page body */}
      <div className="relative h-[calc(100%-2.25rem)] overflow-hidden p-5 md:p-7">
        {/* Soft brand glow — same as real dashboard */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 h-[280px] w-[70%] -z-10"
          style={{
            background:
              "radial-gradient(closest-side, var(--accent-glow), transparent 70%)",
            opacity: 0.5,
          }}
        />

        {/* Page header */}
        <div className="flex items-end justify-between border-b border-border pb-4 mb-5">
          <div>
            <p className="eyebrow mb-1.5 text-[10px]">Dashboard</p>
            <h3 className="text-[18px] md:text-[22px] font-semibold tracking-[-0.02em] text-foreground leading-tight">
              Your projects.{" "}
              <span className="text-muted-foreground">All your output.</span>
            </h3>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background text-[11px] font-medium">
            <span className="text-[12px] leading-none">+</span> New project
          </div>
        </div>

        {/* Stat cards */}
        <div className="hidden sm:grid grid-cols-3 gap-3 mb-5">
          {[
            { v: "12", l: "Completed", accent: false },
            { v: "2", l: "Processing", accent: false, processing: true },
            { v: "47", l: "Total assets", accent: true },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div
                className={cn(
                  "text-[20px] font-semibold tracking-tight leading-none",
                  s.accent ? "text-brand" : "text-foreground"
                )}
              >
                {s.v}
              </div>
              <div className="mt-1.5 text-[10.5px] text-muted-foreground flex items-center gap-1.5">
                {s.processing && (
                  <span className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                )}
                {s.l}
              </div>
            </div>
          ))}
        </div>

        {/* Library section header */}
        <div className="flex items-end justify-between border-b border-border pb-3 mb-4">
          <div>
            <p className="eyebrow mb-1 text-[9.5px]">Recent activity</p>
            <div className="text-[14px] font-semibold tracking-tight text-foreground">
              Library
            </div>
          </div>
          <div className="hidden md:inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-brand" />
            Auto-refreshing every 5s
          </div>
        </div>

        {/* Project card */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          {/* Card header */}
          <div className="flex items-start justify-between gap-3 mb-4 border-b border-border pb-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-medium border border-brand/30 text-brand bg-brand/10 mb-2">
                <span className="w-1 h-1 rounded-full bg-brand" />
                Ready
              </span>
              <h4 className="text-[14.5px] md:text-[16px] font-semibold tracking-tight text-foreground mb-1.5">
                Q3 launch keynote — atomized
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-muted/40 text-[10px] text-muted-foreground">
                <span className="text-[9px]">↗</span> youtu.be
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <div className="h-7 px-2.5 rounded-md border border-border text-[10.5px] text-muted-foreground inline-flex items-center">
                Export
              </div>
              <div className="h-7 px-2.5 rounded-md border border-border text-[10.5px] text-muted-foreground inline-flex items-center">
                Translate
              </div>
              <div className="h-7 px-2.5 rounded-md bg-foreground text-background text-[10.5px] font-medium inline-flex items-center">
                Publish
              </div>
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-3 gap-4">
            {/* Left: video + summary */}
            <div className="col-span-1 space-y-3">
              <p className="eyebrow text-[9.5px]">Source video</p>
              <div className="aspect-video rounded-lg border border-border bg-black/90 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/30 via-transparent to-foreground/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                    <span className="text-white text-[10px] ml-0.5">▶</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1.5">
                <p className="eyebrow text-[9px]">Summary</p>
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded bg-foreground/15" />
                  <div className="h-1.5 w-[88%] rounded bg-foreground/10" />
                  <div className="h-1.5 w-[72%] rounded bg-foreground/10" />
                </div>
              </div>
            </div>

            {/* Right: tabs + article */}
            <div className="col-span-2">
              {/* Tab strip */}
              <div className="flex items-center gap-5 border-b border-border mb-3">
                {["Article", "Social", "Clips", "Transcript"].map((t, i) => (
                  <div
                    key={t}
                    className={cn(
                      "h-8 text-[11px] font-medium border-b-2 -mb-px",
                      i === 0
                        ? "border-brand text-foreground"
                        : "border-transparent text-muted-foreground"
                    )}
                  >
                    {t}
                  </div>
                ))}
              </div>

              {/* Article preview */}
              <div className="rounded-lg border border-border p-4 space-y-2.5">
                <div className="aspect-[16/8] rounded-md bg-gradient-to-br from-brand/25 via-secondary to-foreground/10 mb-2" />
                <div className="h-3 w-[85%] rounded bg-foreground/30" />
                <div className="h-3 w-[60%] rounded bg-foreground/20" />
                <div className="pt-2 space-y-1.5">
                  <div className="h-1.5 w-full rounded bg-foreground/12" />
                  <div className="h-1.5 w-full rounded bg-foreground/12" />
                  <div className="h-1.5 w-[92%] rounded bg-foreground/10" />
                  <div className="h-1.5 w-[78%] rounded bg-foreground/10" />
                </div>
                <div className="pt-2 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="aspect-[9/16] rounded-md border border-border bg-gradient-to-b from-foreground/10 to-transparent relative overflow-hidden"
                    >
                      <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded-sm bg-brand/15 text-brand text-[8px] font-medium">
                        Ready
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

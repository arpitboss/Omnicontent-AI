"use client";

import { FlipWords } from "@/components/ui/flip-words";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Spotlight } from "@/components/ui/spotlight";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { SparklesCore } from "@/components/ui/sparkles";

const ease = [0.4, 0, 0.2, 1] as const;

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-[100vh]" />; // Prevent hydration mismatch
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-12 md:pt-20">
      {/* ── Background Elements ─────────────────────── */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
      <div className="absolute inset-0 dot-grid-bg opacity-40 dark:opacity-20 pointer-events-none" />
      <div className="absolute inset-0 w-full pointer-events-none z-[1]">
        <SparklesCore
          id="hero-sparkles"
          className="opacity-40"
          particleColor="oklch(0.12 0 0)"
          background="transparent"
        />
      </div>
      <BackgroundBeams className="absolute inset-0 opacity-20" />

      {/* ── Content ──────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10 w-full mt-4 md:mt-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Now in Public Beta
          </span>
        </motion.div>

        {/* Headline with FlipWords */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-extrabold tracking-[-0.04em] leading-[1.05] mb-6 flex flex-col items-center justify-center w-full"
        >
          <span>Upload once,</span>
          <div className="h-[1.2em] w-full min-w-[320px] sm:min-w-[450px] md:min-w-[600px] flex items-center justify-center overflow-visible">
            <FlipWords
              words={["publish everywhere.", "reach everyone.", "grow faster."]}
              duration={3500}
              className="text-muted-foreground whitespace-nowrap"
            />
          </div>
        </motion.h1>

        <div className="mb-10">
          <TypewriterEffect
            words={[
              { text: "Built" },
              { text: "for" },
              { text: "modern" },
              { text: "creators." },
            ]}
            className="text-sm md:text-base font-mono uppercase tracking-[0.3em] text-emerald-500/80 mb-4"
          />
        </div>

        {/* Subtitle with TextGenerateEffect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease }}
        >
          <TextGenerateEffect
            words="AI-powered content engine that transforms your videos into blog posts, social threads, and clips — ready for every platform in seconds."
            className="section-subtitle mx-auto mb-8"
            duration={0.4}
          />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link href="/create">
            <button className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-md bg-foreground px-8 font-medium text-background transition-all hover:opacity-90 active:scale-[0.98]">
              <div className="relative flex items-center gap-2 text-sm tracking-tight">
                Start Creating
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"><path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </div>
            </button>
          </Link>
          <Link href="#how-it-works">
            <button className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-md border border-border bg-transparent px-8 font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98]">
              <div className="relative flex items-center gap-2 text-sm tracking-tight">
                Documentation
              </div>
            </button>
          </Link>
        </motion.div>
      </div>

      {/* ── Hero Visual — Container Scroll Animation ──────────────── */}
      <ContainerScroll
        titleComponent={
          <>
          </>
        }
      >
        <div className="h-full w-full bg-card rounded-2xl border border-border shadow-2xl flex flex-col relative z-20 overflow-hidden">
          {/* Mac-like Window Chrome */}
          <div className="h-10 border-b border-border bg-muted/40 flex items-center px-4 gap-2 backdrop-blur-sm">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            </div>
            <div className="mx-auto flex items-center justify-center bg-background border border-border rounded-md px-32 py-1 flex-1 max-w-sm">
              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
                <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                omnicontent.ai/project/128
              </span>
            </div>
          </div>
          
          {/* Sleek Minimal Dashboard Layout */}
          <div className="flex-1 flex bg-background">
            {/* Sidebar */}
            <div className="w-48 border-r border-border bg-muted/20 p-4 flex flex-col gap-1 hidden md:flex">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Projects</div>
              <div className="px-2 py-1.5 rounded-md bg-foreground/5 text-foreground text-xs font-medium border border-border/50">Mission Control</div>
              <div className="px-2 py-1.5 text-muted-foreground text-xs font-medium">Content Library</div>
              <div className="px-2 py-1.5 text-muted-foreground text-xs font-medium">Analytics</div>
            </div>
            
            {/* Main Area */}
            <div className="flex-1 p-6 md:p-10 flex flex-col gap-6 md:gap-8 overflow-hidden">
              <div className="space-y-1.5">
                <h3 className="font-bold text-xl tracking-tight text-foreground">Active Generation</h3>
                <p className="text-sm text-muted-foreground font-medium">Neural models processing video payload.</p>
              </div>
              
              {/* Data Table Mockup with subtle animation */}
              <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md">
                <div className="grid grid-cols-4 gap-4 px-5 py-4 border-b border-border bg-muted/30 text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                  <div className="col-span-2">Asset Name</div>
                  <div>Status</div>
                  <div className="text-right">Duration</div>
                </div>
                {[
                  { name: "YT_Master_Cut.mp4", status: "Processing", duration: "12:45", progress: 65 },
                  { name: "Short_Clip_1.mp4", status: "Done", duration: "0:58", progress: 100 },
                  { name: "Twitter_Thread.md", status: "Done", duration: "-", progress: 100 }
                ].map((row, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="grid grid-cols-4 gap-4 px-5 py-4 border-b border-border/50 last:border-0 text-sm items-center hover:bg-muted/10 transition-colors"
                  >
                    <div className="col-span-2 font-semibold flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center bg-muted/40 group-hover:bg-background transition-colors">
                        <span className="text-[9px] font-mono font-bold opacity-60">VID</span>
                      </div>
                      <span className="truncate">{row.name}</span>
                    </div>
                    <div>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                        row.status === 'Processing' 
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                      )}>
                        {row.status === 'Processing' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                        {row.status}
                      </span>
                    </div>
                    <div className="text-right text-muted-foreground font-mono text-xs font-medium">{row.duration}</div>
                  </motion.div>
                ))}
              </div>

              {/* Progress Detail for first item */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="p-5 rounded-xl border border-border/60 bg-muted/20 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">Global Neural Progress</span>
                  <span className="text-xs font-mono font-bold text-foreground">78%</span>
                </div>
                <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "78%" }}
                    transition={{ duration: 2, ease: "easeOut", delay: 1.5 }}
                    className="h-full bg-foreground shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </section>
  );
}

"use client";

import * as React from "react";
import { Bot, PenTool, Share2, Video } from "lucide-react";
import { HoverEffect } from "@/components/ui/card-hover-effect";

/**
 * Agents — single signature: HoverEffect (card-hover-effect).
 * Differs visually from pricing's CardSpotlight so the page
 * doesn't repeat itself. Quiet, monochrome cards with a
 * single hover wash.
 */
export function AgentGrid() {
  const agents = [
    {
      title: (
        <span className="inline-flex items-center gap-2.5 mt-0">
          <Video className="h-4 w-4 text-foreground" />
          <span>Video Atomizer</span>
        </span>
      ),
      description:
        "Slices long-form video into platform-perfect clips. Detects hooks, beats, and natural pause points — outputs vertical, square, and widescreen variants in one pass.",
    },
    {
      title: (
        <span className="inline-flex items-center gap-2.5 mt-0">
          <PenTool className="h-4 w-4 text-foreground" />
          <span>Blog Architect</span>
        </span>
      ),
      description:
        "Synthesizes the transcript into an SEO-shaped article with section headings, pull quotes, and an opening hook — in your voice, not generic AI house style.",
    },
    {
      title: (
        <span className="inline-flex items-center gap-2.5 mt-0">
          <Share2 className="h-4 w-4 text-foreground" />
          <span>Social Strategist</span>
        </span>
      ),
      description:
        "Drafts native posts per channel: LinkedIn long-form, X threads, Instagram captions. Adapts pacing and tone — never the same paragraph reposted four ways.",
    },
  ];

  return (
    <section className="section-y">
      <div className="container-page">
        <header className="mb-12 md:mb-14 max-w-2xl">
          <p className="eyebrow mb-3 inline-flex items-center gap-2">
            <Bot className="h-3.5 w-3.5" />
            Autonomous agents
          </p>
          <h2 className="section-title text-balance">
            A team of three.{" "}
            <span className="text-muted-foreground">
              Working in parallel.
            </span>
          </h2>
          <p className="section-lede mt-4 text-balance">
            Each agent is specialized for a single craft. Together, they turn
            one upload into a month&apos;s worth of distribution-ready content.
          </p>
        </header>

        <HoverEffect items={agents} className="!py-2 md:!py-4" />
      </div>
    </section>
  );
}

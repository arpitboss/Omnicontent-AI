"use client";

import * as React from "react";
import {
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  FileText,
} from "lucide-react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

/**
 * Platforms — single signature: InfiniteMovingCards.
 * The horizontal scroll is the literal visualization of
 * "publish everywhere." Logos default monochrome, color
 * on hover via parent group.
 */
export function PlatformsMarquee() {
  const platforms = [
    { name: "LinkedIn",     icon: <Linkedin       className="h-4 w-4" /> },
    { name: "X / Twitter",  icon: <Twitter        className="h-4 w-4" /> },
    { name: "Instagram",    icon: <Instagram      className="h-4 w-4" /> },
    { name: "YouTube",      icon: <Youtube        className="h-4 w-4" /> },
    { name: "Medium",       icon: <FileText       className="h-4 w-4" /> }
  ];

  return (
    <section className="relative border-y border-border bg-secondary/30">
      <div className="container-page py-14">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="h-px w-8 bg-border" />
          <p className="eyebrow text-center m-0">
            Native distribution to every platform that matters
          </p>
          <span className="h-px w-8 bg-border" />
        </div>
        <div className="relative">
          {/* Edge fades so the loop feels infinite, not abruptly clipped */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-12 z-10"
            style={{
              background:
                "linear-gradient(to right, var(--background), transparent)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10"
            style={{
              background:
                "linear-gradient(to left, var(--background), transparent)",
            }}
          />
          <InfiniteMovingCards
            items={platforms}
            direction="right"
            speed="slow"
            className="max-w-full"
          />
        </div>
      </div>
    </section>
  );
}

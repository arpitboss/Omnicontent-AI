"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Timeline } from "@/components/ui/timeline";

/**
 * How it works — single signature: Timeline (the
 * tracing beam wrapped around the section in page.tsx
 * literally visualizes the content pipeline).
 */
export function HowItWorks() {
  const data: { title: string; content: React.ReactNode }[] = [
    {
      title: "01 · Upload",
      content: <Step
        heading="Drop in any video"
        body="Upload a YouTube link or a file — up to 8K, hours long. We extract audio, identify speakers, and build a frame-accurate timeline."
        chips={["mp4", "mov", "wav", "youtube"]}
      />,
    },
    {
      title: "02 · Atomize",
      content: <Step
        heading="Let the agents go to work"
        body="Three specialized agents run in parallel: clips with hooks, an SEO-shaped article, and platform-native posts in your voice."
        chips={["clips", "article", "thread", "captions"]}
      />,
    },
    {
      title: "03 · Publish",
      content: <Step
        heading="Ship to every channel"
        body="Approve, schedule, and push directly to LinkedIn, X, YouTube, and more. Or export and hand off to your CMS."
        chips={["LinkedIn", "X", "YouTube", "Medium"]}
      />,
    },
  ];

  return (
    <section id="how-it-works" className="relative">
      <Timeline
        data={data}
        title="From one upload to a month of content."
        description="A pipeline that respects craft. Every step is reviewable, editable, and yours to ship."
      />
    </section>
  );
}

function Step({
  heading,
  body,
  chips,
}: {
  heading: string;
  body: string;
  chips: string[];
}) {
  return (
    <div>
      <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-foreground mb-3">
        {heading}
      </h3>
      <p className="text-[15px] leading-7 text-muted-foreground max-w-prose">
        {body}
      </p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {chips.map((c, i) => (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-border bg-secondary/40 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            {i === 0 && (
              <span className="h-1 w-1 rounded-full bg-brand" aria-hidden />
            )}
            {c}
          </span>
        ))}
      </div>
      <Link
        href="/create"
        className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-foreground group hover:text-brand transition-colors"
      >
        Try this step
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

"use client";

import * as React from "react";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

/**
 * Testimonials — single signature: AnimatedTestimonials.
 * Copy rewritten to feel specific (concrete results,
 * named roles, real-feeling companies).
 */
export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "We replaced four contractors with OmniContent and shipped twice the content. The transcription is good enough that I stopped checking it.",
      name: "Sarah Jenkins",
      designation: "Head of Content, Northwind Studio",
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
    },
    {
      quote:
        "Our weekly posting cadence went from 6 to 28 across LinkedIn, X, and YouTube — without hiring. The agents pick up our voice better than our junior team did.",
      name: "David Chen",
      designation: "Director of Growth, Acme Cloud",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
    },
    {
      quote:
        "The clip selection actually has taste. It picks the moments I would have picked — the hook lands, the cut is clean, and the captions are accurate the first time.",
      name: "Marcus Johnson",
      designation: "Creator, 312k subscribers",
      src: "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <section className="section-y">
      <div className="container-page">
        <header className="mb-12 md:mb-14 max-w-2xl">
          <p className="eyebrow mb-3">Customers</p>
          <h2 className="section-title text-balance">
            From teams who ship{" "}
            <span className="text-muted-foreground">every week.</span>
          </h2>
          <p className="section-lede mt-4 text-balance">
            Stories from creators, growth teams, and content studios using
            OmniContent in production.
          </p>
        </header>
        <AnimatedTestimonials testimonials={testimonials} />
      </div>
    </section>
  );
}

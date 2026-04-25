"use client";

import { MessageSquare } from "lucide-react";

import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "The transcription accuracy is unmatched. It captures technical jargon perfectly, and the automated blog posts read like they were written by a senior editor.",
      name: "Sarah Jenkins",
      designation: "CTO, TechFlow",
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
    },
    {
      quote: "We reduced our content production time by 60% in the first week. The ability to push directly to social platforms from a single raw video is incredible.",
      name: "David Chen",
      designation: "Head of Growth, ScaleUp",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
    },
    {
      quote: "Finally, an AI tool that actually understands brand voice and nuance. The generated Twitter threads have doubled our weekly engagement metrics.",
      name: "Marcus Johnson",
      designation: "Director of Marketing, Nexus",
      src: "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-transparent">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Testimonials</span>
          </div>
          <h2 className="section-title mb-6">
            Trusted by the{" "}
            <span className="text-muted-foreground/60">world&apos;s best teams.</span>
          </h2>
          <p className="section-subtitle">
            Join thousands of creators who have automated their distribution pipeline with OmniContent.
          </p>
        </div>

        <AnimatedTestimonials testimonials={testimonials} />
      </div>
    </section>
  );
}

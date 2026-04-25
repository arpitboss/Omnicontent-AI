"use client";

import { ArrowRight } from "lucide-react";



import { Timeline } from "@/components/ui/timeline";

export function HowItWorks() {
  const data = [
    {
      title: "01. Upload",
      content: (
        <div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">Upload & Analyze</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Drag and drop your audio or video files. Our AI instantly analyzes speaker patterns, context, and sentiment.
          </p>
          <div className="flex items-center text-sm font-medium text-foreground transition-all duration-500 cursor-pointer gap-1 group">
            <span>Learn more</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      ),
    },
    {
      title: "02. Process",
      content: (
        <div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">AI Processing</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Select your target formats. The engine adapts tone and structure for LinkedIn, Twitter, or Blog posts.
          </p>
          <div className="flex items-center text-sm font-medium text-foreground transition-all duration-500 cursor-pointer gap-1 group">
            <span>Learn more</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      ),
    },
    {
      title: "03. Publish",
      content: (
        <div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">Review & Publish</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Fine-tune the output with precision controls. Export to your CMS or schedule directly.
          </p>
          <div className="flex items-center text-sm font-medium text-foreground transition-all duration-500 cursor-pointer gap-1 group">
            <span>Learn more</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="w-full relative bg-transparent font-sans overflow-hidden">
      <Timeline 
        data={data} 
        title="The OmniContent Pipeline"
        description="See how our neural engine transforms a single video into a month's worth of optimized content."
      />
    </section>
  );
}

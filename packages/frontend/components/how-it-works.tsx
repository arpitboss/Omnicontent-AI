"use client";

import { Upload, Brain, Rocket } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Content",
    description: "Simply drag and drop your audio or video files. We support MP3, MP4, WAV, and many other formats.",
    gradient: "from-chart-1 to-chart-2",
    color: "chart-1"
  },
  {
    icon: Brain,
    title: "AI Processing", 
    description: "Our advanced AI analyzes your content, creates accurate transcriptions, and prepares multiple format options.",
    gradient: "from-chart-2 to-chart-3",
    color: "chart-2"
  },
  {
    icon: Rocket,
    title: "Publish Everywhere",
    description: "Get your content in multiple formats: transcripts, translations, blog posts, social media content, and more.",
    gradient: "from-chart-3 to-chart-4", 
    color: "chart-3"
  }
];

// Tailwind-safe color mapping
const colorStyles: Record<string, string> = {
  "chart-1": "text-chart-1 bg-chart-1",
  "chart-2": "text-chart-2 bg-chart-2",
  "chart-3": "text-chart-3 bg-chart-3",
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-5xl font-bold gradient-text text-shadow-lg">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform your content with AI
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className="text-center space-y-6"
            >
              {/* Icon with Glow + Number */}
              <div className="relative mx-auto w-32 h-32" style={{ perspective: "1000px" }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} rounded-3xl blur-lg opacity-30`} />
                
                <GlassCard className="relative w-full h-full rounded-3xl flex items-center justify-center hover:-translate-y-2 transition-transform duration-500 shadow-xl">
                  <step.icon 
                    className={`w-12 h-12 ${colorStyles[step.color].split(" ")[0]}`} 
                    aria-label={step.title} 
                  />
                </GlassCard>

                <div className={`absolute -top-3 -right-3 w-8 h-8 ${colorStyles[step.color].split(" ")[1]} text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg`}>
                  {index + 1}
                </div>
              </div>

              {/* Title + Description */}
              <h3 className="text-2xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Process Flow */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <GlassCard variant="premium" className="p-12 space-y-8">
            <div className="text-center">
              <h4 className="text-2xl font-semibold text-foreground mb-4">
                From Upload to Publishing in Minutes
              </h4>
              <p className="text-muted-foreground">
                Watch your content transform in real-time
              </p>
            </div>
            
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-muted/20 to-muted/40 rounded-2xl flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-muted-foreground">
                    Interactive Demo Coming Soon
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}

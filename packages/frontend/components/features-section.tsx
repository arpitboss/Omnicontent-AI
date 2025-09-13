"use client";

import { FileText, Languages, Sparkles, Zap, LayoutDashboard, Download, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const features = [
  {
    icon: FileText,
    title: "Smart Transcription",
    description: "Convert audio and video files to accurate text with speaker identification, timestamps, and automatic formatting.",
    badge: "99.5% Accuracy",
    gradient: "from-chart-1 to-chart-2",
    color: "chart-1"
  },
  {
    icon: Languages,
    title: "Multi-Language Translation", 
    description: "Translate your content into 40+ languages with context-aware AI that maintains meaning and tone.",
    badge: "40+ Languages",
    gradient: "from-chart-2 to-chart-3",
    color: "chart-2"
  },
  {
    icon: Sparkles,
    title: "AI Content Generation",
    description: "Generate blog posts, social media content, summaries, and more from your original audio or video.",
    badge: "10+ Formats",
    gradient: "from-chart-3 to-chart-4", 
    color: "chart-3"
  },
  {
    icon: Zap,
    title: "Real-time Processing",
    description: "Stream content generation in real-time, see results as they're created with instant feedback.",
    badge: "Live Processing",
    gradient: "from-chart-4 to-chart-5",
    color: "chart-4"
  },
  {
    icon: LayoutDashboard,
    title: "Unified Dashboard",
    description: "Manage all your content projects in one place with powerful organization and sharing tools.",
    badge: "All-in-One",
    gradient: "from-chart-5 to-primary",
    color: "chart-5"
  },
  {
    icon: Download,
    title: "Flexible Export",
    description: "Export your content in multiple formats: PDF, DOCX, SRT, TXT, and direct social media publishing.",
    badge: "Multiple Formats",
    gradient: "from-primary to-secondary",
    color: "primary"
  }
];

// Tailwind-safe mapping
const badgeStyles: Record<string, string> = {
  "chart-1": "text-chart-1 bg-chart-1/10 border-chart-1/20",
  "chart-2": "text-chart-2 bg-chart-2/10 border-chart-2/20",
  "chart-3": "text-chart-3 bg-chart-3/10 border-chart-3/20",
  "chart-4": "text-chart-4 bg-chart-4/10 border-chart-4/20",
  "chart-5": "text-chart-5 bg-chart-5/10 border-chart-5/20",
  "primary": "text-primary bg-primary/10 border-primary/20",
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="dot-pattern absolute inset-0 opacity-30 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-5xl font-bold gradient-text text-shadow-lg">
            Powerful AI Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, translate, and distribute content at scale
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <GlassCard
                variant="premium"
                className="p-8 card-3d group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                data-testid={`feature-card-${index}`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:gradient-text transition-all duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {feature.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary"
                    className={badgeStyles[feature.color]}
                  >
                    {feature.badge}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

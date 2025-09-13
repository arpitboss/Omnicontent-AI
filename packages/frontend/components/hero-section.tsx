"use client"

import { useState, useEffect } from "react";
import { Play, ArrowRight, Zap, Sparkles, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter(); 

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="dot-pattern absolute inset-0 opacity-50" />
      <div className="hero-glow absolute inset-0" />

      {/* Floating Elements */}
      <div
  aria-hidden="true"
  className="absolute top-24 left-20 w-36 h-36 rounded-2xl transform-gpu bg-gradient-to-br from-white to-gray-100 shadow-xl shadow-gray-300/40 animate-float opacity-90 transition-transform duration-200 hover:-translate-y-1 active:translate-y-1 active:scale-95 dark:bg-gradient-to-br dark:from-[#2a2c2f] dark:to-[#5a5e63] dark:border dark:border-[#bcbfc4]/20 dark:shadow-[0_20px_40px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] dark:before:content-[''] dark:before:absolute dark:before:inset-0 dark:before:rounded-2xl dark:before:pointer-events-none dark:before:bg-gradient-to-t dark:before:from-transparent dark:before:to-white/8"
/>

<div
  aria-hidden="true"
  className="
    absolute top-1/2 right-24 w-28 h-28 rounded-xl transform-gpu
    bg-gradient-to-tr from-white to-gray-50
    shadow-lg shadow-gray-300/30
    animate-float-delayed opacity-85
    transition-transform duration-200
    hover:-translate-y-1 active:translate-y-1 active:scale-95
    dark:bg-gradient-to-tr dark:from-[#2a2c2f] dark:to-[#55585d]
    dark:border dark:border-[#bcbfc4]/20
    dark:shadow-[0_16px_32px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)]
    dark:before:content-[''] dark:before:absolute dark:before:inset-0
    dark:before:rounded-xl dark:before:pointer-events-none
    dark:before:bg-gradient-to-t dark:before:from-transparent dark:before:to-white/8
  "
/>

<div
  aria-hidden="true"
  className="
    absolute bottom-28 left-1/3 w-32 h-32 rounded-2xl transform-gpu
    bg-gradient-to-bl from-white to-gray-100
    shadow-xl shadow-gray-300/40
    animate-float-slow opacity-90
    transition-transform duration-200
    hover:-translate-y-1 active:translate-y-1 active:scale-95
    dark:bg-gradient-to-bl dark:from-[#2a2c2f] dark:to-[#62666b]
    dark:border dark:border-[#bcbfc4]/20
    dark:shadow-[0_18px_36px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)]
    dark:before:content-[''] dark:before:absolute dark:before:inset-0
    dark:before:rounded-2xl dark:before:pointer-events-none
    dark:before:bg-gradient-to-t dark:before:from-transparent dark:before:to-white/8
  "
/>

<div
  aria-hidden="true"
  className="
    absolute top-20 right-1/4 w-20 h-20 rounded-full transform-gpu
    bg-gradient-to-br from-white to-gray-50
    shadow-lg shadow-gray-200/40
    animate-float opacity-80
    transition-transform duration-200
    hover:-translate-y-1 active:translate-y-1 active:scale-95
    dark:bg-gradient-to-br dark:from-[#2a2c2f] dark:to-[#595d62]
    dark:border dark:border-[#bcbfc4]/20
    dark:shadow-[0_14px_28px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)]
    dark:before:content-[''] dark:before:absolute dark:before:inset-0
    dark:before:rounded-full dark:before:pointer-events-none
    dark:before:bg-gradient-to-t dark:before:from-transparent dark:before:to-white/10
  "
/>

      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <div
          className={`space-y-12 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* 🔹 Badge merged (from Home + HeroSection) */}
          <div className="animate-fade-in flex justify-center">
            <Badge
              variant="secondary"
              className="glass-effect px-6 py-2 text-sm font-medium border border-primary/20 flex items-center space-x-2"
              data-testid="hero-badge"
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
              <span>AI-Powered Content Creation</span>
            </Badge>
          </div>

          {/* 🔹 Hero Title (merged wording) */}
          <div
            className="space-y-4 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h1 className="text-6xl md:text-8xl font-bold leading-tight text-shadow-lg">
              <span className="gradient-text block">Upload once,</span>
              <span className="gradient-text block mt-2">
                Endless Content Everywhere
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform any video, audio, or YouTube link into transcripts,
              translations, summaries, articles, social posts, and viral clips —
              all with the power of AI.
            </p>
          </div>

          {/* 🔹 Feature Pills (from Home hero) */}
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            {[
              { icon: Zap, text: "Lightning Fast", color: "from-yellow-500/20 to-orange-500/20" },
              { icon: Target, text: "Precision AI", color: "from-blue-500/20 to-purple-500/20" },
              { icon: Sparkles, text: "Premium Quality", color: "from-purple-500/20 to-pink-500/20" },
            ].map(({ icon: Icon, text, color }) => (
              <div
                key={text}
                className={`inline-flex items-center space-x-2 glass-effect rounded-lg px-4 py-2 bg-gradient-to-r ${color}`}
              >
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{text}</span>
              </div>
            ))}
          </div>

          {/* 🔹 CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-scale-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Button
              onClick={() => router.push("/create")}
              size="lg"
              className="px-8 py-4 premium-button font-semibold shadow-xl hover:shadow-2xl text-lg"
              data-testid="start-creating-button"
            >
              Start Creating Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 glass-effect font-semibold text-lg group hover:scale-105 transition-all duration-300"
              data-testid="watch-demo-button"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>

          {/* 🔹 Stats (kept from original HeroSection) */}
          <div
            className="pt-16 animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center group">
                <div className="text-3xl font-bold gradient-text group-hover:scale-110 transition-transform duration-300">
                  10K+
                </div>
                <div className="text-muted-foreground">Content Creators</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl font-bold gradient-text group-hover:scale-110 transition-transform duration-300">
                  1M+
                </div>
                <div className="text-muted-foreground">Files Processed</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl font-bold gradient-text group-hover:scale-110 transition-transform duration-300">
                  40+
                </div>
                <div className="text-muted-foreground">Languages</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { cn } from "@/lib/utils";
import {
  Cpu,
  Globe,
  Share2,
  Type,
  Zap
} from "lucide-react";
import { motion } from "motion/react";

export function FeaturesSection() {
  const features = [
    {
      title: "Neural Transcription",
      description: "Enterprise-grade speech-to-text with 99.8% accuracy across 40+ languages.",
      header: <NeuralTranscriptionVisual />,
      icon: <Type className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-2",
    },
    {
      title: "Global CDN",
      description: "Edge-cached content delivery ensuring <50ms latency worldwide.",
      header: <GlobalCDNVisual />,
      icon: <Globe className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-1",
    },
    {
      title: "Contextual Intelligence",
      description: "AI that understands nuance, humor, and cultural context for better clips.",
      header: <ContextualIntelligenceVisual />,
      icon: <Cpu className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-1",
    },
    {
      title: "Multi-Platform Distribution",
      description: "One-click publishing to LinkedIn, Twitter, Instagram, and TikTok.",
      header: <MultiPlatformVisual />,
      icon: <Share2 className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-2",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5" />
          <span className="font-bold uppercase tracking-widest text-sm">Core Capabilities</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter max-w-2xl">
          Engineered for <br />
          <span className="text-neutral-400 dark:text-neutral-600">Maximum Velocity.</span>
        </h2>
      </div>
      <BentoGrid className="max-w-7xl mx-auto px-6">
        {features.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            icon={item.icon}
            className={item.className}
          />
        ))}
      </BentoGrid>
    </section>
  );
}

const NeuralTranscriptionVisual = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 relative overflow-hidden group">
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
      <div className="w-full max-w-md space-y-4 relative z-10">
        {[
          { text: "Analyzing audio stream...", width: "60%" },
          { text: "Detecting speakers...", width: "40%" },
          { text: "Generating transcript...", width: "80%" },
        ].map((line, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>{line.text}</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              >
                PROCESSING
              </motion.span>
            </div>
            <div className="h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-black dark:bg-white rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: line.width }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.4,
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GlobalCDNVisual = () => {
  return (
    <div className="w-full h-full relative bg-white dark:bg-black p-6 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full grid grid-cols-8 grid-rows-8">
          {[...Array(64)].map((_, i) => (
            <div key={i} className="border-r border-b border-neutral-400 dark:border-neutral-600" />
          ))}
        </div>
      </div>

      <div className="relative w-32 h-32">
        {/* Central Hub */}
        <div className="absolute inset-0 m-auto w-4 h-4 bg-black dark:bg-white rounded-full z-10 shadow-[0_0_20px_rgba(0,0,0,0.2)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]" />

        {/* Orbiting Data Packets */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 m-auto border border-neutral-200 dark:border-neutral-800 rounded-full"
            style={{ width: `${(i + 1) * 40}%`, height: `${(i + 1) * 40}%` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10 - i * 2, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="w-2 h-2 bg-black dark:bg-white rounded-full absolute -top-1 left-1/2 -translate-x-1/2"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-neutral-400 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        LATENCY: 12ms
      </div>
    </div>
  );
};

const ContextualIntelligenceVisual = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-200/50 via-transparent to-transparent dark:from-neutral-800/50" />

      <div className="space-y-4 w-full max-w-[200px] relative z-10">
        {[
          { label: "SENTIMENT", value: 94, color: "bg-emerald-500" },
          { label: "CONTEXT", value: 87, color: "bg-blue-500" },
          { label: "INTENT", value: 91, color: "bg-purple-500" },
        ].map((item, i) => (
          <div key={i} className="group cursor-default">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-mono text-neutral-500 group-hover:text-black dark:group-hover:text-white transition-colors">{item.label}</span>
              <span className="text-[9px] font-mono text-neutral-700 dark:text-neutral-300">{item.value}%</span>
            </div>
            <div className="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", item.color)}
                initial={{ width: "0%" }}
                whileInView={{ width: `${item.value}%` }}
                transition={{ duration: 1, delay: i * 0.2, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MultiPlatformVisual = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-white dark:bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
      <div className="grid grid-cols-4 gap-4 relative z-10">
        {[
          { color: "bg-[#0A66C2]", icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /> },
          { color: "bg-black dark:bg-white", icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />, fill: "fill-white dark:fill-black" },
          { color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]", icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /> },
          { color: "bg-black dark:bg-white", icon: <path d="M9.37,23.5a7.468,7.468,0,0,1,0-14.936.537.537,0,0,1,.538.5v3.8a.542.542,0,0,1-.5.5,2.671,2.671,0,1,0,2.645,2.669.432.432,0,0,1,0-.05V1a.5.5,0,0,1,.5-.5h3.787a.5.5,0,0,1,.5.5,4.759,4.759,0,0,0,2.945,4.4.5.5,0,0,1,.322.465v3.632a.5.5,0,0,1-.5.5A8.687,8.687,0,0,1,14.958,8.3a.5.5,0,0,0-.958.158v6.962a7.464,7.464,0,0,1-4.63,6.88Z" />, custom: true },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center relative group cursor-pointer shadow-lg hover:shadow-xl transition-all",
              item.color
            )}
          >
            <svg className={cn("w-6 h-6", item.fill || "fill-white")} viewBox="0 0 24 24">
              {item.icon}
              {item.custom && (
                <>
                  <path className="fill-[#25F4EE]" d="M9.37,23.5a7.468,7.468,0,0,1,0-14.936.537.537,0,0,1,.538.5v3.8a.542.542,0,0,1-.5.5,2.671,2.671,0,1,0,2.645,2.669.432.432,0,0,1,0-.05V1a.5.5,0,0,1,.5-.5h3.787a.5.5,0,0,1,.5.5,4.759,4.759,0,0,0,2.945,4.4.5.5,0,0,1,.322.465v3.632a.5.5,0,0,1-.5.5A8.687,8.687,0,0,1,14.958,8.3a.5.5,0,0,0-.958.158v6.962a7.464,7.464,0,0,1-4.63,6.88Z" />
                  <path className="fill-[#FE2C55]" d="M23.5,9.5a.5.5,0,0,1-.5-.5V5.37a.5.5,0,0,1,.5-.5,3.761,3.761,0,0,0,0-7.52.5.5,0,0,1-.5-.5V.5a.5.5,0,0,1,.5-.5,7.5,7.5,0,0,1,0,15Z" />
                  <path className="fill-black dark:fill-white" d="M9.37,23.5a7.468,7.468,0,0,1,0-14.936.537.537,0,0,1,.538.5v3.8a.542.542,0,0,1-.5.5,2.671,2.671,0,1,0,2.645,2.669.432.432,0,0,1,0-.05V1a.5.5,0,0,1,.5-.5h3.787a.5.5,0,0,1,.5.5,4.759,4.759,0,0,0,2.945,4.4.5.5,0,0,1,.322.465v3.632a.5.5,0,0,1-.5.5A8.687,8.687,0,0,1,14.958,8.3a.5.5,0,0,0-.958.158v6.962a7.464,7.464,0,0,1-4.63,6.88Z" />
                </>
              )}
            </svg>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

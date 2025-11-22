"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">

        {/* Left Column: Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center space-x-2 border border-black dark:border-white px-3 py-1 bg-white dark:bg-black">
            <div className="w-2 h-2 bg-green-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest">System Operational</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9]">
            ATOMIZE <br />
            <span className="text-neutral-400 dark:text-neutral-600">CONTENT.</span>
          </h1>

          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-lg leading-relaxed font-light">
            Deploy autonomous neural agents to fragment, reconstruct, and distribute your narrative across the digital substrate.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button className="h-14 px-8 rounded-none bg-black text-white dark:bg-white dark:text-black hover:opacity-90 font-bold uppercase tracking-widest text-sm relative overflow-hidden group cursor-pointer">
              <span className="relative z-10 flex items-center">
                Initialize Protocol <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Button>
            <Button variant="outline" className="h-14 px-8 rounded-none border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 font-bold uppercase tracking-widest text-sm cursor-pointer group">
              <span className="group-hover:scale-105 transition-transform inline-block">
                View Documentation
              </span>
            </Button>
          </div>
        </motion.div>

        {/* Right Column: Abstract UI Representation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-[500px] w-full border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-8"
        >
          {/* Corner Markers */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black dark:border-white" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-black dark:border-white" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-black dark:border-white" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black dark:border-white" />

          {/* Internal UI Elements */}
          <div className="h-full w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-black dark:via-white to-transparent opacity-20" />

            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                <div className="w-3 h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
              </div>
              <div className="font-mono text-xs text-neutral-400">ID: 8X-92</div>
            </div>

            <div className="space-y-4">
              <div className="h-2 w-3/4 bg-neutral-100 dark:bg-neutral-900" />
              <div className="h-2 w-1/2 bg-neutral-100 dark:bg-neutral-900" />
              <div className="h-32 w-full bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center relative">
                <Play className="w-8 h-8 text-neutral-300 dark:text-neutral-700 animate-pulse" />
                {/* Scanning Line */}
                <motion.div
                  className="absolute top-0 left-0 w-full h-0.5 bg-black/10 dark:bg-white/10"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-24 bg-black dark:bg-white" />
                <div className="h-8 w-24 border border-neutral-200 dark:border-neutral-800" />
              </div>
            </div>

            {/* Floating Play Button */}
            <div className="absolute bottom-8 right-8 w-12 h-12 bg-black dark:bg-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
              <Play className="w-4 h-4 text-white dark:text-black fill-current" />
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

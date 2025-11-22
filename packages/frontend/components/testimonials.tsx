"use client";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { motion } from "framer-motion";
import { Check, MessageSquare, Quote, Star } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "The transcription accuracy is unmatched. It captures technical jargon perfectly.",
      author: "Sarah Jenkins",
      role: "CTO, TechFlow",
      header: <TestimonialVisual1 />,
      className: "md:col-span-2",
    },
    {
      quote: "We reduced our content production time by 60% in the first week.",
      author: "David Chen",
      role: "Head of Growth, ScaleUp",
      header: <TestimonialVisual2 />,
      className: "md:col-span-1",
    },
    {
      quote: "The ability to instantly repurpose video into blog posts is a game changer.",
      author: "Elena Rodriguez",
      role: "Content Lead, ViralLoop",
      header: <TestimonialVisual3 />,
      className: "md:col-span-1",
    },
    {
      quote: "Finally, an AI tool that understands brand voice and nuance.",
      author: "Marcus Johnson",
      role: "Director of Marketing, Nexus",
      header: <TestimonialVisual4 />,
      className: "md:col-span-2",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="w-5 h-5" />
          <span className="font-bold uppercase tracking-widest text-sm">User Feedback</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter max-w-2xl">
          Trusted by the <br />
          <span className="text-neutral-400 dark:text-neutral-600">World's Best Teams.</span>
        </h2>
      </div>
      <BentoGrid className="max-w-7xl mx-auto px-6">
        {testimonials.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.author}
            description={item.role}
            header={item.header}
            icon={<Quote className="h-4 w-4 text-neutral-500" />}
            className={item.className}
          >
            <div className="mt-4 text-sm font-light italic text-neutral-600 dark:text-neutral-300 leading-relaxed">
              "{item.quote}"
            </div>
          </BentoGridItem>
        ))}
      </BentoGrid>
    </section>
  );
}

// Testimonial 1 - Star rating with quote marks
const TestimonialVisual1 = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-black relative overflow-hidden group">
      {/* Large quote mark background */}
      <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
        <Quote className="w-32 h-32 text-black dark:text-white" />
      </div>

      {/* Animated stars */}
      <div className="flex gap-2 mb-4 relative z-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.2, rotate: 10 }}
            className="cursor-pointer"
          >
            <Star className="w-5 h-5 text-black dark:text-white fill-current" />
          </motion.div>
        ))}
      </div>

      {/* Rating text */}
      <motion.div
        className="text-xs font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 rounded-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        5.0 / 5.0
      </motion.div>
    </div>
  );
};

// Testimonial 2 - User avatar placeholder
const TestimonialVisual2 = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />

      <motion.div
        className="w-20 h-20 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-full mb-4 relative overflow-hidden shadow-sm flex items-center justify-center z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Initials */}
        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          DC
        </div>

        {/* Verified Badge */}
        <motion.div
          className="absolute bottom-1 right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-black flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <Check className="w-2.5 h-2.5 text-white" />
        </motion.div>
      </motion.div>

      {/* Company indicator */}
      <motion.div
        className="h-1 w-16 bg-neutral-300 dark:bg-neutral-700 rounded-full"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      />
    </div>
  );
};

// Testimonial 3 - Minimal geometric
const TestimonialVisual3 = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-white dark:bg-black relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full grid grid-cols-6 grid-rows-6">
          {[...Array(36)].map((_, i) => (
            <div key={i} className="border-r border-b border-neutral-400 dark:border-neutral-600" />
          ))}
        </div>
      </div>

      {/* Animated square */}
      <motion.div
        className="w-16 h-16 border-2 border-black dark:border-white relative z-10 flex items-center justify-center"
        animate={{ rotate: [0, 90, 180, 270, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800" />

        {/* Orbiting dot */}
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-black dark:bg-white"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
};

// Testimonial 4 - Quote with gradient
const TestimonialVisual4 = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-neutral-900 to-black dark:from-neutral-100 dark:to-neutral-50 text-white dark:text-black relative overflow-hidden group">
      {/* Subtle glow */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-neutral-700 dark:bg-neutral-300 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />

      {/* Large opening quote */}
      <div className="relative z-10 space-y-4">
        <motion.div
          className="text-6xl font-serif leading-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          "
        </motion.div>

        {/* Quote lines */}
        <div className="space-y-2">
          {[100, 85, 60].map((width, i) => (
            <motion.div
              key={i}
              className="h-1 bg-white/20 dark:bg-black/20 rounded-full"
              style={{ width: `${width}%` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

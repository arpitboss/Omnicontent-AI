"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Workflow } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      id: "01",
      title: "Upload & Analyze",
      description: "Drag and drop your audio or video files. Our AI instantly analyzes speaker patterns, context, and sentiment.",
      status: "completed"
    },
    {
      id: "02",
      title: "Contextual Processing",
      description: "Select your target formats. The engine adapts tone and structure for LinkedIn, Twitter, or Blog posts.",
      status: "active"
    },
    {
      id: "03",
      title: "Review & Export",
      description: "Fine-tune the output with precision controls. Export to your CMS or schedule directly.",
      status: "pending"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
          <div>
            <div className="inline-flex items-center space-x-2 mb-4 border border-neutral-200 dark:border-neutral-800 px-3 py-1 bg-white dark:bg-black">
              <Workflow className="w-4 h-4" />
              <span className="font-bold uppercase tracking-widest text-xs">Workflow Automation</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter max-w-xl">
              Your Daily <br />
              <span className="text-neutral-400 dark:text-neutral-600">Command Center.</span>
            </h2>
          </div>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-md">
            Streamline your content operations with a structured, intelligent pipeline designed for scale.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-0 w-full h-px bg-neutral-200 dark:bg-neutral-800 -z-10">
            <motion.div
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-black dark:bg-white"
            />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className="group"
            >
              <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 p-8 h-full hover:border-black dark:hover:border-white transition-colors duration-300 relative">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-5xl font-bold text-neutral-100 dark:text-neutral-900 group-hover:text-neutral-200 dark:group-hover:text-neutral-800 transition-colors">{step.id}</span>
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: index * 0.5 + 0.5, type: "spring" }}
                  >
                    {step.status === 'completed' ? (
                      <div className="w-6 h-6 bg-black dark:bg-white flex items-center justify-center">
                        <Check className="w-4 h-4 text-white dark:text-black" />
                      </div>
                    ) : step.status === 'active' ? (
                      <div className="w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-black dark:bg-white animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-neutral-200 dark:border-neutral-800" />
                    )}
                  </motion.div>
                </div>

                <h3 className="text-xl font-bold mb-4 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">{step.title}</h3>
                <p className="text-neutral-500 leading-relaxed mb-8">
                  {step.description}
                </p>

                <div className="flex items-center text-sm font-bold uppercase tracking-widest group/btn cursor-pointer">
                  <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">View Details</span>
                  <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 delay-75" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

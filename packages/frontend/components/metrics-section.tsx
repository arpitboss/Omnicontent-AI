"use client";

import { motion } from "framer-motion";
import { Activity, TrendingUp, Users, Zap } from "lucide-react";

export function MetricsSection() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Text & Stats */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center space-x-2 border border-neutral-200 dark:border-neutral-800 px-3 py-1 bg-white dark:bg-black">
                            <Activity className="w-4 h-4" />
                            <span className="font-bold uppercase tracking-widest text-xs">Performance Metrics</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                            Data-Driven <br />
                            <span className="text-neutral-400 dark:text-neutral-600">Content Dominance.</span>
                        </h2>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-lg leading-relaxed">
                            Our neural engine doesn't just create content; it optimizes for engagement, retention, and viral potential across every major platform.
                        </p>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 gap-6 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="space-y-2"
                            >
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-neutral-400" />
                                    <div className="text-4xl font-bold font-mono">10x</div>
                                </div>
                                <div className="text-xs font-mono uppercase tracking-widest text-neutral-500">Production Speed</div>
                                <div className="text-xs text-neutral-400 leading-relaxed">Ship content 10x faster than manual workflows</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="space-y-2"
                            >
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-neutral-400" />
                                    <div className="text-4xl font-bold font-mono">300%</div>
                                </div>
                                <div className="text-xs font-mono uppercase tracking-widest text-neutral-500">Engagement Uplift</div>
                                <div className="text-xs text-neutral-400 leading-relaxed">Average increase in audience interaction</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="space-y-2"
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-neutral-400" />
                                    <div className="text-4xl font-bold font-mono">50K+</div>
                                </div>
                                <div className="text-xs font-mono uppercase tracking-widest text-neutral-500">Active Creators</div>
                                <div className="text-xs text-neutral-400 leading-relaxed">Trusted by content professionals globally</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="space-y-2"
                            >
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-neutral-400" />
                                    <div className="text-4xl font-bold font-mono">99.8%</div>
                                </div>
                                <div className="text-xs font-mono uppercase tracking-widest text-neutral-500">Accuracy Rate</div>
                                <div className="text-xs text-neutral-400 leading-relaxed">Industry-leading transcription precision</div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Right Column: Growth Vector Bento */}
                    <div className="relative">
                        <div className="aspect-square border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-8 relative">
                            {/* Corner Markers */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black dark:border-white" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-black dark:border-white" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-black dark:border-white" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black dark:border-white" />

                            {/* Chart Container */}
                            <div className="h-full w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 relative overflow-hidden flex flex-col">
                                {/* Header */}
                                <div className="flex justify-between items-center p-4 border-b border-neutral-100 dark:border-neutral-900">
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Growth Vector</div>
                                    <TrendingUp className="w-4 h-4 text-neutral-400" />
                                </div>

                                {/* Chart Area */}
                                <div className="flex-1 p-6 relative">
                                    {/* Grid background */}
                                    <div className="absolute inset-6 opacity-5">
                                        <div className="w-full h-full grid grid-cols-7 grid-rows-5">
                                            {[...Array(35)].map((_, i) => (
                                                <div key={i} className="border-r border-b border-neutral-400 dark:border-neutral-600" />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bar Chart */}
                                    <div className="h-full flex items-stretch justify-between gap-2 relative z-10">
                                        {[40, 55, 48, 70, 62, 85, 95].map((height, i) => (
                                            <div key={i} className="flex-1 flex flex-col justify-end items-center group">
                                                <motion.div
                                                    className="w-full bg-black dark:bg-white relative cursor-pointer"
                                                    initial={{ height: "0%" }}
                                                    whileInView={{ height: `${height}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{
                                                        duration: 0.8,
                                                        delay: i * 0.1,
                                                        ease: "easeOut",
                                                    }}
                                                    whileHover={{ opacity: 0.7 }}
                                                >
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        <div className="bg-black dark:bg-white text-white dark:text-black px-2 py-1 text-[9px] font-mono whitespace-nowrap">
                                                            {height}%
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex justify-between items-center px-4 py-2 border-t border-neutral-100 dark:border-neutral-900">
                                    <div className="text-[9px] font-mono text-neutral-400">Q1 2024</div>
                                    <div className="text-[9px] font-mono text-neutral-400">Q4 2024</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

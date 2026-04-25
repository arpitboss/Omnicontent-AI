"use client";

import { motion } from "framer-motion";
import { Activity, TrendingUp, Users, Zap } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";

export function MetricsSection() {
    const metrics = [
        { icon: Zap, value: 10, suffix: "x", label: "Production Speed", detail: "Ship content 10x faster than manual workflows", decimals: 0 },
        { icon: TrendingUp, value: 300, suffix: "%", label: "Engagement Uplift", detail: "Average increase in audience interaction", decimals: 0 },
        { icon: Users, value: 50, suffix: "K+", label: "Active Creators", detail: "Trusted by content professionals globally", decimals: 0 },
        { icon: Activity, value: 99.8, suffix: "%", label: "Accuracy Rate", detail: "Industry-leading transcription precision", decimals: 1 },
    ];

    return (
        <section className="relative overflow-hidden bg-transparent">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm">
                            <Activity className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Performance</span>
                        </div>
                        <h2 className="section-title">
                            Data-driven{" "}
                            <span className="text-muted-foreground/60">content dominance.</span>
                        </h2>
                        <p className="section-subtitle">
                            Our neural engine doesn&apos;t just create content — it optimizes for engagement, retention, and viral potential across every platform.
                        </p>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-6 pt-8 border-t border-border/40">
                            {metrics.map((metric, i) => {
                                const Icon = metric.icon;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        className="space-y-2 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-emerald-500/60 group-hover:text-emerald-500 transition-colors" />
                                            <div className="text-3xl font-bold tracking-tight text-foreground">
                                                <NumberTicker value={metric.value} suffix={metric.suffix} decimalPlaces={metric.decimals} delay={0.2} />
                                            </div>
                                        </div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{metric.label}</div>
                                        <div className="text-xs text-muted-foreground/70 leading-relaxed">{metric.detail}</div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column — Chart */}
                    <div className="relative">
                        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-lg">
                            {/* Header */}
                            <div className="flex justify-between items-center p-5 border-b border-border/40">
                                <div className="text-sm font-medium text-muted-foreground">Growth Vector</div>
                                <TrendingUp className="w-4 h-4 text-primary" />
                            </div>

                            {/* Chart Area */}
                            <div className="p-6 relative h-[280px]">
                                {/* Grid background */}
                                <div className="absolute inset-6 opacity-[0.03]">
                                    <div className="w-full h-full grid grid-cols-7 grid-rows-5">
                                        {[...Array(35)].map((_, i) => (
                                            <div key={i} className="border-r border-b border-foreground" />
                                        ))}
                                    </div>
                                </div>

                                {/* Bar Chart */}
                                <div className="h-full flex items-stretch justify-between gap-2 relative z-10">
                                    {[40, 55, 48, 70, 62, 85, 95].map((height, i) => (
                                        <div key={i} className="flex-1 flex flex-col justify-end items-center group">
                                            <motion.div
                                                className="w-full bg-primary/70 rounded-t-md relative cursor-pointer hover:bg-primary transition-colors"
                                                initial={{ height: "0%" }}
                                                whileInView={{ height: `${height}%` }}
                                                viewport={{ once: true }}
                                                transition={{
                                                    duration: 0.8,
                                                    delay: i * 0.08,
                                                    ease: [0.4, 0, 0.2, 1],
                                                }}
                                            >
                                                {/* Tooltip */}
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <div className="bg-foreground text-background px-2 py-1 text-[9px] font-mono whitespace-nowrap rounded-md shadow-md">
                                                        {height}%
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center px-5 py-3 border-t border-border/40 bg-muted/20">
                                <div className="text-[10px] font-mono text-muted-foreground">Q1 2024</div>
                                <div className="text-[10px] font-mono text-muted-foreground">Q4 2024</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

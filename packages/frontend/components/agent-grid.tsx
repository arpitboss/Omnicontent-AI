"use client";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { motion } from "framer-motion";
import {
    Bot,
    PenTool,
    Share2,
    Video
} from "lucide-react";

export function AgentGrid() {
    const agents = [
        {
            title: "Video Atomizer",
            description: "Deconstructs long-form video into viral clips.",
            header: <VideoAtomizerVisual />,
            icon: <Video className="h-4 w-4 text-neutral-500" />,
            className: "md:col-span-1",
        },
        {
            title: "Blog Architect",
            description: "Synthesizes transcripts into SEO-optimized articles.",
            header: <BlogArchitectVisual />,
            icon: <PenTool className="h-4 w-4 text-neutral-500" />,
            className: "md:col-span-1",
        },
        {
            title: "Social Strategist",
            description: "Drafts platform-native posts for LinkedIn & Twitter.",
            header: <SocialStrategistVisual />,
            icon: <Share2 className="h-4 w-4 text-neutral-500" />,
            className: "md:col-span-1",
        },
    ];

    return (
        <section className="py-24 relative overflow-hidden bg-neutral-50 dark:bg-neutral-900/50">
            <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
                <div className="inline-flex items-center space-x-2 mb-4 border border-neutral-200 dark:border-neutral-800 px-3 py-1 bg-white dark:bg-black">
                    <Bot className="w-4 h-4" />
                    <span className="font-bold uppercase tracking-widest text-xs">Neural Agents</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                    Autonomous Content Workforce
                </h2>
            </div>
            <BentoGrid className="max-w-7xl mx-auto px-6">
                {agents.map((item, i) => (
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

const VideoAtomizerVisual = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-white dark:bg-black relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />

            {/* Video timeline representation */}
            <div className="w-full max-w-[200px] space-y-4 relative z-10">
                {/* Main timeline */}
                <div className="h-12 border border-neutral-200 dark:border-neutral-800 relative overflow-hidden rounded-md bg-neutral-50 dark:bg-neutral-900">
                    {/* Waveform simulation */}
                    <div className="absolute inset-0 flex items-center justify-around px-2 opacity-20">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-1 bg-black dark:bg-white rounded-full"
                                animate={{ height: ["20%", "80%", "20%"] }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.05,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>

                    {/* Scanning head */}
                    <motion.div
                        className="absolute inset-y-0 left-0 w-0.5 bg-red-500 z-20"
                        animate={{ left: ["0%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center z-30">
                        <Video className="w-5 h-5 text-neutral-400" />
                    </div>
                </div>

                {/* Clip segments */}
                <div className="flex gap-2 justify-between">
                    {[30, 45, 55].map((width, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2 + 0.5, duration: 0.4 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="h-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black rounded-md relative overflow-hidden cursor-pointer shadow-sm"
                            style={{ width: `${width}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/10 to-transparent -translate-x-full hover:animate-shimmer" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const BlogArchitectVisual = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
            <div className="w-full max-w-[160px] bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 p-4 rounded-lg shadow-sm relative z-10">
                <div className="space-y-2">
                    {/* Header */}
                    <div className="flex gap-2 mb-3">
                        <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center">
                            <PenTool className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className="h-2 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                            <div className="h-2 w-1/2 bg-neutral-100 dark:bg-neutral-900 rounded-full" />
                        </div>
                    </div>

                    {/* Typing lines */}
                    {[100, 90, 95, 85, 60].map((width, i) => (
                        <div key={i} className="h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-neutral-400 dark:bg-neutral-600 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${width}%` }}
                                transition={{
                                    delay: i * 0.15 + 0.5,
                                    duration: 0.5,
                                    ease: "easeOut",
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Floating elements */}
                <motion.div
                    className="absolute -right-2 -top-2 w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-lg"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <div className="w-2 h-2 bg-white dark:bg-black rounded-full" />
                </motion.div>
            </div>
        </div>
    );
};

const SocialStrategistVisual = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-white dark:bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-100/50 via-transparent to-transparent dark:from-neutral-900/50" />

            <div className="grid grid-cols-2 gap-3 w-full max-w-[160px] relative z-10">
                {[
                    { icon: <Share2 className="w-3 h-3" />, delay: 0 },
                    { icon: <div className="w-3 h-3 bg-blue-500 rounded-sm" />, delay: 0.1 },
                    { icon: <div className="w-3 h-3 bg-sky-500 rounded-sm" />, delay: 0.2 },
                    { icon: <div className="w-3 h-3 bg-pink-500 rounded-sm" />, delay: 0.3 },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            delay: item.delay,
                            duration: 0.4,
                        }}
                        whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                        className="aspect-square border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 rounded-xl p-3 flex flex-col justify-between cursor-pointer group hover:shadow-md transition-all"
                    >
                        <div className="flex justify-between items-start">
                            <div className="w-6 h-6 bg-white dark:bg-black rounded-full flex items-center justify-center border border-neutral-100 dark:border-neutral-800">
                                {item.icon}
                            </div>
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="h-1 bg-neutral-200 dark:bg-neutral-800 w-full rounded-full group-hover:bg-neutral-300 dark:group-hover:bg-neutral-700 transition-colors" />
                            <div className="h-1 bg-neutral-200 dark:bg-neutral-800 w-2/3 rounded-full group-hover:bg-neutral-300 dark:group-hover:bg-neutral-700 transition-colors" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

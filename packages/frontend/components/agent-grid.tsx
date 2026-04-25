"use client";


import { motion } from "framer-motion";
import {
    Bot,
    PenTool,
    Share2,
    Video
} from "lucide-react";

import { CardSpotlight } from "@/components/ui/card-spotlight";
import { BackgroundLines } from "@/components/ui/background-lines";

export function AgentGrid() {
    const agents = [
        {
            title: "Video Atomizer",
            description: "Deconstructs long-form video into viral clips.",
            header: <VideoAtomizerVisual />,
            icon: <Video className="h-4 w-4" />,
        },
        {
            title: "Blog Architect",
            description: "Synthesizes transcripts into SEO-optimized articles.",
            header: <BlogArchitectVisual />,
            icon: <PenTool className="h-4 w-4" />,
        },
        {
            title: "Social Strategist",
            description: "Drafts platform-native posts for LinkedIn & Twitter.",
            header: <SocialStrategistVisual />,
            icon: <Share2 className="h-4 w-4" />,
        },
    ];

    return (
        <section className="relative overflow-hidden bg-background">
            <BackgroundLines className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                <></>
            </BackgroundLines>
            <div className="relative z-10">
            <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm">
                    <Bot className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Autonomous Agents
                    </span>
                </div>
                <h2 className="section-title mx-auto mb-6">
                    Meet your new{" "}
                    <span className="text-muted-foreground/60">content team.</span>
                </h2>
                <p className="section-subtitle mx-auto">
                    Three specialized neural agents working in parallel to deconstruct, architect, and strategize your entire brand presence.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-6">
                {agents.map((item, i) => (
                    <CardSpotlight key={i} className="h-full flex flex-col p-6 min-h-[400px]">
                        <div className="flex-1 w-full flex items-center justify-center relative z-20 mb-6">
                            {item.header}
                        </div>
                        <div className="relative z-20 mt-auto">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-background/50 rounded-lg border border-border/50 text-foreground">
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-bold tracking-tight text-white">{item.title}</h3>
                            </div>
                            <p className="text-sm text-neutral-400">
                                {item.description}
                            </p>
                        </div>
                    </CardSpotlight>
                ))}
            </div>
            </div>
        </section>
    );
}

const VideoAtomizerVisual = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-card relative overflow-hidden group">
            <div className="w-full max-w-[200px] space-y-4 relative z-10">
                {/* Main timeline */}
                <div className="h-12 border border-border/60 relative overflow-hidden rounded-lg bg-muted/30">
                    {/* Waveform */}
                    <div className="absolute inset-0 flex items-center justify-around px-2 opacity-20">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-1 bg-foreground rounded-full"
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
                        className="absolute inset-y-0 left-0 w-0.5 bg-primary z-20"
                        animate={{ left: ["0%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center z-30">
                        <Video className="w-5 h-5 text-muted-foreground" />
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
                            className="h-8 border border-border/60 bg-card rounded-lg relative overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
                            style={{ width: `${width}%` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const BlogArchitectVisual = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-muted/30 to-transparent relative overflow-hidden">
            <div className="w-full max-w-[160px] bg-card border border-border/60 p-4 rounded-xl shadow-sm relative z-10">
                <div className="space-y-2">
                    <div className="flex gap-2 mb-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <PenTool className="w-4 h-4 text-primary" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className="h-2 w-3/4 bg-muted rounded-full" />
                            <div className="h-2 w-1/2 bg-muted/50 rounded-full" />
                        </div>
                    </div>

                    {/* Typing lines */}
                    {[100, 90, 95, 85, 60].map((width, i) => (
                        <div key={i} className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-muted-foreground/20 rounded-full"
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

                <motion.div
                    className="absolute -right-2 -top-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                </motion.div>
            </div>
        </div>
    );
};

const SocialStrategistVisual = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-card relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/[0.03] via-transparent to-transparent" />

            <div className="grid grid-cols-2 gap-3 w-full max-w-[160px] relative z-10">
                {[
                    { icon: <Share2 className="w-3 h-3 text-muted-foreground" />, delay: 0 },
                    { icon: <div className="w-3 h-3 bg-blue-500 rounded-sm" />, delay: 0.1 },
                    { icon: <div className="w-3 h-3 bg-sky-500 rounded-sm" />, delay: 0.2 },
                    { icon: <div className="w-3 h-3 bg-pink-500 rounded-sm" />, delay: 0.3 },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: item.delay, duration: 0.4 }}
                        whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                        className="aspect-square border border-border/60 bg-muted/30 rounded-xl p-3 flex flex-col justify-between cursor-pointer group hover:shadow-md hover:border-primary/20 transition-all"
                    >
                        <div className="flex justify-between items-start">
                            <div className="w-6 h-6 bg-card rounded-full flex items-center justify-center border border-border/40">
                                {item.icon}
                            </div>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="h-1 bg-border w-full rounded-full" />
                            <div className="h-1 bg-border w-2/3 rounded-full" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[20rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
    children,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
    children?: React.ReactNode;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                "row-span-1 relative group/bento rounded-xl overflow-hidden flex flex-col",
                "bg-card border border-border/60",
                "transition-all duration-500 ease-out",
                "hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.03]",
                "dark:hover:border-primary/25 dark:hover:shadow-primary/[0.06]",
                className
            )}
        >
            {/* Hover glow — subtle radial gradient on border */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover/bento:opacity-100 transition-opacity duration-700 pointer-events-none z-10 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.02]" />

            {/* Header Section */}
            <div className="relative flex-1 overflow-hidden bg-muted/30">
                <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                    {header}
                </div>
            </div>

            {/* Content Section */}
            <div className="relative z-20 p-5 bg-card border-t border-border/40">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-muted-foreground">{icon}</span>
                    <div className="font-semibold text-card-foreground text-sm tracking-tight">
                        {title}
                    </div>
                </div>
                <div className="font-normal text-muted-foreground text-xs leading-relaxed">
                    {description}
                </div>
                {children}
            </div>
        </motion.div>
    );
};

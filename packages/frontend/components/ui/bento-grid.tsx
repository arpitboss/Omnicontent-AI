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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn(
                "row-span-1 relative group/bento bg-white dark:bg-black border border-transparent flex flex-col overflow-hidden",
                className
            )}
        >
            {/* Dashed Border Effect - INSIDE the container */}
            <div className="absolute inset-[1px] border border-dashed border-neutral-300 dark:border-neutral-700 pointer-events-none z-20" />

            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neutral-400 dark:border-neutral-500 z-30" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neutral-400 dark:border-neutral-500 z-30" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neutral-400 dark:border-neutral-500 z-30" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neutral-400 dark:border-neutral-500 z-30" />

            {/* Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-100/30 dark:via-neutral-800/30 to-transparent opacity-0 group-hover/bento:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

            {/* Header Section - Contained with overflow hidden */}
            <div className="relative flex-1 overflow-hidden bg-neutral-50 dark:bg-neutral-900/50">
                <div className="absolute inset-0 overflow-hidden">
                    {header}
                </div>
            </div>

            {/* Content Section - Properly padded */}
            <div className="relative z-20 p-5 bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800">
                <div className="font-sans font-bold text-neutral-800 dark:text-neutral-200 mb-2 text-sm">
                    {title}
                </div>
                <div className="font-sans font-normal text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed">
                    {description}
                </div>
                {children}
            </div>

            {/* Icon with Microinteraction */}
            <motion.div
                className="absolute top-3 right-3 z-30"
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
            >
                {icon}
            </motion.div>
        </motion.div>
    );
};

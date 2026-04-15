"use client";

import { motion } from "framer-motion";

const ShimmerBlock = ({ className, ...props }: { className?: string } & Record<string, unknown>) => (
    <motion.div
        className={`bg-neutral-200 dark:bg-neutral-800 rounded-sm ${className}`}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        {...props}
    />
);

export const ArticleSkeleton = () => {
    return (
        <div className="max-w-[720px] mx-auto py-16 px-6">
            {/* Hero Image */}
            <ShimmerBlock className="w-full aspect-video mb-12 rounded-md" />

            {/* Title */}
            <div className="space-y-4 mb-8">
                <ShimmerBlock className="h-12 w-3/4" />
                <ShimmerBlock className="h-12 w-1/2" />
            </div>

            {/* Meta */}
            <div className="flex items-center space-x-4 mb-12 border-b border-neutral-100 dark:border-neutral-800 pb-8">
                <ShimmerBlock className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                    <ShimmerBlock className="h-4 w-32" />
                    <ShimmerBlock className="h-3 w-24" />
                </div>
            </div>

            {/* Content Paragraphs */}
            <div className="space-y-8">
                <div className="space-y-3">
                    <ShimmerBlock className="h-5 w-full" />
                    <ShimmerBlock className="h-5 w-full" />
                    <ShimmerBlock className="h-5 w-11/12" />
                    <ShimmerBlock className="h-5 w-full" />
                </div>
                <div className="space-y-3">
                    <ShimmerBlock className="h-5 w-full" />
                    <ShimmerBlock className="h-5 w-10/12" />
                    <ShimmerBlock className="h-5 w-full" />
                </div>
                <ShimmerBlock className="h-64 w-full rounded-md my-10" /> {/* Image placeholder */}
                <div className="space-y-3">
                    <ShimmerBlock className="h-5 w-full" />
                    <ShimmerBlock className="h-5 w-full" />
                    <ShimmerBlock className="h-5 w-3/4" />
                </div>
            </div>
        </div>
    );
};

export const LinkedInSkeleton = () => {
    return (
        <div className="bg-white dark:bg-[#1b1f23] p-4 rounded-sm shadow-sm border border-neutral-300 dark:border-neutral-700 max-w-[555px] mx-auto my-8">
            {/* Header */}
            <div className="flex items-start mb-4">
                <ShimmerBlock className="w-12 h-12 rounded-full mr-3" />
                <div className="flex-1 space-y-2 py-1">
                    <ShimmerBlock className="h-4 w-32" />
                    <ShimmerBlock className="h-3 w-48" />
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-6">
                <ShimmerBlock className="h-4 w-full" />
                <ShimmerBlock className="h-4 w-full" />
                <ShimmerBlock className="h-4 w-11/12" />
                <ShimmerBlock className="h-4 w-full" />
                <ShimmerBlock className="h-4 w-3/4" />
            </div>

            {/* Footer Actions */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 flex justify-between px-2">
                <ShimmerBlock className="h-8 w-16" />
                <ShimmerBlock className="h-8 w-16" />
                <ShimmerBlock className="h-8 w-16" />
                <ShimmerBlock className="h-8 w-16" />
            </div>
        </div>
    );
};

export const TwitterSkeleton = () => {
    return (
        <div className="max-w-[600px] mx-auto py-8 space-y-0">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-3 p-4 border-b border-neutral-100 dark:border-neutral-800">
                    <ShimmerBlock className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-2">
                            <ShimmerBlock className="h-4 w-24" />
                            <ShimmerBlock className="h-4 w-16" />
                        </div>
                        <div className="space-y-2">
                            <ShimmerBlock className="h-4 w-full" />
                            <ShimmerBlock className="h-4 w-11/12" />
                            <ShimmerBlock className="h-4 w-full" />
                        </div>
                        <div className="flex justify-between max-w-[300px] pt-2">
                            <ShimmerBlock className="h-4 w-4 rounded-full" />
                            <ShimmerBlock className="h-4 w-4 rounded-full" />
                            <ShimmerBlock className="h-4 w-4 rounded-full" />
                            <ShimmerBlock className="h-4 w-4 rounded-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

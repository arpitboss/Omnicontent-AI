// packages/frontend/components/typewriter-text.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTypewriter } from '@/hooks/use-typewriter';
import ReactMarkdown, { Options } from 'react-markdown';
import { Maximize2, X, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface TypewriterTextProps {
    text: string;
    id: string;
    components?: Options["components"];
    imageMap?: Record<string, string>;
}

// A simple component for the animated ellipsis
const BlinkingCursor = () => (
    <span className="inline-block w-[2px] h-4 bg-foreground/70 ml-1 animate-pulse align-middle" />
);

// High-fidelity zoomable image renderer for inline generated and standard images
const ArticleImageRenderer = ({ src, alt }: { src: string; alt?: string }) => {
  const isPrompt = src.startsWith("image-prompt://") || src.startsWith("[Image:");

  let searchTerm = "Article Image";
  let cleanedTerm = "abstract";

  if (isPrompt) {
    const rawPrompt = src.startsWith("image-prompt://")
      ? decodeURIComponent(src.replace("image-prompt://", ""))
      : (src.match(/\[Image: (.*?)\]/)?.[1] || "abstract");
      
    searchTerm = rawPrompt;
    cleanedTerm = searchTerm;
    if (cleanedTerm.toLowerCase().startsWith("image:")) {
      cleanedTerm = cleanedTerm.slice(6).trim();
    }
  }

  const [activeKey, setActiveKey] = useState("");
  const [activeModel, setActiveModel] = useState("flux");
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setActiveKey(localStorage.getItem("omnicontent_pollinations_key") || "");
      setActiveModel(localStorage.getItem("omnicontent_pollinations_model") || "flux");
    }
  }, []);

  // Determine final image URL and zoom image URL (unified high-quality URL to prevent regeneration on zoom)
  let imageUrl = src;

  if (isPrompt) {
    const defaultKey = process.env.NEXT_PUBLIC_POLLINATIONS_DEFAULT_KEY || "";
    const defaultReferrer = process.env.NEXT_PUBLIC_POLLINATIONS_REFERRER || "omnicontent-ai.com";
    const keyToUse = activeKey ? activeKey.trim() : defaultKey;

    if (keyToUse) {
      imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(cleanedTerm + " photorealistic, cinematic lighting, 4k, no text, high quality")}?width=1280&height=720&model=${encodeURIComponent(activeModel)}&key=${encodeURIComponent(keyToUse)}&referrer=${encodeURIComponent(defaultReferrer)}`;
    } else {
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanedTerm + " photorealistic, cinematic lighting, 4k, no text, high quality")}?width=1280&height=720&model=${encodeURIComponent(activeModel)}&referrer=${encodeURIComponent(defaultReferrer)}`;
    }
  }

  const zoomImageUrl = imageUrl;

  return (
    <>
      <span 
        className="my-10 flex flex-col items-center group cursor-zoom-in select-none w-full"
        style={{ display: 'flex' }}
        onClick={(e) => {
          e.stopPropagation();
          setIsZoomed(true);
        }}
      >
        <span className="overflow-hidden rounded-xl border border-border/40 bg-muted/10 shadow-sm relative w-full max-w-[720px]" style={{ display: 'block', aspectRatio: '16/9', maxHeight: '400px' }}>
          {/* Subtle Monochrome Loading spinner */}
          {!isLoaded && (
            <span className="absolute inset-0 flex items-center justify-center bg-muted/5 z-10" style={{ display: 'flex' }}>
              <Loader2 className="w-5 h-5 text-foreground/35 animate-spin" />
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt || searchTerm}
            onLoad={() => setIsLoaded(true)}
            className="w-full h-full object-cover hover:scale-101 transition-transform duration-700"
            style={{ display: 'block' }}
          />
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none" style={{ display: 'flex' }}>
            <span className="bg-background/85 dark:bg-neutral-900/85 p-2 rounded-full shadow-md backdrop-blur-sm border border-border/20">
              <Maximize2 className="text-foreground/75 w-3.5 h-3.5" />
            </span>
          </span>
        </span>
        {isPrompt && (
          <span className="text-center text-xs text-muted-foreground/80 mt-3 font-sans max-w-[500px] leading-relaxed italic px-4 select-text" style={{ display: 'block' }}>
            {searchTerm}
          </span>
        )}
      </span>

      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isZoomed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(false);
              }}
              className="fixed inset-0 z-[999] bg-white/95 dark:bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
              style={{ display: 'flex' }}
            >
              <motion.img
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.97, opacity: 0 }}
                src={zoomImageUrl}
                alt={alt || searchTerm}
                className="max-w-full max-h-[85vh] rounded-xl shadow-2xl border border-border/10 object-contain select-none animate-in fade-in duration-300"
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(false);
                }}
                className="absolute top-6 right-6 p-2 bg-muted/40 hover:bg-muted/80 rounded-full transition-colors border border-border/20 text-foreground z-[1000]"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export const TypewriterText = ({ text, id, components, imageMap }: TypewriterTextProps) => {
    // Performant typewriter text stream hook
    const { displayText, isDone } = useTypewriter(id, text);

    // Pre-process display text to convert inline placeholders into valid markdown image tags.
    // IMPORTANT: Ensure [Image: ...] tags are on their own line so ReactMarkdown treats
    // them as block-level images (not wrapped in <p> tags).
    const processedText = displayText
        .replace(/\[Image: ([\s\S]*?)\]/gi, (match, p1) => {
            const cleanPrompt = p1.trim().replace(/[\r\n]+/g, ' ');
            return `\n\n![Image: ${cleanPrompt}](image-prompt://${encodeURIComponent(cleanPrompt)})\n\n`;
        })
        .replace(/\[UploadedImage: (dev_img_[\s\S]*?)\]/gi, (match, p1) => {
            return `\n\n![Uploaded Image](${p1.trim()})\n\n`;
        })
        // Clean up excessive blank lines from replacements
        .replace(/\n{3,}/g, '\n\n');

    // Custom img component with proper rendering for all image types
    const imgComponent = ({ src, alt, ...props }: any) => {
        // Guard: empty or whitespace-only src
        if (!src || !src.trim()) return null;

        let finalSrc = src;

        // 1. Check imageMap for virtualized uploaded images (dev_img_xxx tokens)
        if (imageMap && src && imageMap[src]) {
            finalSrc = imageMap[src];
        }

        // Final guard after imageMap lookup
        if (!finalSrc || !finalSrc.trim()) return null;

        // Render all article images using our high-fidelity zoomable Portal renderer!
        return <ArticleImageRenderer src={finalSrc} alt={alt || "Article Asset"} />;
    };

    // Merge custom img handler with parent components, keeping img handler priority
    const mergedComponents = {
        ...components,
        img: imgComponent,
    };

    const showCursor = !isDone;

    // Custom URL transform: react-markdown v10+ sanitizes URLs by default,
    // stripping non-standard protocols. We must preserve our custom protocols
    // (image-prompt://) and token keys (dev_img_*) for proper image rendering.
    const safeUrlTransform = (url: string) => {
        if (url.startsWith('image-prompt://')) return url;
        if (url.startsWith('dev_img_')) return url;
        if (url.startsWith('data:')) return url;
        // For standard URLs, return as-is (http, https, etc.)
        return url;
    };

    return (
        <span className="inline-block min-h-[1em] w-full select-text">
            <ReactMarkdown components={mergedComponents} urlTransform={safeUrlTransform}>
                {processedText}
            </ReactMarkdown>
            {showCursor && <BlinkingCursor />}
        </span>
    );
};
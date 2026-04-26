"use client";

import { useEffect, useRef, useState } from "react";

interface WordEvent {
  word: string;
  start: number;
  end: number;
}

interface ClipPreviewProps {
  src: string;
  wordEvents?: WordEvent[];
  /** Absolute video timestamp where the clip starts. Word events are absolute. */
  clipStart: number;
}

/**
 * Lightweight clip preview with live caption overlay.
 *
 * The trimmed clip on s3 has no burned-in captions (those are only added
 * during the reformat/download step), so we render the active words from
 * `wordEvents` on top of the video element using `requestAnimationFrame`.
 */
export const ClipPreview = ({ src, wordEvents, clipStart }: ClipPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const [activeText, setActiveText] = useState<{
    line: { word: string; isActive: boolean }[];
  } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !wordEvents || wordEvents.length === 0) return;

    const tick = () => {
      const abs = video.currentTime + clipStart;

      // Find the word currently being spoken
      const activeIdx = wordEvents.findIndex(
        (w) => abs >= w.start && abs <= w.end
      );

      if (activeIdx === -1) {
        setActiveText(null);
      } else {
        // Show a small window of words around the active one (5 before, 5 after)
        const start = Math.max(0, activeIdx - 5);
        const end = Math.min(wordEvents.length, activeIdx + 6);
        const line = wordEvents.slice(start, end).map((w, i) => ({
          word: w.word,
          isActive: start + i === activeIdx,
        }));
        setActiveText({ line });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const onPlay = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const onPause = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", tick);
    video.addEventListener("loadedmetadata", tick);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", tick);
      video.removeEventListener("loadedmetadata", tick);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [wordEvents, clipStart]);

  return (
    <div 
      className="relative w-full h-full group/video cursor-pointer"
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
         <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium tracking-wide">
            Previewing
         </div>
      </div>

      {activeText && (
        <div
          className="pointer-events-none absolute left-2 right-2 bottom-12 flex justify-center px-2"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.85)" }}
        >
          <p className="max-w-[92%] text-center text-white text-[13px] md:text-[14px] font-semibold leading-tight tracking-tight">
            {activeText.line.map((w, i) => (
              <span
                key={i}
                className={
                  w.isActive
                    ? "text-[var(--accent-500)] mx-[2px]"
                    : "text-white/85 mx-[2px]"
                }
              >
                {w.word}
              </span>
            ))}
          </p>
        </div>
      )}
      {(!wordEvents || wordEvents.length === 0) && (
        <div className="pointer-events-none absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/55 text-white/80 text-[10px] backdrop-blur-sm">
          No captions available
        </div>
      )}
    </div>
  );
};

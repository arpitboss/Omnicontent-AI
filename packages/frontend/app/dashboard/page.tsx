"use client";

import { useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import useSWR from "swr";

import { CopyButton } from '@/components/copy-button';
import { ClipPreview } from '@/components/clip-preview';
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PublishHub } from "@/components/publish-hub";
import { ArticleSkeleton, LinkedInSkeleton, TwitterSkeleton } from "@/components/skeletons";
import { TranscriptDisplay } from "@/components/transcript-display";
import { TypewriterText } from "@/components/typewriter-text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TypewriterProvider, useTypewriterManager } from "@/context/typewriter-context";
import {
  Activity,
  AlertCircle,
  ArrowUp,
  BadgeCheck,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Heart,
  Languages,
  Layers,
  Maximize2,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Repeat,
  Send,
  Share,
  ThumbsUp,
  Trash2,
  X,
  XCircle,
  Zap
} from "lucide-react";

// ---------------- Interfaces ----------------
interface WordEvent {
  word: string;
  start: number;
  end: number;
}

interface ReformattedClip {
  _id: string;
  aspectRatio: string;
  status: "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";
  url?: string;
}

interface TranscriptSegment {
  timestamp: string;
  text: string;
}

interface Clip {
  _id: string;
  title: string;
  summary: string;
  s3Url: string;
  wordEvents: WordEvent[];
  status: "PENDING" | "READY" | "FAILED";
  startTime: number;
  endTime: number;
}

interface Content {
  _id: string;
  userId: string;
  sourceUrl: string;
  status:
  | "PENDING"
  | "GENERATING_TEXT"
  | "GENERATING_VIDEOS"
  | "COMPLETE"
  | "FAILED";
  generatedTitle?: string;
  summary?: string;
  generatedContent?: string;
  transcript: TranscriptSegment[];
  linkedinPost?: string;
  twitterThread: string[];
  localSourcePath?: string;
  clips: Clip[];
  reformattedClips: ReformattedClip[];
  errorMessage?: string;
  publishHistory?: { platform: string; publishedAt: string; postUrl: string; status: 'SUCCESS' | 'FAILED'; }[];
  createdAt: string;
}

interface TranslationData {
  summary?: string;
  blog?: string;
  linkedin?: string;
  twitter?: string[];
  transcript?: string;
  language?: string;
}

// ---------------- Utils ----------------
const fetcher = async (url: string, getToken: () => Promise<string | null>) => {
  const token = await getToken();
  if (!token) {
    throw new Error("Not signed in (Clerk did not return a token).");
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch { /* ignore */ }
    // Surface the real status so we can debug auth/CORS issues
    // (e.g. 401 = Clerk token rejected by backend → key mismatch)
    console.error(`[dashboard] GET ${url} → ${res.status}`, body);
    throw new Error(`Backend responded ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }
  return res.json();
};

// --- Stale job detection ---
const STALE_JOB_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

function isStaleJob(content: Content): boolean {
  if (!['PENDING', 'GENERATING_TEXT', 'GENERATING_VIDEOS'].includes(content.status)) return false;
  const createdAt = new Date(content.createdAt).getTime();
  return Date.now() - createdAt > STALE_JOB_THRESHOLD_MS;
}

function formatTimeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ---------------- Components ----------------

const BlogImageRenderer = ({ src }: { src: string }) => {
  const match = src.match(/\[Image: (.*?)\]/);
  const searchTerm = match ? match[1] : "abstract";
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(searchTerm + " photorealistic, cinematic lighting, 4k, no text, high quality")}?width=800&height=450&nologo=true`;
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <figure className="my-14 group cursor-zoom-in" onClick={() => setIsZoomed(true)}>
        <div className="overflow-hidden rounded-md shadow-sm relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={searchTerm}
            className="w-full h-auto hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Maximize2 className="text-white w-8 h-8 drop-shadow-md" />
          </div>
        </div>
        <figcaption className="text-center text-sm text-neutral-500 mt-4 font-sans">
          {searchTerm}
        </figcaption>
      </figure>

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
            className="fixed inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={imageUrl}
              alt={searchTerm}
              className="max-w-full max-h-[90vh] rounded-md shadow-2xl"
            />
            <button className="absolute top-4 right-4 p-2 bg-black/10 dark:bg-white/10 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
              <X className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ---------------- Animation Components ----------------

const ScrollReveal = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// ------------- ContentDisplayCard ---------------
const ContentDisplayCard = ({
  content,
  onDownload,
  onTranslateOpen,
  onExport,
  translationCache,
  showTranslation,
  setShowTranslation,
  onPublished,
}: {
  content: Content;
  onDownload: (contentId: string, clip: Clip, aspectRatio: string) => void;
  onTranslateOpen: (contentId: string) => void;
  onExport: () => void;
  translationCache: { [key: string]: TranslationData };
  showTranslation: boolean;
  setShowTranslation: (val: boolean) => void;
  onPublished?: () => void;
}) => {
  const { startAnimation, showImmediately } = useTypewriterManager();
  const currentTranslation = translationCache[content._id];

  useEffect(() => {
    if (content && content.status !== 'PENDING' && content.status !== 'GENERATING_TEXT') {
      const hasPlayed = sessionStorage.getItem(`typewriter_played_${content._id}`);

      const animateOrShow = (id: string, text: string) => {
        if (hasPlayed) {
          showImmediately(id, text);
        } else {
          startAnimation(id, text);
        }
      };

      animateOrShow(`${content._id}-summary-${showTranslation ? 'translated' : 'original'}`, showTranslation && currentTranslation?.summary ? currentTranslation.summary : content.summary || "");
      animateOrShow(`${content._id}-article-${showTranslation ? 'translated' : 'original'}`, showTranslation && currentTranslation?.blog ? currentTranslation.blog : content.generatedContent || "");
      animateOrShow(`${content._id}-linkedin-${showTranslation ? 'translated' : 'original'}`, showTranslation && currentTranslation?.linkedin ? currentTranslation.linkedin : content.linkedinPost || "");

      content.twitterThread?.forEach((tweet, index) => {
        animateOrShow(`${content._id}-tweet-${index}-${showTranslation ? 'translated' : 'original'}`, showTranslation && currentTranslation?.twitter?.[index] ? currentTranslation.twitter[index] : tweet);
      });

      if (!hasPlayed) {
        sessionStorage.setItem(`typewriter_played_${content._id}`, 'true');
      }
    }
  }, [content, startAnimation, showImmediately, showTranslation, currentTranslation]);

  let sourceLabel = content.sourceUrl;
  try {
    sourceLabel = new URL(content.sourceUrl).hostname.replace(/^www\./, '');
  } catch { /* fall back to raw URL */ }

  return (
    <div className="relative border border-border bg-card rounded-2xl p-5 transition-colors duration-200 hover:border-foreground/20">

      {/* ---- Header ---- */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-5 border-b border-border pb-4">
        <div className="min-w-0">
          <div className="mb-3">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${content.status === 'COMPLETE'
                ? 'border-[var(--accent-500)]/30 text-[var(--accent-500)] bg-[var(--accent-500)]/10'
                : content.status === 'FAILED'
                  ? 'border-red-500/30 text-red-500 bg-red-500/10'
                  : 'border-amber-500/30 text-amber-500 bg-amber-500/10'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${content.status === 'COMPLETE' ? 'bg-[var(--accent-500)]' : content.status === 'FAILED' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
              {content.status === 'COMPLETE' ? 'Ready' : content.status === 'FAILED' ? 'Failed' : 'Processing'}
            </span>
          </div>
          <h3 className="text-2xl font-semibold tracking-tight mb-3 text-foreground">
            {content.generatedTitle || "Untitled project"}
          </h3>
          <a
            href={content.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/40 hover:bg-muted hover:border-foreground/20 transition-colors text-xs text-muted-foreground hover:text-foreground max-w-full"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{sourceLabel}</span>
          </a>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-border hover:border-foreground/30 hover:bg-accent text-xs h-9"
            onClick={onExport}
          >
            <Download className="mr-2 h-3.5 w-3.5" /> Export
          </Button>

          {currentTranslation && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-border hover:border-foreground/30 hover:bg-accent text-xs h-9"
              onClick={() => setShowTranslation(!showTranslation)}
            >
              {showTranslation ? "Original" : "Translation"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-border hover:border-foreground/30 hover:bg-accent text-xs h-9"
            onClick={() => onTranslateOpen(content._id)}
          >
            <Languages className="mr-2 h-3.5 w-3.5" />
            {currentTranslation ? "Change" : "Translate"}
          </Button>

          {content.status === 'COMPLETE' && (
            <PublishHub content={content} onPublished={onPublished} />
          )}
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Left Column ---- */}
        < div className="lg:col-span-1 space-y-4" >
          <h4 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Source video</h4>
          <div className="aspect-video overflow-hidden border border-border rounded-xl bg-black relative">
            <ReactPlayer
              src={`${content.sourceUrl}`}
              width="100%"
              height="100%"
              controls
            />
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Summary</h4>
              <CopyButton textToCopy={content.summary || ''} />
            </div>
            <div className="text-sm leading-relaxed text-foreground/80">
              <TypewriterText
                id={`${content._id}-summary-${showTranslation ? 'translated' : 'original'}`}
                text={
                  showTranslation && currentTranslation?.summary
                    ? currentTranslation.summary
                    : content.summary || ""
                }
              />
            </div>
          </div>
        </div >

        {/* ---- Right Column ---- */}
        < div className="lg:col-span-2" >
          <Tabs defaultValue="article" className="w-full">
            <TabsList className="w-full grid grid-cols-4 rounded-none border-b border-border bg-transparent p-0 mb-4">
              {[
                { value: 'article', label: 'Article' },
                { value: 'social', label: 'Social' },
                { value: 'clips', label: 'Clips' },
                { value: 'transcript', label: 'Transcript' },
              ].map(t => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--accent-500)] data-[state=active]:text-foreground h-11 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:shadow-none bg-transparent !bg-transparent !shadow-none !border-t-0 !border-l-0 !border-r-0"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* --- Article Tab --- */}
            <TabsContent
              value="article"
              className="mt-0 bg-card border border-border rounded-xl p-0 min-h-[600px]"
            >
              {content.status === 'GENERATING_TEXT' || content.status === 'PENDING' ? (
                <ArticleSkeleton />
              ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-[720px] mx-auto py-10 px-6"
                  >
                    {/* Hero Image */}
                    <div className="mb-8 relative aspect-video w-full overflow-hidden rounded-md shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://image.pollinations.ai/prompt/${encodeURIComponent((content.generatedTitle || "abstract") + " cinematic, photorealistic, 4k, dramatic lighting, no text")}?width=1280&height=720&nologo=true`}
                        alt="Article Hero"
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                      />
                    </div>

                    {/* Title Area */}
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6 mt-8 font-sans leading-tight">
                      {content.generatedTitle || "Untitled draft"}
                    </h1>

                    {/* Author/Meta */}
                    <div className="flex items-center space-x-4 mb-8 border-b border-border pb-6">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent-500)]/15 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-[var(--accent-500)]" />
                      </div>
                      <div>
                        <div className="font-sans font-medium text-foreground">OmniContent AI</div>
                        <div className="font-sans text-sm text-muted-foreground">
                          {new Date(content.createdAt).toLocaleDateString()} · 5 min read
                        </div>
                      </div>
                      <div className="ml-auto flex space-x-2">
                        <CopyButton textToCopy={content.generatedContent || ''} />
                      </div>
                    </div>

                    {/* Content */}
                    <article className="prose prose-lg prose-neutral dark:prose-invert max-w-none [&>p:first-of-type]:first-letter:text-7xl [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:text-neutral-900 [&>p:first-of-type]:first-letter:dark:text-neutral-100 [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:leading-[0.8]">
                      <TypewriterText
                        id={`${content._id}-article-${showTranslation ? 'translated' : 'original'}`}
                        components={{
                          p: ({ ...props }) => {
                            const children = (props as { children?: { type: string, value: string }[] }).children;
                            const text =
                              children?.[0]?.type === "text"
                                ? children[0].value
                                : "";
                            if (text.startsWith("[Image:")) {
                              return <BlogImageRenderer src={text} />;
                            }
                            // Medium style paragraph: Serif, large, relaxed, proper spacing
                            return (
                              <ScrollReveal>
                                <p {...props} className="font-serif text-[19px] leading-[30px] text-[#242424] dark:text-[#e5e5e5] mb-6" style={{ fontFamily: 'charter, Georgia, Cambria, "Times New Roman", Times, serif' }} />
                              </ScrollReveal>
                            );
                          },
                          h1: ({ ...props }) => (
                            <ScrollReveal>
                              <h1 {...props} className="font-sans font-bold text-2xl md:text-3xl mb-5 mt-10 text-foreground tracking-tight leading-tight" />
                            </ScrollReveal>
                          ),
                          h2: ({ ...props }) => (
                            <ScrollReveal>
                              <h2 {...props} className="font-sans font-bold text-xl md:text-2xl mb-4 mt-9 text-foreground tracking-tight leading-tight" />
                            </ScrollReveal>
                          ),
                          h3: ({ ...props }) => (
                            <ScrollReveal>
                              <h3 {...props} className="font-sans font-bold text-lg md:text-xl mb-3 mt-7 text-foreground tracking-tight leading-tight" />
                            </ScrollReveal>
                          ),
                          blockquote: ({ ...props }) => (
                            <ScrollReveal>
                              <blockquote {...props} className="border-l-[3px] border-foreground pl-5 italic text-[20px] leading-relaxed text-foreground/80 my-8 font-serif" style={{ fontFamily: 'charter, Georgia, Cambria, "Times New Roman", Times, serif' }} />
                            </ScrollReveal>
                          ),
                          ul: ({ ...props }) => (
                            <ScrollReveal>
                              <ul {...props} className="list-disc pl-6 mb-6 space-y-2 font-serif text-[19px] leading-[30px] text-foreground/85" />
                            </ScrollReveal>
                          ),
                          ol: ({ ...props }) => (
                            <ScrollReveal>
                              <ol {...props} className="list-decimal pl-6 mb-6 space-y-2 font-serif text-[19px] leading-[30px] text-foreground/85" />
                            </ScrollReveal>
                          ),
                          li: ({ ...props }) => <li {...props} className="pl-1" />,
                        }}
                        text={
                          showTranslation && currentTranslation?.blog
                            ? currentTranslation.blog
                            : content.generatedContent || ""
                        }
                      />
                    </article>
                  </motion.div>
              )}
            </TabsContent>

            {/* --- Social Tab --- */}
            <TabsContent value="social" className="mt-0">
              <Tabs defaultValue="linkedin" className="w-full">
                <TabsList className="flex w-full justify-center space-x-6 border-b border-border bg-transparent p-0 mb-6">
                  <TabsTrigger
                    value="linkedin"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--accent-500)] data-[state=active]:text-foreground h-10 px-4 font-medium text-sm text-muted-foreground hover:text-foreground transition-colors data-[state=active]:shadow-none bg-transparent !bg-transparent !shadow-none !border-t-0 !border-l-0 !border-r-0"
                  >
                    LinkedIn
                  </TabsTrigger>
                  <TabsTrigger
                    value="twitter"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--accent-500)] data-[state=active]:text-foreground h-10 px-4 font-medium text-sm text-muted-foreground hover:text-foreground transition-colors data-[state=active]:shadow-none bg-transparent !bg-transparent !shadow-none !border-t-0 !border-l-0 !border-r-0"
                  >
                    X / Twitter
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="linkedin"
                  className="p-0 bg-muted/30 border border-border rounded-xl"
                >
                  {content.status === 'GENERATING_TEXT' || content.status === 'PENDING' ? (
                    <LinkedInSkeleton />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="bg-card p-4 rounded-xl shadow-sm border border-border max-w-[555px] mx-auto my-8"
                    >
                      {/* Header */}
                      <div className="flex items-start mb-3">
                        <div className="w-12 h-12 rounded-full bg-muted mr-3 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-[var(--accent-500)] to-[var(--accent-700)] flex items-center justify-center text-white font-semibold text-lg">OA</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-sm text-foreground leading-tight hover:text-[var(--accent-500)] hover:underline cursor-pointer">OmniAgent AI</h3>
                              <p className="text-xs text-muted-foreground leading-tight">Autonomous Content Architect</p>
                              <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                <span>1h • 🌐</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreHorizontal className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans mb-4">
                        <TypewriterText
                          id={`${content._id}-linkedin-${showTranslation ? 'translated' : 'original'}`}
                          text={
                            showTranslation && currentTranslation?.linkedin
                              ? currentTranslation.linkedin
                              : content.linkedinPost || ""
                          }
                        />
                      </div>

                      {/* Copy Action (Custom) */}
                      <div className="mb-4">
                        <CopyButton textToCopy={content.linkedinPost || ''} />
                      </div>

                      {/* Footer Actions (Visual Only) */}
                      <div className="border-t border-border pt-1 flex justify-between items-center px-2">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center space-x-2 text-muted-foreground hover:bg-accent px-4 py-3 rounded cursor-pointer transition-colors flex-1 justify-center">
                          <ThumbsUp className="w-5 h-5" />
                          <span className="text-sm font-semibold">Like</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center space-x-2 text-muted-foreground hover:bg-accent px-4 py-3 rounded cursor-pointer transition-colors flex-1 justify-center">
                          <MessageSquare className="w-5 h-5" />
                          <span className="text-sm font-semibold">Comment</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center space-x-2 text-muted-foreground hover:bg-accent px-4 py-3 rounded cursor-pointer transition-colors flex-1 justify-center">
                          <Repeat className="w-5 h-5" />
                          <span className="text-sm font-semibold">Repost</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center space-x-2 text-muted-foreground hover:bg-accent px-4 py-3 rounded cursor-pointer transition-colors flex-1 justify-center">
                          <Send className="w-5 h-5" />
                          <span className="text-sm font-semibold">Send</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="twitter" className="space-y-0 max-w-[600px] mx-auto py-8">
                  {content.status === 'GENERATING_TEXT' || content.status === 'PENDING' ? (
                    <TwitterSkeleton />
                  ) : (
                    <>
                      <div className="flex justify-end mb-4 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-md border-border text-xs h-9 hover:bg-accent"
                          onClick={() => {
                            navigator.clipboard.writeText(content.twitterThread?.join('\n\n') || '');
                            toast.success("Thread copied to clipboard");
                          }}
                        >
                          Copy full thread
                        </Button>
                      </div>

                      {content.twitterThread?.map((tweet: string, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="relative pl-4 pb-0 group"
                        >
                          {/* Connecting Line */}
                          {index !== (content.twitterThread.length - 1) && (
                            <div className="absolute left-[34px] top-[50px] bottom-0 w-[2px] bg-border group-hover:bg-foreground/20 transition-colors" />
                          )}

                          <div className="flex items-start space-x-3 p-4 hover:bg-accent/40 transition-colors rounded-xl">
                            <div className="relative z-10">
                              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background font-bold border-2 border-background">
                                OA
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-1">
                                  <span className="font-bold text-foreground text-[15px]">OmniAgent</span>
                                  <BadgeCheck className="w-4 h-4 fill-blue-500 text-background" />
                                  <span className="text-muted-foreground text-[15px] ml-1">@omni_ai</span>
                                  <span className="text-muted-foreground text-[15px]">·</span>
                                  <span className="text-muted-foreground text-[15px] hover:underline cursor-pointer">{index + 1}m</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CopyButton textToCopy={tweet.replace(/^\d+\/\s*/, '')} />
                                </div>
                              </div>

                              <div className="text-foreground leading-normal text-[15px] whitespace-pre-wrap font-sans">
                                <TypewriterText
                                  id={`${content._id}-tweet-${index}-${showTranslation ? 'translated' : 'original'}`}
                                  text={
                                    showTranslation &&
                                      currentTranslation?.twitter?.[index]
                                      ? currentTranslation.twitter[index]
                                      : tweet.replace(/^\d+\/\s*/, '')
                                  }
                                />
                              </div>

                              {/* Tweet Actions (Visual) */}
                              <div className="flex justify-between max-w-[425px] mt-3 text-muted-foreground">
                                <motion.button
                                  whileHover={{ scale: 1.1, color: "#3b82f6" }}
                                  whileTap={{ scale: 0.9 }}
                                  className="flex items-center space-x-2 group/action cursor-pointer transition-colors"
                                >
                                  <div className="p-2 rounded-full group-hover/action:bg-blue-500/10 transition-colors">
                                    <MessageCircle className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs">24</span>
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1, color: "#22c55e" }}
                                  whileTap={{ scale: 0.9, rotate: 15 }}
                                  className="flex items-center space-x-2 group/action cursor-pointer transition-colors"
                                >
                                  <div className="p-2 rounded-full group-hover/action:bg-green-500/10 transition-colors">
                                    <Repeat className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs">12</span>
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1, color: "#ec4899" }}
                                  whileTap={{ scale: 0.8, rotate: -15 }}
                                  onClick={(e) => {
                                    const target = e.currentTarget;
                                    target.style.color = "#ec4899";
                                    target.querySelector('svg')?.setAttribute('fill', 'currentColor');
                                  }}
                                  className="flex items-center space-x-2 group/action cursor-pointer transition-colors"
                                >
                                  <div className="p-2 rounded-full group-hover/action:bg-pink-500/10 transition-colors">
                                    <Heart className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs">148</span>
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1, color: "#3b82f6" }}
                                  whileTap={{ scale: 0.9 }}
                                  className="flex items-center space-x-2 group/action cursor-pointer transition-colors"
                                >
                                  <div className="p-2 rounded-full group-hover/action:bg-blue-500/10 transition-colors">
                                    <Share className="w-4 h-4" />
                                  </div>
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* --- Clips Tab --- */}
            <TabsContent
              value="clips"
              className="mt-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4 border border-border rounded-xl bg-muted/30"
            >
              {(!content.clips || content.clips.length === 0) && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 border border-dashed border-border rounded-full flex items-center justify-center mb-4">
                    <Layers className="w-5 h-5 opacity-60" />
                  </div>
                  <p className="text-sm">No clips yet</p>
                </div>
              )}

              {content.clips?.filter(c => (c.status === 'READY' && c.s3Url) || c.status === 'PENDING').map((clip) => {
                const reformats = content.reformattedClips || [];
                const getDownloadUrl = (aspectRatio: string) => {
                  const completedJob = reformats
                    .filter(
                      (r) => r.aspectRatio === aspectRatio && r.status === "COMPLETE"
                    )
                    .pop();
                  return completedJob?.url;
                };

                const isJobRunning = (aspectRatio: string) =>
                  reformats.some(
                    (r) =>
                      r.aspectRatio === aspectRatio &&
                      ["PENDING", "PROCESSING"].includes(r.status)
                  );

                if (clip.status === "READY") {
                  return (
                    <div
                      key={clip._id}
                      className="group relative bg-black border border-border rounded-xl overflow-hidden transition-colors duration-200 hover:border-foreground/20"
                    >
                      <div className="relative aspect-[9/16] bg-black">
                        <ClipPreview
                          src={clip.s3Url}
                          wordEvents={clip.wordEvents}
                          clipStart={clip.startTime}
                        />
                      </div>

                      <div className="p-3 border-t border-border bg-card">
                        <p className="text-[12.5px] font-medium text-foreground truncate mb-2.5">
                          {clip.title}
                        </p>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full rounded-md border-border hover:bg-accent text-[12.5px] h-9"
                            >
                              <Download className="mr-2 h-3.5 w-3.5" />
                              Download
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="bottom"
                            align="end"
                            className="rounded-md border-border min-w-[160px] z-50"
                          >
                            {["9:16", "1:1", "4:5"].map((aspect) => {
                              const downloadUrl = getDownloadUrl(aspect);
                              const isProcessing = isJobRunning(aspect);
                              return (
                                <DropdownMenuItem
                                  key={aspect}
                                  disabled={isProcessing}
                                  className="rounded-sm text-[13px] focus:bg-accent py-2 flex items-center justify-between"
                                  onClick={() => {
                                    if (downloadUrl) {
                                      window.open(downloadUrl, "_blank");
                                    } else {
                                      onDownload(content._id, clip, aspect);
                                    }
                                  }}
                                >
                                  <span>
                                    {isProcessing
                                      ? `Rendering ${aspect}…`
                                      : `${aspect}`}
                                  </span>
                                  {downloadUrl && !isProcessing && (
                                    <span className="text-[var(--accent-500)] text-xs">Ready</span>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                }

                if (clip.status === "FAILED") {
                  return (
                    <div
                      key={clip._id}
                      className="border border-dashed border-red-500/30 aspect-[9/16] flex flex-col items-center justify-center bg-red-500/[0.04] text-red-500/80 rounded-xl"
                    >
                      <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center mb-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                      <p className="text-xs">Generation failed</p>
                    </div>
                  );
                }

                return (
                  <div
                    key={clip._id}
                    className="border border-dashed border-border aspect-[9/16] flex flex-col items-center justify-center bg-muted/20 rounded-xl"
                  >
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-foreground/20 border-t-foreground"></div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Processing…
                    </p>
                  </div>
                );
              })}
            </TabsContent>

            {/* --- Transcript Tab --- */}
            <TabsContent value="transcript" className="mt-0">
              <TranscriptDisplay
                transcript={content.transcript}
                translatedText={showTranslation ? currentTranslation?.transcript : undefined}
                targetLanguage={currentTranslation?.language}
                onShowOriginal={() => setShowTranslation(false)}
              />
            </TabsContent>
          </Tabs >
        </div >
      </div >
    </div >
  );
};

// ------------- FailedJobCard ---------------
const FailedJobCard = ({
  content,
  onDelete,
  isDeleting,
}: {
  content: Content;
  onDelete: (contentId: string) => void;
  isDeleting: boolean;
}) => {
  const isStale = isStaleJob(content);
  const isFailed = content.status === 'FAILED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
      className={`relative border rounded-2xl ${
        isFailed
          ? 'border-red-500/30 bg-red-500/[0.04]'
          : 'border-amber-500/30 bg-amber-500/[0.04]'
      } p-6 transition-colors duration-200`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isFailed ? 'bg-red-500/15' : 'bg-amber-500/15'
          }`}>
            {isFailed ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Clock className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                isFailed
                  ? 'border-red-500/30 text-red-500 bg-red-500/10'
                  : 'border-amber-500/30 text-amber-500 bg-amber-500/10'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isFailed ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                {isFailed ? 'Failed' : 'Stuck'}
              </span>
              <span className="text-xs text-muted-foreground">
                Started {formatTimeSince(content.createdAt)}
              </span>
            </div>
            <h3 className="text-lg font-semibold tracking-tight mb-1 truncate">
              {content.generatedTitle || "Untitled project"}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              <a href={content.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-foreground underline-offset-4 hover:underline transition-colors">{content.sourceUrl}</a>
            </p>
            {isFailed && content.errorMessage && (
              <div className="mt-3 p-3 bg-red-500/[0.06] border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-500 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span className="break-all">{content.errorMessage}</span>
                </p>
              </div>
            )}
            {isStale && !isFailed && (
              <div className="mt-3 p-3 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  This job has been processing for over 15 minutes. You can safely dismiss it.
                </p>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={isDeleting}
          onClick={() => onDelete(content._id)}
          className={`rounded-lg text-xs flex-shrink-0 h-9 px-4 transition-colors ${
            isFailed
              ? 'border-red-500/30 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50'
              : 'border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/50'
          }`}
        >
          {isDeleting ? (
            <><Activity className="w-3.5 h-3.5 mr-2 animate-spin" /> Removing…</>
          ) : (
            <><Trash2 className="w-3.5 h-3.5 mr-2" /> Dismiss</>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default function DashboardPage() {
  // Plan unused, removing to fix lint
  // Plan unused, removing to fix lint

  const { getToken, userId } = useAuth();
  const { data: contents, error, isLoading, mutate } = useSWR<Content[]>(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/content`,
    (url) => fetcher(url, getToken),
    { refreshInterval: 5000 }
  );

  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [translationCache, setTranslationCache] = useState<{ [key: string]: TranslationData }>({});
  const [showTranslationMap, setShowTranslationMap] = useState<{ [key: string]: boolean }>({});
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // ---- Scroll Listener ----
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ---- Handle OAuth callback notifications ----
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('publish_connected');
    const profile = params.get('profile');
    const error = params.get('publish_error');

    if (connected) {
      toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected!`, {
        duration: 5000,
        description: profile ? `Signed in as ${profile}. You can now publish directly.` : 'You can now publish directly.',
      });
    }
    if (error) {
      toast.error(decodeURIComponent(error), { duration: 6000 });
    }
    // Clean up URL params
    if (connected || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete('publish_connected');
      url.searchParams.delete('publish_error');
      url.searchParams.delete('profile');
      window.history.replaceState({}, '', url.pathname);
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---- Load saved cache ----
  useEffect(() => {
    if (!userId) return;
    const savedCache = localStorage.getItem(`translationCache_${userId}`);
    if (savedCache) setTranslationCache(JSON.parse(savedCache));
  }, [userId]);

  // ---- Notifications ----
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // ---- Socket for reformat events ----
  useEffect(() => {
    if (!userId) return;
    const socket: Socket = io((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'));
    socket.emit('join_room', userId);

    const handleReformatComplete = () => mutate();
    socket.on('reformat_complete', handleReformatComplete);
    socket.on('reformat_failed', handleReformatComplete);

    return () => {
      socket.off('reformat_complete', handleReformatComplete);
      socket.off('reformat_failed', handleReformatComplete);
      socket.disconnect();
    };
  }, [userId, mutate]);

  const handleOpenTranslateDialog = (contentId: string) => {
    setCurrentContentId(contentId);
    setTargetLanguage('');
    setIsTranslateDialogOpen(true);
  };

  const handleDownload = async (contentId: string, clip: Clip, aspectRatio: string) => {
    const token = await getToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/content/${contentId}/clips/${clip._id}/reformat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ aspectRatio }),
    });
    if (!res.ok) {
      toast.error("Failed to start download");
      return;
    }
    toast('Processing Started');
    mutate();
  };

  const handleDeleteContent = async (contentId: string) => {
    setDeletingIds(prev => new Set(prev).add(contentId));
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/content/${contentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        toast.error('Failed to remove job');
        return;
      }
      toast.success('Job dismissed successfully');
      // Remove from local data immediately for instant UI feedback
      mutate(
        (current: Content[] | undefined) => current?.filter(c => c._id !== contentId),
        { revalidate: true }
      );
    } catch {
      toast.error('Failed to remove job');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(contentId);
        return next;
      });
    }
  };

  const handleTranslate = async () => {
    if (!targetLanguage || !currentContentId) return;
    const contentToTranslate = contents?.find((c) => c._id === currentContentId);
    if (!contentToTranslate) return;
    setIsTranslating(true);
    const token = await getToken();

    try {
      const translate = async (text: string) => {
        if (!text) return '';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/content/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text, targetLanguage }),
        });
        if (!res.ok) throw new Error("Translation API failed");
        const data = await res.json();
        return data.translatedText;
      };

      const transcriptText = contentToTranslate.transcript.map((t) => `${t.timestamp}: ${t.text}`).join('\n');
      const promises = [
        translate(contentToTranslate.summary || ''),
        translate(contentToTranslate.generatedContent || ''),
        translate(transcriptText),
        translate(contentToTranslate.linkedinPost || ''),
        ...contentToTranslate.twitterThread.map((tweet) => translate(tweet)),
      ];
      const [summary, blog, transcript, linkedin, ...twitter] = await Promise.all(promises);

      const newTranslationData = { summary, blog, transcript, linkedin, twitter, language: targetLanguage };
      const updatedCache = { ...translationCache, [currentContentId]: newTranslationData };
      setTranslationCache(updatedCache);

      // Update specific item state
      setShowTranslationMap(prev => ({ ...prev, [currentContentId]: true }));

      if (userId) {
        localStorage.setItem(`translationCache_${userId}`, JSON.stringify(updatedCache));
      }
      toast('Translation Successful');
    } catch {
      toast('Translation Failed');
    } finally {
      setIsTranslating(false);
      setIsTranslateDialogOpen(false);
    }
  };

  const handleExportAll = async (contentId: string) => {
    const token = await getToken();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/content/${contentId}/export-all`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Export failed");

      // Extract filename from Content-Disposition header
      const disposition = res.headers.get("Content-Disposition");
      let filename = `OmniContent_${contentId}.zip`;
      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "");
      }

      // Convert response to Blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      toast.success("Export ready", {
        action: {
          label: "Download",
          onClick: () => {
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          }
        }
      });
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    }
  };


  const completedProjects = contents?.filter((item) => item.status === 'COMPLETE').length || 0;
  const processingProjects = contents?.filter((item) => ['PENDING', 'GENERATING_TEXT', 'GENERATING_VIDEOS'].includes(item.status)).length || 0;
  const totalClips = contents?.reduce((sum, item) => sum + (item.clips?.length || 0), 0) || 0;
  const totalPosts = contents?.reduce((sum, item) => sum + (item.twitterThread?.length || 0), 0) || 0;

  return (
    <>
      <Header />
      <main className="relative pt-24 pb-16 min-h-screen">
        {/* Soft brand glow upper centre, matching /create */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 h-[360px] w-[80%] -z-10"
          style={{
            background:
              "radial-gradient(closest-side, var(--accent-glow), transparent 70%)",
            opacity: 0.6,
          }}
        />

        <div className="container-page max-w-7xl">

          <motion.header
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-border pb-6 relative z-20"
          >
            <div>
              <p className="eyebrow mb-3">Dashboard</p>
              <h1 className="section-title">
                Your projects.{" "}
                <span className="text-muted-foreground">
                  All your output.
                </span>
              </h1>
              <p className="section-lede mt-3 max-w-xl">
                Every video you&apos;ve atomized — articles, social posts, clips and transcripts, all in one place.
              </p>
            </div>
            <Link href="/create">
              <Button className="rounded-md bg-foreground text-background font-medium px-5 h-10 text-[13.5px] hover:opacity-92 transition-opacity active:translate-y-px">
                <Zap className="w-4 h-4 mr-2" /> New project
              </Button>
            </Link>
          </motion.header>

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 relative z-20">
            {[
              { value: completedProjects, label: "Completed", accent: false },
              { value: processingProjects, label: "Processing", accent: false, processing: true },
              { value: totalClips + totalPosts, label: "Total assets", accent: true },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors duration-200"
              >
                <div className={`text-3xl font-semibold tracking-tight ${stat.accent ? 'text-[var(--accent-500)]' : 'text-foreground'}`}>{stat.value}</div>
                <p className="mt-1.5 text-sm text-muted-foreground flex items-center gap-2">
                  {stat.processing && stat.value > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-border pb-4">
              <div>
                <p className="eyebrow mb-1.5">Recent activity</p>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                  Library
                </h2>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-500)]" />
                <span>Auto-refreshing every 5s</span>
              </div>
            </div>

            {isLoading && (
              <div className="border border-border rounded-2xl p-12 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading your projects…</p>
              </div>
            )}

            {error && (
              <div className="border border-red-500/30 bg-red-500/5 rounded-2xl p-6">
                <p className="text-sm font-medium text-red-500 mb-1">Couldn&apos;t load your projects</p>
                <p className="text-sm text-muted-foreground break-all">{error.message || 'Unknown error.'}</p>
              </div>
            )}

            {contents?.length === 0 && (
              <div className="text-center py-20 border border-border rounded-2xl bg-muted/20">
                <div className="w-14 h-14 mx-auto bg-card border border-border rounded-2xl flex items-center justify-center mb-5">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  Drop in a YouTube link or upload a video and we&apos;ll handle the rest.
                </p>
                <Link href="/create">
                  <Button className="rounded-xl bg-foreground text-background font-medium px-5 h-10 hover:opacity-90 transition-opacity">
                    <Zap className="w-4 h-4 mr-2" /> Create your first project
                  </Button>
                </Link>
              </div>
            )}

            {contents?.map((content) => {
              // Show FailedJobCard for FAILED jobs or stale (stuck) jobs
              if (content.status === 'FAILED' || isStaleJob(content)) {
                return (
                  <AnimatePresence key={content._id}>
                    <FailedJobCard
                      content={content}
                      onDelete={handleDeleteContent}
                      isDeleting={deletingIds.has(content._id)}
                    />
                  </AnimatePresence>
                );
              }

              // Show skeleton/spinner for actively processing (non-stale) jobs
              if (['PENDING', 'GENERATING_TEXT', 'GENERATING_VIDEOS'].includes(content.status)) {
                const statusLabel = content.status === 'PENDING' ? 'Queued' : content.status === 'GENERATING_TEXT' ? 'Generating text' : 'Rendering videos';
                return (
                  <div key={content._id} className="relative border border-border bg-card rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500/30 border-t-amber-500"></div>
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border border-amber-500/30 text-amber-500 bg-amber-500/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {statusLabel}
                        </span>
                        <p className="text-sm text-muted-foreground mt-2">
                          Started {formatTimeSince(content.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <TypewriterProvider key={content._id}>
                  <ContentDisplayCard
                    content={content}
                    onDownload={handleDownload}
                    onTranslateOpen={handleOpenTranslateDialog}
                    onExport={() => handleExportAll(content._id)}
                    translationCache={translationCache}
                    showTranslation={!!showTranslationMap[content._id]}
                    setShowTranslation={(val) => setShowTranslationMap(prev => ({ ...prev, [content._id]: val }))}
                    onPublished={() => mutate()}
                  />
                </TypewriterProvider>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={isTranslateDialogOpen} onOpenChange={setIsTranslateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-border bg-card p-0 overflow-hidden">
          <div className="bg-muted/40 p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                <Languages className="w-4 h-4 text-background" />
              </div>
              <DialogTitle className="font-semibold tracking-tight text-lg">Translate content</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Pick a language and we&apos;ll translate the article, summary, social posts and transcript.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Target language</label>
              <div className="relative">
                <Input
                  id="language"
                  placeholder="e.g. Spanish, Japanese"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                  className="rounded-xl border-border focus:ring-0 focus:border-foreground h-11 pl-4 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {['Spanish', 'French', 'German', 'Japanese'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setTargetLanguage(lang)}
                  className={`text-left px-4 py-2.5 border rounded-xl transition-colors text-sm ${targetLanguage === lang ? 'border-foreground/40 bg-muted/60' : 'border-border hover:border-foreground/30 hover:bg-muted/40'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-border bg-muted/20">
            <Button
              variant="outline"
              onClick={() => setIsTranslateDialogOpen(false)}
              className="rounded-xl border-border hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !targetLanguage}
              className="rounded-xl bg-foreground text-background hover:opacity-90 min-w-[120px]"
            >
              {isTranslating ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" /> Translating…
                </>
              ) : (
                "Translate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scroll To Top Button */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-8 right-8 z-50 p-3 bg-foreground text-background rounded-xl shadow-lg transition-all duration-300 hover:scale-105 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </>
  );
}

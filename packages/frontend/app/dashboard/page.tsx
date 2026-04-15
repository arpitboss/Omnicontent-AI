"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import useSWR from "swr";

import { CopyButton } from '@/components/copy-button';
import { Header } from "@/components/header";
import { ArticleSkeleton, LinkedInSkeleton, TwitterSkeleton } from "@/components/skeletons";
import { TranscriptDisplay } from "@/components/transcript-display";
import { TypewriterText } from "@/components/typewriter-text";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
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
  Download,
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
  X,
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
  createdAt: string;
}

// ---------------- Utils ----------------
const fetcher = async (url: string, getToken: () => Promise<string | null>) => {
  const token = await getToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("An error occurred while fetching the data.");
  return res.json();
};

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

const ReadingProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50"
      style={{ scaleX }}
    />
  );
};

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
}: {
  content: Content;
  onDownload: (contentId: string, clip: Clip, aspectRatio: string) => void;
  onTranslateOpen: (contentId: string) => void;
  onExport: () => void;
  translationCache: { [key: string]: any };
  showTranslation: boolean;
  setShowTranslation: (val: boolean) => void;
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

  return (
    <div className="relative border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-black p-6 group transition-all duration-300 hover:border-emerald-500 hover:border-solid hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]">
      {/* Corner Markers - Animated */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-400 dark:border-neutral-600 group-hover:border-emerald-500 transition-colors duration-300" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-400 dark:border-neutral-600 group-hover:border-emerald-500 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-400 dark:border-neutral-600 group-hover:border-emerald-500 transition-colors duration-300" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-400 dark:border-neutral-600 group-hover:border-emerald-500 transition-colors duration-300" />

      {/* ---- Header ---- */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 border-b border-dashed border-neutral-200 dark:border-neutral-800 pb-4 group-hover:border-emerald-500/30 transition-colors duration-300">
        <div>
          <div className="mb-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all ${content.status === 'COMPLETE'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                : content.status === 'FAILED'
                  ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                  : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 animate-pulse'
              }`}>
              {content.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">
            {content.generatedTitle || "Processing Data Stream..."}
          </h3>
          <p className="text-sm text-neutral-500 font-mono flex items-center">
            <span className="w-2 h-2 bg-neutral-300 dark:bg-neutral-700 rounded-full mr-2 group-hover:bg-emerald-500 transition-colors" />
            SOURCE: <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/content/${content._id}/${content.sourceUrl}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-dashed transition-colors ml-1">{content.sourceUrl}</a>
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none font-mono text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 mr-2 transition-colors"
            onClick={onExport}
          >
            <Download className="mr-2 h-3 w-3" /> EXPORT
          </Button>

          {currentTranslation && (
            <Button
              variant="outline"
              className="rounded-none border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
              onClick={() => setShowTranslation(!showTranslation)}
            >
              {showTranslation ? "ORIGINAL" : "TRANSLATION"}
            </Button>
          )}
          <Button
            variant={currentTranslation ? "ghost" : "outline"}
            className="rounded-none border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
            onClick={() => onTranslateOpen(content._id)}
          >
            <Zap className="mr-2 h-4 w-4" />
            {currentTranslation ? "CHANGE LANG" : "TRANSLATE"}
          </Button>
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ---- Left Column ---- */}
        < div className="lg:col-span-1 space-y-6" >
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <h4 className="font-bold text-sm uppercase tracking-widest">Source Feed</h4>
          </div>
          <div className="aspect-video overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-black relative">
            <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
            <ReactPlayer
              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/content/${content._id}/${content.sourceUrl}`}
              width="100%"
              height="100%"
              controls
            />
          </div>

          <div className="flex items-center justify-between border-b border-dashed border-neutral-200 dark:border-neutral-800 pb-2">
            <h4 className="font-bold text-sm uppercase tracking-widest">Executive Summary</h4>
            <CopyButton textToCopy={content.summary || ''} />
          </div>
          <div className="font-mono text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            <TypewriterText
              id={`${content._id}-summary-${showTranslation ? 'translated' : 'original'}`}
              text={
                showTranslation && currentTranslation?.summary
                  ? currentTranslation.summary
                  : content.summary || ""
              }
            />
          </div>
        </div >

        {/* ---- Right Column ---- */}
        < div className="lg:col-span-2" >
          <Tabs defaultValue="article" className="w-full">
            <TabsList className="w-full grid grid-cols-4 rounded-none border-b border-neutral-200 dark:border-neutral-800 bg-transparent p-0 mb-6">
              <TabsTrigger
                value="article"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white h-12 font-mono text-xs uppercase tracking-widest hover:text-black dark:hover:text-white transition-all data-[state=active]:shadow-none bg-transparent !bg-transparent !shadow-none !border-t-0 !border-l-0 !border-r-0"
              >
                Article
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white h-12 font-mono text-xs uppercase tracking-widest hover:text-black dark:hover:text-white transition-all data-[state=active]:shadow-none bg-transparent !bg-transparent !shadow-none !border-t-0 !border-l-0 !border-r-0"
              >
                Social
              </TabsTrigger>
              <TabsTrigger
                value="clips"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white h-12 font-mono text-xs uppercase tracking-widest hover:text-black dark:hover:text-white transition-all data-[state=active]:shadow-none bg-transparent !bg-transparent !shadow-none !border-t-0 !border-l-0 !border-r-0"
              >
                Clips
              </TabsTrigger>
              <TabsTrigger
                value="transcript"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white h-12 font-mono text-xs uppercase tracking-widest hover:text-black dark:hover:text-white transition-all data-[state=active]:shadow-none bg-transparent !bg-transparent !shadow-none !border-t-0 !border-l-0 !border-r-0"
              >
                Transcript
              </TabsTrigger>
            </TabsList>

            {/* --- Article Tab --- */}
            <TabsContent
              value="article"
              className="mt-0 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-0 min-h-[800px]"
            >
              {content.status === 'GENERATING_TEXT' || content.status === 'PENDING' ? (
                <ArticleSkeleton />
              ) : (
                <>
                  <ReadingProgress />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-[720px] mx-auto py-16 px-6"
                  >
                    {/* Hero Image */}
                    <div className="mb-12 relative aspect-video w-full overflow-hidden rounded-md shadow-sm">
                      <img
                        src={`https://image.pollinations.ai/prompt/${encodeURIComponent((content.generatedTitle || "abstract") + " cinematic, photorealistic, 4k, dramatic lighting, no text")}?width=1280&height=720&nologo=true`}
                        alt="Article Hero"
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                      />
                    </div>

                    {/* Title Area */}
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-8 mt-16 font-sans leading-tight">
                      {content.generatedTitle || "Untitled Draft"}
                    </h1>

                    {/* Author/Meta */}
                    <div className="flex items-center space-x-4 mb-12 border-b border-neutral-100 dark:border-neutral-800 pb-8">
                      <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-neutral-500" />
                      </div>
                      <div>
                        <div className="font-sans font-medium text-neutral-900 dark:text-neutral-100">OmniAgent AI</div>
                        <div className="font-sans text-sm text-neutral-500">
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
                          p: ({ node, ...props }) => {
                            const text =
                              node?.children[0]?.type === "text"
                                ? node.children[0].value
                                : "";
                            if (text.startsWith("[Image:")) {
                              return <BlogImageRenderer src={text} />;
                            }
                            // Medium style paragraph: Serif, large, relaxed, proper spacing
                            return (
                              <ScrollReveal>
                                <p {...props} className="font-serif text-[20px] leading-[32px] text-[#242424] dark:text-[#e5e5e5] mb-10" style={{ fontFamily: 'charter, Georgia, Cambria, "Times New Roman", Times, serif' }} />
                              </ScrollReveal>
                            );
                          },
                          h1: ({ node, ...props }) => (
                            <ScrollReveal>
                              <h1 {...props} className="font-sans font-bold text-3xl md:text-4xl mb-8 mt-16 text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight" />
                            </ScrollReveal>
                          ),
                          h2: ({ node, ...props }) => (
                            <ScrollReveal>
                              <h2 {...props} className="font-sans font-bold text-2xl md:text-3xl mb-6 mt-14 text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight" />
                            </ScrollReveal>
                          ),
                          h3: ({ node, ...props }) => (
                            <ScrollReveal>
                              <h3 {...props} className="font-sans font-bold text-xl md:text-2xl mb-4 mt-12 text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight" />
                            </ScrollReveal>
                          ),
                          blockquote: ({ node, ...props }) => (
                            <ScrollReveal>
                              <blockquote {...props} className="border-l-[3px] border-neutral-900 dark:border-neutral-100 pl-6 italic text-[22px] leading-relaxed text-neutral-700 dark:text-neutral-300 my-14 font-serif" style={{ fontFamily: 'charter, Georgia, Cambria, "Times New Roman", Times, serif' }} />
                            </ScrollReveal>
                          ),
                          ul: ({ node, ...props }) => (
                            <ScrollReveal>
                              <ul {...props} className="list-disc pl-6 mb-10 space-y-3 font-serif text-[20px] leading-[32px] text-neutral-800 dark:text-neutral-200" />
                            </ScrollReveal>
                          ),
                          ol: ({ node, ...props }) => (
                            <ScrollReveal>
                              <ol {...props} className="list-decimal pl-6 mb-10 space-y-3 font-serif text-[20px] leading-[32px] text-neutral-800 dark:text-neutral-200" />
                            </ScrollReveal>
                          ),
                          li: ({ node, ...props }) => <li {...props} className="pl-2" />,
                        }}
                        text={
                          showTranslation && currentTranslation?.blog
                            ? currentTranslation.blog
                            : content.generatedContent || ""
                        }
                      />
                    </article>
                  </motion.div>
                </>
              )}
            </TabsContent>

            {/* --- Social Tab --- */}
            <TabsContent value="social" className="mt-0">
              <Tabs defaultValue="linkedin" className="w-full">
                <TabsList className="flex w-full justify-center space-x-6 border-b border-neutral-200 dark:border-neutral-800 bg-transparent p-0 mb-6">
                  <TabsTrigger
                    value="linkedin"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0a66c2] data-[state=active]:text-[#0a66c2] h-10 px-4 font-bold text-sm hover:text-[#0a66c2] transition-all data-[state=active]:shadow-none bg-transparent !bg-transparent !shadow-none !border-t-0 !border-l-0 !border-r-0"
                  >
                    LinkedIn
                  </TabsTrigger>
                  <TabsTrigger
                    value="twitter"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white h-10 px-4 font-bold text-sm hover:text-black dark:hover:text-white transition-all data-[state=active]:shadow-none bg-transparent !bg-transparent !shadow-none !border-t-0 !border-l-0 !border-r-0"
                  >
                    X / Twitter
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="linkedin"
                  className="p-0 bg-[#f3f2ef] dark:bg-black border border-neutral-200 dark:border-neutral-800"
                >
                  {content.status === 'GENERATING_TEXT' || content.status === 'PENDING' ? (
                    <LinkedInSkeleton />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="bg-white dark:bg-[#1b1f23] p-4 rounded-sm shadow-sm border border-neutral-300 dark:border-neutral-700 max-w-[555px] mx-auto my-8"
                    >
                      {/* Header */}
                      <div className="flex items-start mb-3">
                        <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 mr-3 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">OA</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white leading-tight hover:text-blue-600 hover:underline cursor-pointer">OmniAgent AI</h3>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-tight">Autonomous Content Architect</p>
                              <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                <span>1h • </span>
                                <span className="ml-1">🌐</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500">
                                <MoreHorizontal className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed whitespace-pre-wrap font-sans mb-4">
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
                      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-1 flex justify-between items-center px-2">
                        <motion.div whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }} whileTap={{ scale: 0.95 }} className="flex items-center space-x-2 text-neutral-500 px-4 py-3 rounded cursor-pointer transition-colors flex-1 justify-center">
                          <ThumbsUp className="w-5 h-5" />
                          <span className="text-sm font-semibold">Like</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }} whileTap={{ scale: 0.95 }} className="flex items-center space-x-2 text-neutral-500 px-4 py-3 rounded cursor-pointer transition-colors flex-1 justify-center">
                          <MessageSquare className="w-5 h-5" />
                          <span className="text-sm font-semibold">Comment</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }} whileTap={{ scale: 0.95 }} className="flex items-center space-x-2 text-neutral-500 px-4 py-3 rounded cursor-pointer transition-colors flex-1 justify-center">
                          <Repeat className="w-5 h-5" />
                          <span className="text-sm font-semibold">Repost</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }} whileTap={{ scale: 0.95 }} className="flex items-center space-x-2 text-neutral-500 px-4 py-3 rounded cursor-pointer transition-colors flex-1 justify-center">
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
                          className="rounded-full font-bold text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(content.twitterThread?.join('\n\n') || '');
                            toast.success("Thread copied to clipboard");
                          }}
                        >
                          Copy Full Thread
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
                            <div className="absolute left-[34px] top-[50px] bottom-0 w-[2px] bg-neutral-200 dark:bg-neutral-800 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-700 transition-colors" />
                          )}

                          <div className="flex items-start space-x-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors rounded-xl">
                            <div className="relative z-10">
                              <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold border-2 border-white dark:border-black">
                                OA
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-1">
                                  <span className="font-bold text-neutral-900 dark:text-neutral-100 text-[15px]">OmniAgent</span>
                                  <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500 text-white" />
                                  <span className="text-neutral-500 text-[15px] ml-1">@omni_ai</span>
                                  <span className="text-neutral-500 text-[15px]">·</span>
                                  <span className="text-neutral-500 text-[15px] hover:underline cursor-pointer">{index + 1}m</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CopyButton textToCopy={tweet.replace(/^\d+\/\s*/, '')} />
                                </div>
                              </div>

                              <div className="text-neutral-900 dark:text-neutral-100 leading-normal text-[15px] whitespace-pre-wrap font-sans">
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
                              <div className="flex justify-between max-w-[425px] mt-3 text-neutral-500">
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
              className="mt-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 p-6 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30"
            >
              {(!content.clips || content.clips.length === 0) && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-neutral-500">
                  <div className="w-12 h-12 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-full flex items-center justify-center mb-4">
                    <Layers className="w-5 h-5 opacity-50" />
                  </div>
                  <p className="font-mono text-xs uppercase tracking-widest">No Clips Generated</p>
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
                      className="group relative bg-black border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="relative aspect-[9/16] bg-black">
                        <video
                          controls
                          muted
                          src={clip.s3Url}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 pointer-events-none" />
                      </div>

                      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
                        <p className="font-bold text-xs text-black dark:text-white uppercase tracking-wider truncate mb-3">
                          {clip.title}
                        </p>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full rounded-none border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 font-mono text-[10px] h-8 uppercase tracking-widest transition-colors"
                            >
                              <Download className="mr-2 h-3 w-3" />
                              Download Asset
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="bottom"
                            align="end"
                            className="rounded-none border-neutral-200 dark:border-neutral-800 min-w-[140px] z-50"
                          >
                            {["9:16", "1:1", "4:5"].map((aspect) => {
                              const downloadUrl = getDownloadUrl(aspect);
                              const isProcessing = isJobRunning(aspect);
                              return (
                                <DropdownMenuItem
                                  key={aspect}
                                  disabled={isProcessing}
                                  className="rounded-none font-mono text-xs focus:bg-neutral-100 dark:focus:bg-neutral-800 py-2"
                                  onClick={() => {
                                    if (downloadUrl) {
                                      window.open(downloadUrl, "_blank");
                                    } else {
                                      onDownload(content._id, clip, aspect);
                                    }
                                  }}
                                >
                                  {isProcessing
                                    ? `PROCESSING ${aspect}...`
                                    : `DOWNLOAD ${aspect}`}
                                  {downloadUrl && !isProcessing && (
                                    <span className="ml-2 text-green-500">✓</span>
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
                      className="border border-dashed border-neutral-300 dark:border-neutral-700 aspect-[9/16] flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900/50 text-neutral-400"
                    >
                      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-2">
                        <AlertCircle className="w-4 h-4 text-neutral-500" />
                      </div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Generation Failed</p>
                    </div>
                  );
                }

                return (
                  <div
                    key={clip._id}
                    className="border border-dashed border-neutral-200 dark:border-neutral-800 aspect-[9/16] flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900"
                  >
                    <div className="animate-spin rounded-none h-6 w-6 border-2 border-neutral-300 border-t-black dark:border-neutral-700 dark:border-t-white"></div>
                    <p className="text-xs text-neutral-500 mt-4 font-mono uppercase tracking-widest">
                      Processing...
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

export default function DashboardPage() {
  const { user } = useUser();
  const plan = (user?.publicMetadata?.plan as "pro" | "free") || "free";

  const { getToken, userId } = useAuth();
  const { data: contents, error, isLoading, mutate } = useSWR<Content[]>(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/content`,
    (url) => fetcher(url, getToken),
    { refreshInterval: 5000 }
  );

  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [translationCache, setTranslationCache] = useState<{ [key: string]: any }>({});
  const [showTranslationMap, setShowTranslationMap] = useState<{ [key: string]: boolean }>({});
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ---- Scroll Listener ----
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    } catch (error) {
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
    <div className="min-h-screen bg-transparent">
      <Header />
      <div className="relative pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 flex flex-col md:flex-row justify-between items-end border-b border-dashed border-neutral-300 dark:border-neutral-800 pb-8">
            <div>
              <h1 className="text-5xl font-bold tracking-tighter mb-2">Mission Control</h1>
              <p className="text-neutral-500 font-mono text-sm uppercase tracking-widest flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                System Status: Online | {contents?.length || 0} Active Projects
              </p>
            </div>
            <Link href="/create">
              <Button className="rounded-none bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-wider px-8 h-12 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all duration-300 relative overflow-hidden group cursor-pointer shadow-lg hover:shadow-emerald-500/20">
                <span className="relative z-10 flex items-center">
                  <Zap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Initialize New Project
                </span>
              </Button>
            </Link>
          </div>

          <BentoGrid className="mb-16">
            <BentoGridItem
              title="Completed Projects"
              description="Total successfully processed content streams."
              header={<div className="text-5xl font-bold font-mono tracking-tighter group-hover:text-emerald-500 transition-colors">{completedProjects}</div>}
              icon={<FileText className="w-6 h-6 text-neutral-500 group-hover:text-emerald-500 transition-colors" />}
              className="md:col-span-1 group hover:border-emerald-500/50 transition-colors"
            />
            <BentoGridItem
              title="Processing Queue"
              description="Active jobs currently in the neural pipeline."
              header={<div className="text-5xl font-bold font-mono tracking-tighter text-amber-500">{processingProjects}</div>}
              icon={<Activity className="w-6 h-6 text-amber-500 animate-pulse" />}
              className="md:col-span-1 group hover:border-amber-500/50 transition-colors"
            />
            <BentoGridItem
              title="Generated Assets"
              description="Total clips and social posts created."
              header={<div className="text-5xl font-bold font-mono tracking-tighter group-hover:text-purple-500 transition-colors">{totalClips + totalPosts}</div>}
              icon={<Layers className="w-6 h-6 text-neutral-500 group-hover:text-purple-500 transition-colors" />}
              className="md:col-span-1 group hover:border-purple-500/50 transition-colors"
            />
          </BentoGrid>

          <div className="space-y-16">
            <div className="flex items-end justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-neutral-600 to-neutral-900 dark:from-white dark:via-neutral-400 dark:to-white mb-2">
                  Live Operations
                </h2>
                <p className="text-neutral-500 font-mono text-sm tracking-widest uppercase">
                  Real-time content processing stream
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>SYSTEM OPTIMAL</span>
              </div>
            </div>

            {isLoading && (
              <div className="border border-dashed border-neutral-300 p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent mx-auto mb-4"></div>
                <p className="font-mono text-sm uppercase">Fetching Data Stream...</p>
              </div>
            )}

            {error && <p className="text-center text-red-500 font-mono">ERROR: CONNECTION_REFUSED</p>}

            {contents?.length === 0 && (
              <div className="text-center py-24 border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                <div className="w-16 h-16 mx-auto bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-6">
                  <FileText className="w-8 h-8 text-neutral-400" />
                </div>
                <div className="space-y-2 mb-8">
                  <h3 className="text-xl font-bold">No Data Found</h3>
                  <p className="text-neutral-500 font-mono text-sm">
                    Initialize a new project to begin data processing.
                  </p>
                </div>
              </div>
            )}

            {contents?.map((content) => {


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
                  />
                </TypewriterProvider>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={isTranslateDialogOpen} onOpenChange={setIsTranslateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-none border-black dark:border-white bg-white dark:bg-black p-0 overflow-hidden">
          <div className="bg-neutral-50 dark:bg-neutral-900 p-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center">
                <Languages className="w-4 h-4 text-white dark:text-black" />
              </div>
              <DialogTitle className="font-bold uppercase tracking-widest text-lg">Neural Translation</DialogTitle>
            </div>
            <DialogDescription className="font-mono text-xs text-neutral-500">
              Select a target protocol for content localization.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Target Language</label>
              <div className="relative">
                <Input
                  id="language"
                  placeholder="Type language (e.g. Spanish, Japanese)..."
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                  className="rounded-none border-neutral-300 dark:border-neutral-700 focus:ring-0 focus:border-black dark:focus:border-white h-12 pl-4 font-mono text-sm"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="text-[10px] font-mono text-neutral-400 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5">RETURN</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {['Spanish', 'French', 'German', 'Japanese'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setTargetLanguage(lang)}
                  className="text-left px-4 py-3 border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all text-sm font-mono"
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <Button
              variant="outline"
              onClick={() => setIsTranslateDialogOpen(false)}
              className="rounded-none border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="rounded-none bg-black text-white dark:bg-white dark:text-black hover:opacity-90 min-w-[120px]"
            >
              {isTranslating ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" /> PROCESSING
                </>
              ) : (
                "EXECUTE"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scroll To Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-3 bg-black dark:bg-white text-white dark:text-black shadow-lg transition-all duration-300 hover:scale-110 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
      >
        <ArrowUp className="w-6 h-6" />
      </button>
    </div>
  );
}

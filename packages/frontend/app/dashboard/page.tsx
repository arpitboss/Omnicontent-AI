"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import useSWR from "swr";

import { CopyButton } from '@/components/copy-button';
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { TranscriptDisplay } from "@/components/transcript-display";
import { TypewriterText } from "@/components/typewriter-text";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypewriterProvider, useTypewriterManager } from "@/context/typewriter-context";

import {
  Activity,
  Download,
  FileText,
  Languages,
  Layers,
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
  const imageUrl = `https://source.unsplash.com/random/800x450/?${encodeURIComponent(
    searchTerm
  )}`;
  return <img src={imageUrl} alt={searchTerm} className="rounded-none my-6 border border-dashed border-neutral-300 dark:border-neutral-700" />;
};

// ------------- ContentDisplayCard ---------------
const ContentDisplayCard = ({
  content,
  onDownload,
  onTranslateOpen,
  translationCache,
  showTranslation,
  setShowTranslation,
}: {
  content: Content;
  onDownload: (contentId: string, clip: Clip, aspectRatio: string) => void;
  onTranslateOpen: (contentId: string) => void;
  translationCache: { [key: string]: any };
  showTranslation: boolean;
  setShowTranslation: (val: boolean) => void;
}) => {
  const { startAnimation } = useTypewriterManager();
  const currentTranslation = translationCache[content._id];

  useEffect(() => {
    if (content && content.status !== 'PENDING' && content.status !== 'GENERATING_TEXT') {
      const hasPlayed = sessionStorage.getItem(`typewriter_played_${content._id}`);
      if (hasPlayed) return;

      startAnimation(`${content._id}-summary`, content.summary || "");
      startAnimation(`${content._id}-article`, content.generatedContent || "");
      startAnimation(`${content._id}-linkedin`, content.linkedinPost || "");
      content.twitterThread?.forEach((tweet, index) => {
        startAnimation(`${content._id}-tweet-${index}`, tweet);
      });

      sessionStorage.setItem(`typewriter_played_${content._id}`, 'true');
    }
  }, [content, startAnimation]);

  return (
    <div className="relative overflow-hidden border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black p-6 group">
      {/* Corner Markers */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-400 dark:border-neutral-500" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-400 dark:border-neutral-500" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-400 dark:border-neutral-500" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-400 dark:border-neutral-500" />

      {/* ---- Header ---- */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 border-b border-dashed border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight mb-1">
            {content.generatedTitle || "Processing Data Stream..."}
          </h3>
          <p className="text-sm text-neutral-500 font-mono">
            SOURCE: <a href={`http://localhost:8080/api/v1/content/${content._id}/${content.sourceUrl}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline decoration-dashed">{content.sourceUrl}</a>
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          {currentTranslation && (
            <Button
              variant="outline"
              className="rounded-none border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              onClick={() => setShowTranslation(!showTranslation)}
            >
              {showTranslation ? "ORIGINAL" : "TRANSLATION"}
            </Button>
          )}
          <Button
            variant={currentTranslation ? "ghost" : "outline"}
            className="rounded-none border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            onClick={() => onTranslateOpen(content._id)}
          >
            <Languages className="mr-2 h-4 w-4" />
            {currentTranslation ? "CHANGE LANG" : "TRANSLATE"}
          </Button>
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ---- Left Column ---- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <h4 className="font-bold text-sm uppercase tracking-widest">Source Feed</h4>
          </div>
          <div className="aspect-video overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-black relative">
            <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
            <ReactPlayer
              src={`http://localhost:8080/api/v1/content/${content._id}/${content.sourceUrl}`}
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
              id={`${content._id}-summary`}
              text={
                showTranslation && currentTranslation?.summary
                  ? currentTranslation.summary
                  : content.summary || ""
              }
            />
          </div>
        </div>

        {/* ---- Right Column ---- */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="article" className="w-full">
            <TabsList className="w-full grid grid-cols-4 rounded-none border border-neutral-200 dark:border-neutral-800 bg-transparent p-0">
              <TabsTrigger value="article" className="rounded-none data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-none border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 h-10 font-mono text-xs uppercase">Article</TabsTrigger>
              <TabsTrigger value="social" className="rounded-none data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-none border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 h-10 font-mono text-xs uppercase">Social</TabsTrigger>
              <TabsTrigger value="clips" className="rounded-none data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-none border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 h-10 font-mono text-xs uppercase">Clips</TabsTrigger>
              <TabsTrigger value="transcript" className="rounded-none data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-none h-10 font-mono text-xs uppercase">Transcript</TabsTrigger>
            </TabsList>

            {/* --- Article Tab --- */}
            <TabsContent
              value="article"
              className="mt-6 prose prose-neutral dark:prose-invert max-w-none p-6 border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50"
            >
              <div className="flex justify-end -mb-8 relative z-10">
                <CopyButton textToCopy={content.generatedContent || ''} />
              </div>
              <TypewriterText
                id={`${content._id}-article`}
                components={{
                  p: ({ node, ...props }) => {
                    const text =
                      node?.children[0]?.type === "text"
                        ? node.children[0].value
                        : "";
                    if (text.startsWith("[Image:")) {
                      return <BlogImageRenderer src={text} />;
                    }
                    return <p {...props} className="font-serif leading-loose" />;
                  },
                }}
                text={
                  showTranslation && currentTranslation?.blog
                    ? currentTranslation.blog
                    : content.generatedContent || ""
                }
              />
            </TabsContent>

            {/* --- Social Tab --- */}
            <TabsContent value="social" className="mt-6">
              <Tabs defaultValue="linkedin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none border border-neutral-200 dark:border-neutral-800 bg-transparent p-0 mb-4">
                  <TabsTrigger value="linkedin" className="rounded-none data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">LinkedIn</TabsTrigger>
                  <TabsTrigger value="twitter" className="rounded-none data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-neutral-900">Twitter / X</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="linkedin"
                  className="p-6 border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black whitespace-pre-wrap text-sm font-sans"
                >
                  <div className="flex justify-end -mb-8 relative z-10">
                    <CopyButton textToCopy={content.linkedinPost || ''} />
                  </div>
                  <TypewriterText
                    id={`${content._id}-linkedin`}
                    text={
                      showTranslation && currentTranslation?.linkedin
                        ? currentTranslation.linkedin
                        : content.linkedinPost || ""
                    }
                  />
                </TabsContent>

                <TabsContent value="twitter" className="space-y-4">
                  <div className="flex justify-end -mb-4 relative z-10">
                    <CopyButton textToCopy={content.twitterThread?.join('\n\n') || ''} />
                  </div>
                  {content.twitterThread?.map((tweet: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black"
                    >
                      <div className="w-8 h-8 rounded-none bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="text-sm flex-1">
                        <TypewriterText
                          id={`${content._id}-tweet-${index}`}
                          text={
                            showTranslation &&
                              currentTranslation?.twitter?.[index]
                              ? currentTranslation.twitter[index]
                              : tweet
                          }
                        />
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* --- Clips Tab --- */}
            <TabsContent
              value="clips"
              className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {content.clips?.map((clip) => {
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
                      className="border border-dashed border-neutral-200 dark:border-neutral-800 group hover:border-solid hover:border-primary transition-all duration-300"
                    >
                      <div className="relative aspect-[9/16] bg-black overflow-hidden">
                        <video
                          controls
                          muted
                          src={clip.s3Url}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
                        <p className="font-bold text-xs uppercase tracking-wider truncate mb-3">
                          {clip.title}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full rounded-none border-neutral-300 dark:border-neutral-700 font-mono text-xs"
                            >
                              <Download className="mr-2 h-3 w-3" />
                              DOWNLOAD ASSET
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-none border-neutral-200 dark:border-neutral-800">
                            {["9:16", "1:1", "4:5"].map((aspect) => {
                              const downloadUrl = getDownloadUrl(aspect);
                              const isProcessing = isJobRunning(aspect);
                              return (
                                <DropdownMenuItem
                                  key={aspect}
                                  disabled={isProcessing}
                                  className="rounded-none font-mono text-xs focus:bg-neutral-100 dark:focus:bg-neutral-800"
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
                      className="border border-dashed border-red-200 dark:border-red-900 aspect-[9/16] flex flex-col items-center justify-center bg-red-50/50 dark:bg-red-900/10 text-red-600"
                    >
                      <p className="font-bold text-xs uppercase">Generation Failed</p>
                      <p className="text-[10px] mt-1 font-mono">ERROR_CODE_500</p>
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
            <TabsContent value="transcript" className="mt-6">
              <TranscriptDisplay
                transcript={content.transcript}
                translatedText={showTranslation ? currentTranslation?.transcript : undefined}
                targetLanguage={currentTranslation?.language}
                onShowOriginal={() => setShowTranslation(false)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// ---------------- DashboardPage ----------------
// Main Dashboard component
export default function DashboardPage() {
  const { user } = useUser();
  const plan = (user?.publicMetadata?.plan as "pro" | "free") || "free";

  const { getToken, userId } = useAuth();
  const { data: contents, error, isLoading, mutate } = useSWR<Content[]>(
    "http://localhost:8080/api/v1/content",
    (url) => fetcher(url, getToken),
    { refreshInterval: 5000 }
  );

  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [translationCache, setTranslationCache] = useState<{ [key: string]: any }>({});
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);

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
    const socket: Socket = io('http://localhost:8080');
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
    await fetch(`http://localhost:8080/api/v1/content/${contentId}/clips/${clip._id}/reformat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ aspectRatio }),
    });
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
        const res = await fetch('http://localhost:8080/api/v1/content/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text, targetLanguage }),
        });
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
      setShowTranslation(true);
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
        `http://localhost:8080/api/v1/content/${contentId}/export-all`,
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
          <div className="mb-16 flex flex-col md:flex-row justify-between items-end border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-8">
            <div>
              <h1 className="text-5xl font-bold tracking-tighter mb-2">Mission Control</h1>
              <p className="text-neutral-500 font-mono text-sm uppercase tracking-widest">
                System Status: Online | {contents?.length || 0} Active Projects
              </p>
            </div>
            <Button className="rounded-none bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-wider px-8 h-12 hover:opacity-90 transition-all relative overflow-hidden group cursor-pointer">
              <span className="relative z-10 flex items-center">
                <Zap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Initialize New Project
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Button>
          </div>

          <BentoGrid className="mb-16">
            <BentoGridItem
              title="Completed Projects"
              description="Total successfully processed content streams."
              header={<div className="text-5xl font-bold font-mono tracking-tighter">{completedProjects}</div>}
              icon={<FileText className="w-6 h-6 text-neutral-500" />}
              className="md:col-span-1"
            />
            <BentoGridItem
              title="Processing Queue"
              description="Active jobs currently in the neural pipeline."
              header={<div className="text-5xl font-bold font-mono tracking-tighter text-amber-500">{processingProjects}</div>}
              icon={<Activity className="w-6 h-6 text-amber-500" />}
              className="md:col-span-1"
            />
            <BentoGridItem
              title="Generated Assets"
              description="Total clips and social posts created."
              header={<div className="text-5xl font-bold font-mono tracking-tighter">{totalClips + totalPosts}</div>}
              icon={<Layers className="w-6 h-6 text-neutral-500" />}
              className="md:col-span-1"
            />
          </BentoGrid>

          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Recent Operations</h2>
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

            {contents?.map((content) => (
              <TypewriterProvider key={content._id}>
                <div className="flex justify-end mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none font-mono text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    onClick={() => handleExportAll(content._id)}
                  >
                    <Download className="mr-2 h-3 w-3" /> EXPORT_ARCHIVE
                  </Button>
                </div>
                <ContentDisplayCard
                  content={content}
                  onDownload={handleDownload}
                  onTranslateOpen={handleOpenTranslateDialog}
                  translationCache={translationCache}
                  showTranslation={showTranslation}
                  setShowTranslation={setShowTranslation}
                />
              </TypewriterProvider>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isTranslateDialogOpen} onOpenChange={setIsTranslateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-none border-black dark:border-white bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle className="font-bold uppercase tracking-widest">Translate Content</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Select target language protocol for neural translation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="language"
              placeholder="e.g., Spanish, Japanese, Hindi"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
              className="rounded-none border-neutral-300 focus:ring-0 focus:border-black"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleTranslate} disabled={isTranslating || !targetLanguage} className="rounded-none bg-black text-white hover:opacity-90 w-full">
              {isTranslating ? 'PROCESSING...' : 'EXECUTE TRANSLATION'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}

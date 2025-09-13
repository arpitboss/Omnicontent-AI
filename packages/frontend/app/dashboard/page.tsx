"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import useSWR from "swr";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import ReactPlayer from "react-player";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ContentBox, GridBackground } from "@/components/ui/grid-background";
import { TranscriptDisplay } from "@/components/transcript-display";
import { TypewriterText } from "@/components/typewriter-text";
import { TypewriterProvider, useTypewriterManager } from "@/context/typewriter-context";
import { CopyButton } from '@/components/copy-button';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

import {
  Download,
  Share2,
  Clock,
  FileText,
  Video,
  TrendingUp,
  Languages,
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
  return <img src={imageUrl} alt={searchTerm} className="rounded-lg my-6" />;
};

// ------------- ContentDisplayCard ---------------
const ContentDisplayCard  = ({
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
    <Card
      key={content._id}
      className="overflow-hidden shadow-lg glass-effect strategic-border"
    >
      {/* ---- Header ---- */}
      <CardHeader className="p-6 bg-gray-100 dark:bg-gray-800 border-b flex-row justify-between items-start">
        <div>
          <CardTitle className="text-2xl gradient-text">
            {content.generatedTitle || "Content is Processing..."}
          </CardTitle>
          <CardDescription className="pt-1">
            Original Source:{" "}
            <a
              href={`http://localhost:8080/api/v1/content/${content._id}/${content.sourceUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-500"
            >
              {content.sourceUrl}
            </a>
          </CardDescription>
        </div>

        <div className="flex items-center space-x-2">
          {currentTranslation && (
            <Button
              variant="outline"
              className="glass-effect"
              onClick={() => setShowTranslation(!showTranslation)}
            >
              {showTranslation ? "Show Original" : "Show Translation"}
            </Button>
          )}
          <Button
            variant={currentTranslation ? "ghost" : "outline"}
            className="glass-effect"
            onClick={() => onTranslateOpen(content._id)}
          >
            <Languages className="mr-2 h-4 w-4" />
            {currentTranslation ? "Change Language" : "Translate"}
          </Button>
        </div>
      </CardHeader>

      {/* ---- Content ---- */}
      <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Left Column ---- */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="font-semibold text-lg gradient-text">Original Video</h3>
          <div className="aspect-video rounded-lg overflow-hidden border">
            <ReactPlayer
              src={`http://localhost:8080/api/v1/content/${content._id}/${content.sourceUrl}`}
              width="100%"
              height="100%"
              controls
            />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg gradient-text">Summary</h3>
            <CopyButton textToCopy={content.summary || ''} />
          </div>
          <TypewriterText
            id={`${content._id}-summary`}
            text={
              showTranslation && currentTranslation?.summary
                ? currentTranslation.summary
                : content.summary || ""
            }
          />
        </div>

        {/* ---- Right Column ---- */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="article" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="article">Article</TabsTrigger>
              <TabsTrigger value="social">Social Posts</TabsTrigger>
              <TabsTrigger value="clips">Clips</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>

            {/* --- Article Tab --- */}
            <TabsContent
              value="article"
              className="mt-4 prose prose-invert max-w-none p-4 border rounded-md"
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
                    return <p {...props} />;
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
            <TabsContent value="social" className="mt-4">
              <Tabs defaultValue="linkedin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
                  <TabsTrigger value="twitter">Twitter</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="linkedin"
                  className="mt-4 p-4 border rounded-md whitespace-pre-wrap text-sm"
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

                <TabsContent value="twitter" className="mt-4 space-y-4">
                  <div className="flex justify-end -mb-4 relative z-10">
                    <CopyButton textToCopy={content.twitterThread?.join('\n\n') || ''} />
                  </div>
                  {content.twitterThread?.map((tweet: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 border rounded-md"
                    >
                      <Avatar>
                        <AvatarFallback>{index + 1}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
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
              className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
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
                      className="border rounded-lg overflow-hidden group transition-all hover:shadow-lg hover:scale-105"
                    >
                      <video
                        controls
                        muted
                        src={clip.s3Url}
                        className="w-full aspect-[9/16] bg-black"
                      />
                      <div className="p-3 bg-gray-100 dark:bg-gray-800">
                        <p className="font-semibold text-sm truncate group-hover:text-blue-600">
                          {clip.title}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2 glass-effect"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {["9:16", "1:1", "4:5"].map((aspect) => {
                              const downloadUrl = getDownloadUrl(aspect);
                              const isProcessing = isJobRunning(aspect);
                              return (
                                <DropdownMenuItem
                                  key={aspect}
                                  disabled={isProcessing}
                                  onClick={() => {
                                    if (downloadUrl) {
                                      window.open(downloadUrl, "_blank");
                                    } else {
                                      onDownload(content._id, clip, aspect);
                                    }
                                  }}
                                >
                                  {isProcessing
                                    ? `Processing ${aspect}...`
                                    : `Download ${aspect}`}
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
                      className="border rounded-lg aspect-[9/16] flex flex-col items-center justify-center bg-red-100 text-red-600"
                    >
                      <p className="font-semibold">Generation Failed</p>
                      <p className="text-xs mt-1">Please try again later.</p>
                    </div>
                  );
                }

                return (
                  <div
                    key={clip._id}
                    className="border rounded-lg aspect-[9/16] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800"
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                      Generating preview...
                    </p>
                  </div>
                );
              })}
            </TabsContent>

            {/* --- Transcript Tab --- */}
            <TabsContent value="transcript" className="mt-4">
              <TranscriptDisplay
                transcript={content.transcript}
                translatedText={showTranslation ? currentTranslation?.transcript : undefined}
                targetLanguage={currentTranslation?.language}
                onShowOriginal={() => setShowTranslation(false)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <GridBackground pattern="subtle-dots" className="relative">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-bold gradient-text mb-4">Content Dashboard</h1>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Manage and track your content atomization projects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                label: 'Completed Projects',
                value: completedProjects,
                icon: FileText,
                color: 'from-green-500/20 to-emerald-500/20',
                iconColor: 'text-green-500',
              },
              {
                label: 'Processing',
                value: processingProjects,
                icon: Clock,
                color: 'from-yellow-500/20 to-orange-500/20',
                iconColor: 'text-yellow-500',
              },
              {
                label: 'Total Clips',
                value: totalClips,
                icon: Video,
                color: 'from-blue-500/20 to-cyan-500/20',
                iconColor: 'text-blue-500',
              },
              {
                label: 'Social Posts',
                value: totalPosts,
                icon: TrendingUp,
                color: 'from-purple-500/20 to-pink-500/20',
                iconColor: 'text-purple-500',
              },
            ].map(({ label, value, icon: Icon, color, iconColor }) => (
              <ContentBox key={label} variant="premium" className={`glass-effect bg-gradient-to-br ${color}`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                    <p className="text-3xl font-bold gradient-text">{value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gray-100/20 dark:bg-gray-800/20 flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </ContentBox>
            ))}
          </div>

          <ContentBox variant="premium" className="glass-effect strategic-border">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold gradient-text">Recent Projects</h2>
              </div>

              <div className="space-y-8">
                {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Loading your generated content...</p>}
                {error && <p className="text-center text-red-500">Failed to load content.</p>}
                {contents?.length === 0 && (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 mx-auto glass-effect rounded-2xl flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold gradient-text">No projects yet</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Start by creating your first content atomization project
                      </p>
                    </div>
                    <Button className="bg-gradient-to-r from-gray-800 to-gray-600 text-white">
                      Create Project
                    </Button>
                  </div>
                )}

                {contents?.map((content) => (
                            <TypewriterProvider key={content._id}>
                                <div className="flex justify-end mb-4">
                                  <Button
                                    variant="outline"
                                    className="glass-effect"
                                    onClick={() => handleExportAll(content._id)}
                                  >
                                    <Download className="mr-2 h-4 w-4" /> Export All
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
          </ContentBox>
        </div>
      </GridBackground>

      <Dialog open={isTranslateDialogOpen} onOpenChange={setIsTranslateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass-effect">
          <DialogHeader>
            <DialogTitle className="gradient-text">Translate Content</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Enter the language you want to translate the content into. The summary, article, transcript, and social posts will all be translated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="language"
              placeholder="e.g., Spanish, Japanese, Hindi"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
              className="glass-effect"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleTranslate} disabled={isTranslating || !targetLanguage} className="bg-gradient-to-r from-gray-800 to-gray-600 text-white">
              {isTranslating ? 'Translating...' : 'Translate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
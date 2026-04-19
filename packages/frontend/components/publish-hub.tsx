"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ExternalLink, Send } from "lucide-react";

// ─────────────────── Platform SVG Icons ───────────────────

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const XTwitterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const MediumIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor">
    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z" />
  </svg>
);

// ─────────────────── Types ───────────────────

interface PublishClip {
  _id: string;
  title: string;
  summary: string;
  s3Url: string;
  status: "PENDING" | "READY" | "FAILED";
}

interface PublishContent {
  _id: string;
  status: string;
  generatedTitle?: string;
  generatedContent?: string;
  linkedinPost?: string;
  twitterThread: string[];
  clips: PublishClip[];
}

interface PublishHubProps {
  content: PublishContent;
}

// ─────────────────── Platform Configs ───────────────────

interface PlatformConfig {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  hoverBg: string;
  type: "text" | "video";
  actionLabel: string;
  description: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: LinkedInIcon,
    color: "text-[#0A66C2]",
    hoverBg: "hover:bg-[#0A66C2]/10",
    type: "text",
    actionLabel: "Share Post",
    description: "Share your LinkedIn post",
  },
  {
    id: "twitter",
    name: "X / Twitter",
    icon: XTwitterIcon,
    color: "text-neutral-900 dark:text-neutral-100",
    hoverBg: "hover:bg-neutral-100 dark:hover:bg-neutral-800",
    type: "text",
    actionLabel: "Post Thread",
    description: "Post your tweet thread",
  },
  {
    id: "medium",
    name: "Medium",
    icon: MediumIcon,
    color: "text-neutral-900 dark:text-neutral-100",
    hoverBg: "hover:bg-neutral-100 dark:hover:bg-neutral-800",
    type: "text",
    actionLabel: "Publish Article",
    description: "Publish your blog article",
  },
  {
    id: "youtube",
    name: "YouTube Shorts",
    icon: YouTubeIcon,
    color: "text-[#FF0000]",
    hoverBg: "hover:bg-[#FF0000]/10",
    type: "video",
    actionLabel: "Upload Short",
    description: "Upload a video clip as a Short",
  },
  {
    id: "instagram",
    name: "Instagram Reels",
    icon: InstagramIcon,
    color: "text-[#E4405F]",
    hoverBg: "hover:bg-[#E4405F]/10",
    type: "video",
    actionLabel: "Post Reel",
    description: "Download clip for Instagram Reels",
  },
];

// ─────────────────── Publish Actions ───────────────────

function publishToLinkedIn(content: PublishContent): boolean {
  if (!content.linkedinPost) {
    toast.error("No LinkedIn post content available.");
    return false;
  }
  navigator.clipboard.writeText(content.linkedinPost);
  window.open("https://www.linkedin.com/feed/?shareActive=true", "_blank");
  toast.success("LinkedIn post copied to clipboard!", {
    duration: 5000,
    description: "Paste it in the LinkedIn compose editor that just opened.",
  });
  return true;
}

function publishToTwitter(content: PublishContent): boolean {
  if (!content.twitterThread || content.twitterThread.length === 0) {
    toast.error("No Twitter thread content available.");
    return false;
  }

  // Clean tweet numbering prefixes (e.g., "1/ ", "2/ ")
  const cleanedThread = content.twitterThread.map((t) =>
    t.replace(/^\d+\/\s*/, "")
  );
  const firstTweet = cleanedThread[0];

  if (cleanedThread.length === 1) {
    // Single tweet — open intent URL directly
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(firstTweet)}`,
      "_blank"
    );
    toast.success("Tweet compose window opened!");
  } else {
    // Thread — copy full thread + open intent with first tweet
    const fullThread = cleanedThread
      .map((t, i) => `${i + 1}/${cleanedThread.length}\n${t}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(fullThread);
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(firstTweet)}`,
      "_blank"
    );
    toast.success("Thread copied to clipboard!", {
      duration: 6000,
      description: `First tweet is pre-filled. Post it, then paste the remaining ${cleanedThread.length - 1} tweets as replies.`,
    });
  }
  return true;
}

function publishToMedium(content: PublishContent): boolean {
  if (!content.generatedContent) {
    toast.error("No article content available.");
    return false;
  }
  navigator.clipboard.writeText(content.generatedContent);
  window.open("https://medium.com/new-story", "_blank");
  toast.success("Article copied to clipboard!", {
    duration: 5000,
    description:
      "Paste it in the Medium editor that just opened. Medium auto-formats Markdown.",
  });
  return true;
}

// ─────────────────── Clip Picker Dialog ───────────────────

function ClipPickerDialog({
  open,
  onOpenChange,
  clips,
  platform,
  contentTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clips: PublishClip[];
  platform: "youtube" | "instagram" | null;
  contentTitle: string;
}) {
  if (!platform) return null;

  const isYouTube = platform === "youtube";
  const platformName = isYouTube ? "YouTube Short" : "Instagram Reel";
  const PlatformIcon = isYouTube ? YouTubeIcon : InstagramIcon;
  const accentColor = isYouTube ? "text-[#FF0000]" : "text-[#E4405F]";
  const accentBorder = isYouTube
    ? "border-[#FF0000]/50 hover:border-[#FF0000]"
    : "border-[#E4405F]/50 hover:border-[#E4405F]";
  const accentBg = isYouTube
    ? "bg-[#FF0000]/10 hover:bg-[#FF0000]/20"
    : "bg-[#E4405F]/10 hover:bg-[#E4405F]/20";

  const handleClipSelect = (clip: PublishClip) => {
    // Trigger download
    const link = document.createElement("a");
    link.href = clip.s3Url;
    link.download = `${contentTitle || "clip"}_${isYouTube ? "short" : "reel"}.mp4`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (isYouTube) {
      // Open YouTube upload page
      window.open("https://www.youtube.com/upload", "_blank");
      toast.success("Clip downloaded! Upload it as a YouTube Short.", {
        duration: 7000,
        description:
          'Add "#Shorts" to the title and use vertical (9:16) format for YouTube to classify it as a Short.',
      });
    } else {
      toast.success("Clip downloaded!", {
        duration: 7000,
        description:
          "Transfer this clip to your phone and upload it as a Reel through the Instagram app.",
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-none border-black dark:border-white bg-white dark:bg-black p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-50 dark:bg-neutral-900 p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-8 h-8 ${isYouTube ? 'bg-[#FF0000]' : 'bg-gradient-to-br from-[#833AB4] via-[#E4405F] to-[#FCAF45]'} flex items-center justify-center rounded-sm`}>
              <PlatformIcon className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="font-bold uppercase tracking-widest text-lg">
              Select Clip for {platformName}
            </DialogTitle>
          </div>
          <DialogDescription className="font-mono text-xs text-neutral-500">
            Choose a clip to download and publish as a{" "}
            {isYouTube ? "YouTube Short" : "Instagram Reel"}.
          </DialogDescription>
        </div>

        {/* Clip Grid */}
        <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
          {clips.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p className="font-mono text-xs uppercase tracking-widest">
                No ready clips available
              </p>
            </div>
          ) : (
            clips.map((clip, index) => (
              <motion.button
                key={clip._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleClipSelect(clip)}
                className={`w-full text-left p-4 border border-neutral-200 dark:border-neutral-800 ${accentBorder} ${accentBg} transition-all duration-200 group cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 ${accentColor} font-mono text-xs font-bold`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">
                        {clip.title}
                      </p>
                      <p className="text-xs text-neutral-500 font-mono truncate">
                        {clip.summary}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className={`w-4 h-4 ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2`} />
                </div>
              </motion.button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────── Main PublishHub Component ───────────────────

export function PublishHub({ content }: PublishHubProps) {
  const [clipPickerOpen, setClipPickerOpen] = useState(false);
  const [clipPickerPlatform, setClipPickerPlatform] = useState<
    "youtube" | "instagram" | null
  >(null);
  const [publishedPlatforms, setPublishedPlatforms] = useState<Set<string>>(
    new Set()
  );

  const readyClips =
    content.clips?.filter((c) => c.status === "READY" && c.s3Url) || [];
  const hasTextContent = !!(
    content.linkedinPost ||
    content.generatedContent ||
    content.twitterThread?.length
  );
  const hasVideoContent = readyClips.length > 0;

  // Don't render if no content is available at all
  if (!hasTextContent && !hasVideoContent) return null;

  const handlePlatformClick = (platformId: string) => {
    let success = false;

    switch (platformId) {
      case "linkedin":
        success = publishToLinkedIn(content);
        break;
      case "twitter":
        success = publishToTwitter(content);
        break;
      case "medium":
        success = publishToMedium(content);
        break;
      case "youtube":
        if (!hasVideoContent) {
          toast.error("No video clips are ready yet. Wait for clips to finish processing.");
          return;
        }
        setClipPickerPlatform("youtube");
        setClipPickerOpen(true);
        success = true;
        break;
      case "instagram":
        if (!hasVideoContent) {
          toast.error("No video clips are ready yet. Wait for clips to finish processing.");
          return;
        }
        setClipPickerPlatform("instagram");
        setClipPickerOpen(true);
        success = true;
        break;
    }

    if (success) {
      setPublishedPlatforms((prev) => new Set(prev).add(platformId));
    }
  };

  const isPlatformDisabled = (platform: PlatformConfig): boolean => {
    if (platform.type === "video") return !hasVideoContent;
    switch (platform.id) {
      case "linkedin":
        return !content.linkedinPost;
      case "twitter":
        return !content.twitterThread || content.twitterThread.length === 0;
      case "medium":
        return !content.generatedContent;
      default:
        return false;
    }
  };

  const textPlatforms = PLATFORMS.filter((p) => p.type === "text");
  const videoPlatforms = PLATFORMS.filter((p) => p.type === "video");

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            className="rounded-none bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400 font-mono text-xs uppercase tracking-widest h-9 px-5 transition-all duration-300 shadow-md hover:shadow-emerald-500/25 cursor-pointer group"
          >
            <Send className="mr-2 h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            Publish
            {publishedPlatforms.size > 0 && (
              <span className="ml-2 bg-white/20 dark:bg-black/20 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {publishedPlatforms.size}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="bottom"
          align="end"
          className="rounded-none border-neutral-200 dark:border-neutral-800 min-w-[260px] p-0 z-50 bg-white dark:bg-black"
        >
          {/* Text Platforms */}
          <DropdownMenuLabel className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            Text Content
          </DropdownMenuLabel>

          {textPlatforms.map((platform) => {
            const isPublished = publishedPlatforms.has(platform.id);
            const isDisabled = isPlatformDisabled(platform);
            const Icon = platform.icon;

            return (
              <DropdownMenuItem
                key={platform.id}
                disabled={isDisabled}
                onClick={() => handlePlatformClick(platform.id)}
                className={`rounded-none px-4 py-3 cursor-pointer transition-all duration-200 ${platform.hoverBg} focus:bg-neutral-50 dark:focus:bg-neutral-900 ${
                  isDisabled ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className={`${platform.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{platform.name}</p>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {platform.actionLabel}
                      </p>
                    </div>
                  </div>
                  {isPublished ? (
                    <div className="flex items-center gap-1 text-emerald-500">
                      <Check className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-bold">
                        SENT
                      </span>
                    </div>
                  ) : (
                    !isDisabled && (
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                    )
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800 my-0" />

          {/* Video Platforms */}
          <DropdownMenuLabel className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            Video Clips
            {hasVideoContent && (
              <span className="ml-2 text-emerald-500">
                {readyClips.length} ready
              </span>
            )}
          </DropdownMenuLabel>

          {videoPlatforms.map((platform) => {
            const isPublished = publishedPlatforms.has(platform.id);
            const isDisabled = isPlatformDisabled(platform);
            const Icon = platform.icon;

            return (
              <DropdownMenuItem
                key={platform.id}
                disabled={isDisabled}
                onClick={() => handlePlatformClick(platform.id)}
                className={`rounded-none px-4 py-3 cursor-pointer transition-all duration-200 ${platform.hoverBg} focus:bg-neutral-50 dark:focus:bg-neutral-900 ${
                  isDisabled ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className={`${platform.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{platform.name}</p>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {platform.actionLabel}
                      </p>
                    </div>
                  </div>
                  {isPublished ? (
                    <div className="flex items-center gap-1 text-emerald-500">
                      <Check className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-bold">
                        SENT
                      </span>
                    </div>
                  ) : (
                    !isDisabled && (
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                    )
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clip Picker Dialog */}
      <ClipPickerDialog
        open={clipPickerOpen}
        onOpenChange={setClipPickerOpen}
        clips={readyClips}
        platform={clipPickerPlatform}
        contentTitle={content.generatedTitle || "clip"}
      />
    </>
  );
}

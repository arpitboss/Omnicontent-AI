"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import useSWR from "swr";
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
import {
  Check,
  ExternalLink,
  Link2,
  Loader2,
  Send,
  Settings,
  Unplug,
} from "lucide-react";

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

interface PublishRecord {
  platform: string;
  publishedAt: string;
  postUrl: string;
  status: "SUCCESS" | "FAILED";
}

interface PublishContent {
  _id: string;
  status: string;
  generatedTitle?: string;
  generatedContent?: string;
  summary?: string;
  linkedinPost?: string;
  twitterThread: string[];
  clips: PublishClip[];
  publishHistory?: PublishRecord[];
}

interface SocialAccount {
  _id: string;
  platform: string;
  profileName: string;
  profileImageUrl: string;
}

interface PublishHubProps {
  content: PublishContent;
  onPublished?: () => void; // callback to trigger content refresh
}

// ─────────────────── API Helpers ───────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ─────────────────── Workaround Actions ───────────────────

function publishToTwitter(content: PublishContent): boolean {
  if (!content.twitterThread || content.twitterThread.length === 0) {
    toast.error("No Twitter thread content available.");
    return false;
  }
  const cleanedThread = content.twitterThread.map((t) => t.replace(/^\d+\/\s*/, ""));
  const firstTweet = cleanedThread[0];
  if (cleanedThread.length === 1) {
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(firstTweet)}`, "_blank");
    toast.success("Tweet compose window opened!");
  } else {
    const fullThread = cleanedThread.map((t, i) => `${i + 1}/${cleanedThread.length}\n${t}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(fullThread);
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(firstTweet)}`, "_blank");
    toast.success("Thread copied to clipboard!", {
      duration: 6000,
      description: `First tweet is pre-filled. Post it, then paste remaining ${cleanedThread.length - 1} tweets as replies.`,
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
    description: "Paste it in the Medium editor that just opened.",
  });
  return true;
}

function publishToInstagram(clip: PublishClip, contentTitle: string): void {
  const link = document.createElement("a");
  link.href = clip.s3Url;
  link.download = `${contentTitle || "clip"}_reel.mp4`;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
  toast.success("Clip downloaded!", {
    duration: 7000,
    description: "Transfer this clip to your phone and upload it as a Reel through the Instagram app.",
  });
}

// ─────────────────── Clip Picker Dialog ───────────────────

function ClipPickerDialog({
  open,
  onOpenChange,
  clips,
  platform,
  contentTitle,
  contentId,
  onPublished,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clips: PublishClip[];
  platform: "youtube" | "instagram" | null;
  contentTitle: string;
  contentId: string;
  onPublished?: () => void;
}) {
  const { getToken } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);

  if (!platform) return null;

  const isYouTube = platform === "youtube";
  const PlatformIcon = isYouTube ? YouTubeIcon : InstagramIcon;
  const accentBorder = isYouTube
    ? "border-[#FF0000]/30 hover:border-[#FF0000]"
    : "border-[#E4405F]/30 hover:border-[#E4405F]";

  const handleClipSelect = async (clip: PublishClip) => {
    if (platform === "instagram") {
      publishToInstagram(clip, contentTitle);
      onOpenChange(false);
      return;
    }

    // YouTube: direct API upload
    setUploading(clip._id);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/publish/youtube/${contentId}/${clip._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to upload to YouTube.");
        return;
      }
      toast.success("Published to YouTube Shorts!", {
        duration: 8000,
        description: data.postUrl ? (
          <a href={data.postUrl} target="_blank" rel="noopener noreferrer" className="underline">
            View your Short →
          </a>
        ) : undefined,
      });
      onPublished?.();
      onOpenChange(false);
    } catch {
      toast.error("Failed to upload to YouTube.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-none border-black dark:border-white bg-white dark:bg-black p-0 overflow-hidden">
        <div className="bg-neutral-50 dark:bg-neutral-900 p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-8 h-8 ${isYouTube ? "bg-[#FF0000]" : "bg-gradient-to-br from-[#833AB4] via-[#E4405F] to-[#FCAF45]"} flex items-center justify-center rounded-sm`}>
              <PlatformIcon className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="font-bold uppercase tracking-widest text-lg">
              Select Clip
            </DialogTitle>
          </div>
          <DialogDescription className="font-mono text-xs text-neutral-500">
            {isYouTube
              ? "Choose a clip to upload directly to your YouTube channel as a Short."
              : "Choose a clip to download for Instagram Reels."}
          </DialogDescription>
        </div>

        <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
          {clips.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p className="font-mono text-xs uppercase tracking-widest">No ready clips</p>
            </div>
          ) : (
            clips.map((clip, index) => (
              <motion.button
                key={clip._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleClipSelect(clip)}
                disabled={uploading !== null}
                className={`w-full text-left p-4 border ${accentBorder} transition-all duration-200 group cursor-pointer disabled:opacity-50 disabled:cursor-wait bg-white dark:bg-black hover:bg-neutral-50 dark:hover:bg-neutral-900`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 font-mono text-xs font-bold`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{clip.title}</p>
                      <p className="text-xs text-neutral-500 font-mono truncate">{clip.summary}</p>
                    </div>
                  </div>
                  {uploading === clip._id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-400 flex-shrink-0" />
                  ) : (
                    <ExternalLink className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                  )}
                </div>
              </motion.button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────── Account Manager Dialog ───────────────────

function AccountManagerDialog({
  open,
  onOpenChange,
  accounts,
  onConnect,
  onDisconnect,
  connecting,
  disconnecting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: SocialAccount[];
  onConnect: (platform: string) => void;
  onDisconnect: (platform: string) => void;
  connecting: string | null;
  disconnecting: string | null;
}) {
  const directPlatforms = [
    { id: "linkedin", name: "LinkedIn", icon: LinkedInIcon, color: "bg-[#0A66C2]", desc: "Post directly to your LinkedIn feed" },
    { id: "youtube", name: "YouTube", icon: YouTubeIcon, color: "bg-[#FF0000]", desc: "Upload Shorts to your channel" },
  ];

  const workaroundPlatforms = [
    { id: "twitter", name: "X / Twitter", icon: XTwitterIcon, desc: "Pre-filled via Web Intent" },
    { id: "medium", name: "Medium", icon: MediumIcon, desc: "Copy article to clipboard" },
    { id: "instagram", name: "Instagram", icon: InstagramIcon, desc: "Download clip for mobile upload" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-none border-black dark:border-white bg-white dark:bg-black p-0 overflow-hidden">
        <div className="bg-neutral-50 dark:bg-neutral-900 p-6 border-b border-neutral-200 dark:border-neutral-800">
          <DialogTitle className="font-bold uppercase tracking-widest text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" /> Manage Accounts
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-neutral-500 mt-1">
            Connect your accounts for one-click direct publishing.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6">
          {/* Direct API Platforms */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-3">
              Direct Publishing
            </p>
            <div className="space-y-2">
              {directPlatforms.map((p) => {
                const connected = accounts.find((a) => a.platform === p.id);
                const Icon = p.icon;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-4 border transition-all ${
                      connected
                        ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10"
                        : "border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 ${p.color} flex items-center justify-center rounded-sm`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{p.name}</p>
                        {connected ? (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                            <Check className="w-3 h-3" /> {connected.profileName}
                          </p>
                        ) : (
                          <p className="text-[10px] text-neutral-500 font-mono">{p.desc}</p>
                        )}
                      </div>
                    </div>
                    {connected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={disconnecting === p.id}
                        onClick={() => onDisconnect(p.id)}
                        className="rounded-none text-xs font-mono text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        {disconnecting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unplug className="w-3 h-3 mr-1" />}
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={connecting !== null}
                        onClick={() => onConnect(p.id)}
                        className="rounded-none text-xs font-mono border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 hover:text-emerald-600"
                      >
                        {connecting === p.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                        Connect
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workaround Platforms */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-3">
              Assisted Sharing <span className="text-neutral-300 dark:text-neutral-600">— no account needed</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {workaroundPlatforms.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2 border border-dashed border-neutral-200 dark:border-neutral-800">
                    <Icon className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-xs font-mono text-neutral-500">{p.name}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-neutral-400 font-mono mt-2">
              These platforms use smart sharing — content is copied/pre-filled for you.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────── Main PublishHub Component ───────────────────

export function PublishHub({ content, onPublished }: PublishHubProps) {
  const { getToken } = useAuth();

  const [clipPickerOpen, setClipPickerOpen] = useState(false);
  const [clipPickerPlatform, setClipPickerPlatform] = useState<"youtube" | "instagram" | null>(null);
  const [accountsDialogOpen, setAccountsDialogOpen] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Fetch connected accounts
  const accountsFetcher = useCallback(
    async (url: string) => {
      const token = await getToken();
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return [];
      return res.json();
    },
    [getToken]
  );

  const { data: accounts = [], mutate: mutateAccounts } = useSWR<SocialAccount[]>(
    `${API_URL}/api/v1/publish/accounts`,
    accountsFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const readyClips = content.clips?.filter((c) => c.status === "READY" && c.s3Url) || [];
  const hasTextContent = !!(content.linkedinPost || content.generatedContent || content.twitterThread?.length);
  const hasVideoContent = readyClips.length > 0;

  if (!hasTextContent && !hasVideoContent) return null;

  // Check which platforms have been published to
  const publishedTo = new Set(
    content.publishHistory
      ?.filter((r) => r.status === "SUCCESS")
      .map((r) => r.platform) || []
  );

  const isConnected = (platform: string) => accounts.some((a) => a.platform === platform);

  // ─── Connect Account ───
  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/publish/connect/${platform}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to start connection.");
        return;
      }
      // Redirect to OAuth provider
      window.location.href = data.authUrl;
    } catch {
      toast.error("Failed to connect account.");
    } finally {
      setConnecting(null);
    }
  };

  // ─── Disconnect Account ───
  const handleDisconnect = async (platform: string) => {
    setDisconnecting(platform);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/publish/disconnect/${platform}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        toast.error("Failed to disconnect account.");
        return;
      }
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected.`);
      mutateAccounts();
    } catch {
      toast.error("Failed to disconnect account.");
    } finally {
      setDisconnecting(null);
    }
  };

  // ─── Direct Publish: LinkedIn ───
  const handleLinkedInPublish = async () => {
    if (!isConnected("linkedin")) {
      handleConnect("linkedin");
      return;
    }
    setPublishing("linkedin");
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/publish/linkedin/${content._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to publish to LinkedIn.");
        return;
      }
      toast.success("Published to LinkedIn!", {
        duration: 8000,
        description: data.postUrl ? (
          <a href={data.postUrl} target="_blank" rel="noopener noreferrer" className="underline">
            View your post →
          </a>
        ) : "Your post is live on LinkedIn.",
      });
      onPublished?.();
    } catch {
      toast.error("Failed to publish to LinkedIn.");
    } finally {
      setPublishing(null);
    }
  };

  // ─── Direct Publish: YouTube ───
  const handleYouTubePublish = () => {
    if (!isConnected("youtube")) {
      handleConnect("youtube");
      return;
    }
    if (!hasVideoContent) {
      toast.error("No video clips are ready yet.");
      return;
    }
    setClipPickerPlatform("youtube");
    setClipPickerOpen(true);
  };

  // ─── Workaround Handlers ───
  const handleTwitterPublish = () => publishToTwitter(content);
  const handleMediumPublish = () => publishToMedium(content);
  const handleInstagramPublish = () => {
    if (!hasVideoContent) {
      toast.error("No video clips are ready yet.");
      return;
    }
    setClipPickerPlatform("instagram");
    setClipPickerOpen(true);
  };

  // ─── Platform Menu Items Config ───
  const menuItems = [
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: LinkedInIcon,
      color: "text-[#0A66C2]",
      hoverBg: "hover:bg-[#0A66C2]/10",
      type: "direct" as const,
      action: handleLinkedInPublish,
      disabled: !content.linkedinPost,
      connected: isConnected("linkedin"),
      published: publishedTo.has("linkedin"),
    },
    {
      id: "twitter",
      name: "X / Twitter",
      icon: XTwitterIcon,
      color: "text-neutral-900 dark:text-neutral-100",
      hoverBg: "hover:bg-neutral-100 dark:hover:bg-neutral-800",
      type: "workaround" as const,
      action: handleTwitterPublish,
      disabled: !content.twitterThread?.length,
      connected: false,
      published: false,
    },
    {
      id: "medium",
      name: "Medium",
      icon: MediumIcon,
      color: "text-neutral-900 dark:text-neutral-100",
      hoverBg: "hover:bg-neutral-100 dark:hover:bg-neutral-800",
      type: "workaround" as const,
      action: handleMediumPublish,
      disabled: !content.generatedContent,
      connected: false,
      published: false,
    },
    {
      id: "youtube",
      name: "YouTube Shorts",
      icon: YouTubeIcon,
      color: "text-[#FF0000]",
      hoverBg: "hover:bg-[#FF0000]/10",
      type: "direct" as const,
      action: handleYouTubePublish,
      disabled: !hasVideoContent,
      connected: isConnected("youtube"),
      published: publishedTo.has("youtube"),
    },
    {
      id: "instagram",
      name: "Instagram Reels",
      icon: InstagramIcon,
      color: "text-[#E4405F]",
      hoverBg: "hover:bg-[#E4405F]/10",
      type: "workaround" as const,
      action: handleInstagramPublish,
      disabled: !hasVideoContent,
      connected: false,
      published: false,
    },
  ];

  const textItems = menuItems.filter((m) => ["linkedin", "twitter", "medium"].includes(m.id));
  const videoItems = menuItems.filter((m) => ["youtube", "instagram"].includes(m.id));
  const connectedCount = accounts.length;
  const publishedCount = publishedTo.size;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-none bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400 font-mono text-xs uppercase tracking-widest h-9 px-5 transition-all duration-300 shadow-md hover:shadow-emerald-500/25 cursor-pointer group">
            <Send className="mr-2 h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            Publish
            {publishedCount > 0 && (
              <span className="ml-2 bg-white/25 dark:bg-black/25 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {publishedCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="bottom"
          align="end"
          className="rounded-none border-neutral-200 dark:border-neutral-800 min-w-[280px] p-0 z-50 bg-white dark:bg-black"
        >
          {/* Connected indicator */}
          {connectedCount > 0 && (
            <>
              <div className="px-4 py-2 bg-emerald-50/80 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-900">
                <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {connectedCount} account{connectedCount > 1 ? "s" : ""} connected — direct publishing enabled
                </p>
              </div>
            </>
          )}

          {/* Text Platforms */}
          <DropdownMenuLabel className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            Text Content
          </DropdownMenuLabel>

          {textItems.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.id}
                disabled={item.disabled || publishing === item.id}
                onClick={item.action}
                className={`rounded-none px-4 py-3 cursor-pointer transition-all duration-200 ${item.hoverBg} ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className={item.color}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        {item.name}
                        {item.connected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {item.connected ? "Direct post" : item.type === "workaround" ? "Smart share" : "Connect to post"}
                      </p>
                    </div>
                  </div>
                  {publishing === item.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                  ) : item.published ? (
                    <div className="flex items-center gap-1 text-emerald-500">
                      <Check className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-bold">POSTED</span>
                    </div>
                  ) : !item.disabled ? (
                    item.connected ? (
                      <Send className="w-3.5 h-3.5 text-neutral-400" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                    )
                  ) : null}
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800 my-0" />

          {/* Video Platforms */}
          <DropdownMenuLabel className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            Video Clips
            {hasVideoContent && (
              <span className="ml-2 text-emerald-500">{readyClips.length} ready</span>
            )}
          </DropdownMenuLabel>

          {videoItems.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.id}
                disabled={item.disabled || publishing === item.id}
                onClick={item.action}
                className={`rounded-none px-4 py-3 cursor-pointer transition-all duration-200 ${item.hoverBg} ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className={item.color}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        {item.name}
                        {item.connected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {item.connected ? "Direct upload" : item.type === "workaround" ? "Download clip" : "Connect to upload"}
                      </p>
                    </div>
                  </div>
                  {publishing === item.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                  ) : item.published ? (
                    <div className="flex items-center gap-1 text-emerald-500">
                      <Check className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-bold">POSTED</span>
                    </div>
                  ) : !item.disabled ? (
                    item.connected ? (
                      <Send className="w-3.5 h-3.5 text-neutral-400" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                    )
                  ) : null}
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800 my-0" />

          {/* Manage Accounts */}
          <DropdownMenuItem
            onClick={() => setAccountsDialogOpen(true)}
            className="rounded-none px-4 py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <div className="flex items-center gap-3 w-full">
              <Settings className="w-4 h-4 text-neutral-400" />
              <p className="text-sm font-mono text-neutral-500">Manage Accounts</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clip Picker */}
      <ClipPickerDialog
        open={clipPickerOpen}
        onOpenChange={setClipPickerOpen}
        clips={readyClips}
        platform={clipPickerPlatform}
        contentTitle={content.generatedTitle || "clip"}
        contentId={content._id}
        onPublished={onPublished}
      />

      {/* Account Manager */}
      <AccountManagerDialog
        open={accountsDialogOpen}
        onOpenChange={setAccountsDialogOpen}
        accounts={accounts}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        connecting={connecting}
        disconnecting={disconnecting}
      />
    </>
  );
}

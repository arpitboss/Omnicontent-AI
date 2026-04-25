"use client";

import { 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube, 
  Music2, 
  MessageCircle, 
  FileText,
  Share2
} from "lucide-react";
import { InfiniteMovingCards } from "./ui/infinite-moving-cards";

export function PlatformsMarquee() {
  const platforms = [
    {
      name: "LinkedIn",
      icon: <Linkedin className="w-5 h-5" />,
    },
    {
      name: "Twitter / X",
      icon: <Twitter className="w-5 h-5" />,
    },
    {
      name: "Instagram",
      icon: <Instagram className="w-5 h-5" />,
    },
    {
      name: "YouTube",
      icon: <Youtube className="w-5 h-5" />,
    },
    {
      name: "TikTok",
      icon: <Music2 className="w-5 h-5" />,
    },
    {
      name: "Medium",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      name: "Threads",
      icon: <MessageCircle className="w-5 h-5" />,
    },
    {
      name: "Substack",
      icon: <Share2 className="w-5 h-5" />,
    },
  ];

  return (
    <div className="w-full bg-background/50 border-y border-border/50 py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
          Native distribution to your favorite platforms
        </p>
      </div>
      <InfiniteMovingCards
        items={platforms}
        direction="right"
        speed="slow"
        className="max-w-full"
      />
    </div>
  );
}

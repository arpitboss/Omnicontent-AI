"use client";

import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Brand mark (matches header) ───────────────────── */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d="M5.6 22.5 A12 12 0 0 1 5.6 9.5" stroke="currentColor" strokeOpacity="0.32" strokeWidth="2" strokeLinecap="round" />
      <path d="M26.4 9.5 A12 12 0 0 1 26.4 22.5" stroke="currentColor" strokeOpacity="0.32" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.4 20.5 A7 7 0 0 1 9.4 11.5" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
      <path d="M22.6 11.5 A7 7 0 0 1 22.6 20.5" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 12.4 L20.5 16 L14 19.6 Z" fill="currentColor" />
    </svg>
  );
}

/* ─── Quiet grid texture (replaces noisy Meteors) ─── */
function GridTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.5] dark:opacity-[0.35]"
      style={{
        maskImage:
          "radial-gradient(60% 50% at 50% 30%, black 0%, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(60% 50% at 50% 30%, black 0%, transparent 75%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 4%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

/* ─── Status pill — fetches /api/status ─────────────── */
type SystemStatus = "operational" | "degraded" | "down";
interface StatusResponse {
  status: SystemStatus;
  updatedAt: string;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("status fetch failed");
    return r.json() as Promise<StatusResponse>;
  });

const STATUS_META: Record<
  SystemStatus,
  { label: string; dot: string; ring: string; text: string }
> = {
  operational: {
    label: "All systems operational",
    dot: "bg-brand",
    ring: "ring-brand/30",
    text: "text-foreground/80",
  },
  degraded: {
    label: "Partial degradation",
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    text: "text-foreground/80",
  },
  down: {
    label: "Major incident",
    dot: "bg-destructive",
    ring: "ring-destructive/30",
    text: "text-foreground/80",
  },
};

function StatusPill() {
  const { data, error } = useSWR<StatusResponse>("/api/status", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });

  const status: SystemStatus = error
    ? "down"
    : (data?.status ?? "operational");
  const meta = STATUS_META[status];
  const updated = data?.updatedAt ? new Date(data.updatedAt) : null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/status"
            className={cn(
              "inline-flex items-center gap-2 h-7 pl-2 pr-3 rounded-full",
              "border border-border text-[12px]",
              "transition-colors duration-200 hover:border-foreground/20",
              meta.text
            )}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping",
                  meta.dot
                )}
              />
              <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", meta.dot)} />
            </span>
            {meta.label}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {updated
            ? `Updated ${formatRelative(updated)}`
            : "Checking status…"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatRelative(d: Date): string {
  const seconds = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString();
}

/* ─── Footer ─────────────────────────────────────── */
const FOOTER_LINKS = {
  Product: [
    { name: "Features", href: "/#features" },
    { name: "How it works", href: "/#how-it-works" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Create", href: "/create" },
  ],
  Resources: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Status", href: "/status" },
    { name: "Contact", href: "mailto:hello@omnicontent.ai" },
  ],
  Legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ],
} as const;

export function Footer() {
  const ctaRef = React.useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" });
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24">
      {/* ── CTA band ─────────────────────────────────── */}
      <section
        ref={ctaRef}
        className="relative border-t border-border overflow-hidden"
      >
        <GridTexture />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[80%] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, var(--accent-glow), transparent 70%)",
          }}
        />
        <div className="container-page relative py-24 md:py-28 text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease }}
            className="eyebrow mb-5"
          >
            Get started in minutes
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease, delay: 0.05 }}
            className="display max-w-3xl mx-auto"
          >
            Ship content faster.
            <br />
            <span className="text-muted-foreground">Everywhere at once.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease, delay: 0.12 }}
            className="section-lede mx-auto mt-6"
          >
            Atomize one upload into clips, articles, and platform-native posts —
            in your voice, at your pace.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease, delay: 0.2 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/create">
              <Button
                className={cn(
                  "h-10 px-5 rounded-md text-[13.5px] font-medium",
                  "bg-foreground text-background hover:opacity-92",
                  "transition-[opacity,transform] duration-200 active:translate-y-px",
                  "group"
                )}
              >
                Start for free
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Button>
            </Link>
            <Link href="/#how-it-works">
              <Button
                variant="ghost"
                className="h-10 px-4 rounded-md text-[13.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                See how it works
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Link grid ─────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="container-page py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
            {/* Brand block */}
            <div className="col-span-2 md:col-span-2">
              <Link href="/" className="inline-flex items-center gap-2">
                <LogoMark className="h-6 w-6 text-foreground" />
                <span className="font-heading text-[15px] font-semibold tracking-[-0.02em]">
                  OmniContent
                </span>
              </Link>
              <p className="mt-4 text-[13.5px] leading-6 text-muted-foreground max-w-[28ch]">
                AI-native content distribution for creators and teams.
              </p>
              <div className="mt-5">
                <StatusPill />
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <h3 className="eyebrow mb-4">{heading}</h3>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-[13.5px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="mt-14 pt-6 border-t border-border flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[12.5px] text-muted-foreground">
              © {year} OmniContent. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5">
              <SocialLink href="https://twitter.com" label="Twitter / X">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialLink>
              <SocialLink href="https://linkedin.com" label="LinkedIn">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </SocialLink>
              <SocialLink href="https://github.com" label="GitHub">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.16 1.18a10.95 10.95 0 0 1 5.75 0c2.2-1.49 3.16-1.18 3.16-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.68.8.56C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z" />
                </svg>
              </SocialLink>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center h-8 w-8 rounded-md",
        "text-muted-foreground hover:text-foreground",
        "border border-transparent hover:border-border",
        "transition-colors duration-200"
      )}
    >
      {children}
    </Link>
  );
}

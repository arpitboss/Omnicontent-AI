"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ListChecks, X, Upload, Pencil, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentLike {
  status: string;
  publishHistory?: { status: string }[];
}

const DISMISS_KEY = "omnicontent_onboarding_dismissed";

/**
 * First-run "Getting started" checklist. Tracks the activation funnel
 * (create → atomize → publish) from the user's real data, is dismissible
 * (persisted to localStorage), and auto-hides once every step is complete.
 */
export function OnboardingChecklist({ contents }: { contents?: ContentLike[] }) {
  // Start hidden to avoid a flash before we can read localStorage / data.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  // Wait until content has loaded so returning users don't see a flicker.
  if (contents === undefined) return null;

  const hasProject = contents.length > 0;
  const hasCompleted = contents.some((c) => c.status === "COMPLETE");
  const hasPublished = contents.some((c) =>
    c.publishHistory?.some((p) => p.status === "SUCCESS")
  );

  const steps = [
    {
      key: "create",
      label: "Create your first project",
      desc: "Paste a YouTube link or upload a video.",
      done: hasProject,
      icon: Upload,
      href: "/create" as string | undefined,
      cta: "Create" as string | undefined,
    },
    {
      key: "atomize",
      label: "Let the AI atomize it",
      desc: "We generate clips, an article, and social posts.",
      done: hasCompleted,
      icon: Pencil,
      href: undefined,
      cta: undefined,
    },
    {
      key: "publish",
      label: "Publish to a platform",
      desc: "Connect LinkedIn, YouTube, or X and ship it.",
      done: hasPublished,
      icon: Send,
      href: undefined,
      cta: undefined,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  if (dismissed || allDone) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      /* ignore storage errors */
    }
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 rounded-2xl border border-[var(--accent-500)]/30 bg-gradient-to-b from-[var(--accent-500)]/[0.06] to-transparent p-6"
    >
      <button
        onClick={handleDismiss}
        aria-label="Dismiss getting started checklist"
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 mb-1">
        <ListChecks className="w-4 h-4 text-[var(--accent-500)]" />
        <h3 className="text-base font-semibold tracking-tight">Getting started</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        {completedCount} of {steps.length} done — finish setup to ship your first post.
      </p>

      <div className="h-1.5 w-full rounded-full bg-border mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-[var(--accent-500)]"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <ol className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <li key={step.key} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                  step.done
                    ? "border-[var(--accent-500)] bg-[var(--accent-500)] text-background"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {step.done ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done && "text-muted-foreground line-through"
                  )}
                >
                  {step.label}
                </p>
                {!step.done && <p className="text-xs text-muted-foreground">{step.desc}</p>}
              </div>
              {!step.done && step.href && step.cta && (
                <Link href={step.href}>
                  <span className="text-xs font-semibold text-[var(--accent-500)] hover:underline whitespace-nowrap">
                    {step.cta} →
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </motion.div>
  );
}

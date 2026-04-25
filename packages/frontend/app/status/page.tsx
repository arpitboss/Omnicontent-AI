"use client";

import * as React from "react";
import useSWR from "swr";
import { motion } from "framer-motion";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";

interface StatusResponse {
  status: "operational" | "degraded" | "down";
  updatedAt: string;
  latencyMs?: number;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<StatusResponse>);

const SERVICES = [
  { name: "Web app", endpoint: "/api/status", label: "Frontend & API gateway" },
  { name: "Atomization API", endpoint: "/api/status", label: "Backend pipeline" },
  { name: "Worker queue", endpoint: "/api/status", label: "Async transcoding" },
  { name: "Object storage", endpoint: "/api/status", label: "Cloudinary CDN" },
] as const;

const META: Record<
  StatusResponse["status"],
  { label: string; dot: string; surface: string; text: string }
> = {
  operational: {
    label: "Operational",
    dot: "bg-brand",
    surface: "bg-brand/8 border-brand/25",
    text: "text-brand",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-amber-500",
    surface: "bg-amber-500/8 border-amber-500/25",
    text: "text-amber-500",
  },
  down: {
    label: "Major outage",
    dot: "bg-destructive",
    surface: "bg-destructive/8 border-destructive/25",
    text: "text-destructive",
  },
};

export default function StatusPage() {
  const { data } = useSWR<StatusResponse>("/api/status", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
  const overall: StatusResponse["status"] = data?.status ?? "operational";
  const meta = META[overall];

  return (
    <>
      <Header />
      <main className="relative pt-32 pb-24 min-h-screen">
        <div className="container-page max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="eyebrow mb-3">System status</p>
            <h1 className="section-title">
              {overall === "operational"
                ? "All systems are operational."
                : overall === "degraded"
                  ? "We're seeing some degradation."
                  : "We're experiencing a major incident."}
            </h1>
            <p className="section-lede mt-5">
              Real-time health of every component of the OmniContent platform.
              Updated every 30 seconds.
            </p>
          </motion.div>

          <div className="mt-12 rounded-xl border border-border bg-card overflow-hidden">
            <div className={cn("flex items-center justify-between px-5 py-4 border-b border-border", meta.surface)}>
              <div className="inline-flex items-center gap-2.5">
                <span className={cn("h-2 w-2 rounded-full animate-pulse", meta.dot)} />
                <span className={cn("text-[13.5px] font-medium", meta.text)}>
                  {meta.label}
                </span>
              </div>
              {data?.latencyMs !== undefined && (
                <span className="font-mono text-[11.5px] text-muted-foreground">
                  {data.latencyMs}ms
                </span>
              )}
            </div>
            <ul>
              {SERVICES.map((svc) => (
                <li
                  key={svc.name}
                  className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-[14px] font-medium text-foreground">
                      {svc.name}
                    </p>
                    <p className="text-[12.5px] text-muted-foreground">
                      {svc.label}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
                    <span className={cn("h-1.5 w-1.5 rounded-full", META[overall].dot)} />
                    {META[overall].label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {data?.updatedAt && (
            <p className="mt-6 text-[12px] text-muted-foreground font-mono">
              Last checked {new Date(data.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

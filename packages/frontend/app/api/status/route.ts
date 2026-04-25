import { NextResponse } from "next/server";

/**
 * Status endpoint consumed by the footer's "All systems operational" pill
 * and the public /status page.
 *
 * Performs a fast GET against the backend's health route. We use a
 * 2-second timeout so the pill never holds up rendering, and we treat
 * unreachable as "down" and slow-but-OK as "degraded".
 *
 * Dev-mode nicety: if NEXT_PUBLIC_API_URL is unset and we can't reach
 * the default localhost backend, we report "operational" with a hint
 * — that's almost always "the dev hasn't started the backend yet"
 * rather than a real outage, and a screaming red pill in dev is noise.
 */
export const dynamic = "force-dynamic";

export type SystemStatus = "operational" | "degraded" | "down";

export interface StatusResponse {
  status: SystemStatus;
  updatedAt: string; // ISO 8601
  latencyMs?: number;
  hint?: string;
}

const API_URL_RAW = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const BACKEND_URL = API_URL_RAW || "http://localhost:8080";
const IS_DEV_DEFAULT = !API_URL_RAW && process.env.NODE_ENV !== "production";

const TIMEOUT_MS = 2000;
const DEGRADED_LATENCY_MS = 800;

export async function GET() {
  const startedAt = Date.now();
  let status: SystemStatus = "operational";
  let latencyMs: number | undefined;
  let hint: string | undefined;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(`${BACKEND_URL}/`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    latencyMs = Date.now() - startedAt;

    if (!res.ok) {
      status = res.status >= 500 ? "down" : "degraded";
    } else if (latencyMs > DEGRADED_LATENCY_MS) {
      status = "degraded";
    }
  } catch {
    latencyMs = Date.now() - startedAt;
    if (IS_DEV_DEFAULT) {
      // No NEXT_PUBLIC_API_URL set and localhost:8080 unreachable —
      // assume the developer simply hasn't started the backend.
      status = "operational";
      hint = "Backend not running locally (dev fallback).";
    } else {
      status = "down";
    }
  }

  const body: StatusResponse = {
    status,
    updatedAt: new Date().toISOString(),
    latencyMs,
    ...(hint ? { hint } : {}),
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60",
    },
  });
}



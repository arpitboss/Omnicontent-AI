"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, AudioLines, Save, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");
const MAX_SAMPLES = 5;

/**
 * Brand-voice editor. Loads the user's saved samples + style notes and saves them back.
 * These feed into the generation prompt so output sounds like the creator, not generic AI.
 */
export function BrandVoiceCard() {
  const { getToken } = useAuth();
  const [samples, setSamples] = React.useState<string[]>([""]);
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${apiBase}/api/v1/voice`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok && active) {
          const data = await res.json();
          setSamples(Array.isArray(data.samples) && data.samples.length ? data.samples : [""]);
          setDescription(data.description || "");
        }
      } catch {
        /* ignore — first-time users simply have no profile yet */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [getToken]);

  const updateSample = (i: number, val: string) =>
    setSamples((prev) => prev.map((s, idx) => (idx === i ? val : s)));
  const addSample = () =>
    setSamples((prev) => (prev.length < MAX_SAMPLES ? [...prev, ""] : prev));
  const removeSample = (i: number) =>
    setSamples((prev) => (prev.length === 1 ? [""] : prev.filter((_, idx) => idx !== i)));

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const cleanSamples = samples.map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`${apiBase}/api/v1/voice`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ samples: cleanSamples, description: description.trim(), enabled: true }),
      });
      if (!res.ok) throw new Error((await res.text().catch(() => "")) || "Failed to save.");
      toast.success("Brand voice saved — your next generations will sound like you.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save brand voice.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filledCount = samples.filter((s) => s.trim()).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10">
          <AudioLines className="h-5 w-5 text-[var(--accent-500)]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Your brand voice</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-prose">
            Paste a few of your best past posts and tell us how you write. We&apos;ll match
            your tone in every blog, LinkedIn post, and thread we generate.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Style notes (optional)
          </Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Direct and punchy. Short sentences. Dry humor. No corporate buzzwords. The occasional emoji."
            className="min-h-[80px] rounded-xl border-border"
          />
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Quote className="h-3.5 w-3.5" /> Past posts ({filledCount}/{MAX_SAMPLES})
          </Label>
          {samples.map((sample, i) => (
            <div key={i} className="relative">
              <Textarea
                value={sample}
                onChange={(e) => updateSample(i, e.target.value)}
                placeholder="Paste a past LinkedIn post, tweet, or newsletter blurb…"
                className="min-h-[100px] rounded-xl border-border pr-10"
              />
              {(samples.length > 1 || sample.trim()) && (
                <button
                  type="button"
                  onClick={() => removeSample(i)}
                  aria-label="Remove sample"
                  className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {samples.length < MAX_SAMPLES && (
            <Button type="button" variant="outline" onClick={addSample} className="rounded-xl border-dashed">
              <Plus className="h-4 w-4 mr-2" /> Add another post
            </Button>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save brand voice
          </Button>
        </div>
      </div>
    </div>
  );
}

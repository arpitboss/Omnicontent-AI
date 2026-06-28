"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2, Plus, Undo2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");

interface ContentItem {
  _id: string;
  status: string;
  generatedTitle?: string;
  linkedinPost?: string;
}

/**
 * Close-the-loop UI: lists the user's completed posts and lets them add a winner to
 * their brand voice with one click. The added text is appended server-side to their
 * VoiceProfile samples and immediately influences future generations.
 */
export function VoiceLearnFromContent() {
  const { getToken } = useAuth();
  const [items, setItems] = React.useState<ContentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addedIds, setAddedIds] = React.useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${apiBase}/api/v1/content`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok && active) {
          const data: ContentItem[] = await res.json();
          setItems(data.filter((c) => c.status === "COMPLETE" && Boolean(c.linkedinPost?.trim())));
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [getToken]);

  const handleToggle = async (item: ContentItem) => {
    if (!item.linkedinPost) return;
    const currentlyAdded = addedIds.has(item._id);
    setPendingId(item._id);
    try {
      const token = await getToken();
      const res = await fetch(`${apiBase}/api/v1/voice/learn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: item.linkedinPost, remove: currentlyAdded }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => ""));
      const data = await res.json();
      setAddedIds((prev) => {
        const next = new Set(prev);
        if (currentlyAdded) next.delete(item._id);
        else next.add(item._id);
        return next;
      });
      if (currentlyAdded) toast.success("Removed from your brand voice.");
      else toast.success(data.added === false ? "Already in your brand voice." : "Added to your brand voice.");
    } catch {
      toast.error("Couldn't update your brand voice. Try again.");
    } finally {
      setPendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border p-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10">
          <Trophy className="h-5 w-5 text-[var(--accent-500)]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Learn from your winners</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-prose">
            A post that performed well? Add it to your brand voice so future generations lean
            into what already works. Added one by mistake? Just hit Remove.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {items.slice(0, 10).map((item) => {
          const added = addedIds.has(item._id);
          return (
            <li key={item._id} className="flex items-start gap-4 rounded-xl border border-border p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.generatedTitle || "Untitled project"}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.linkedinPost}</p>
              </div>
              <Button
                size="sm"
                variant={added ? "secondary" : "outline"}
                disabled={pendingId === item._id}
                onClick={() => handleToggle(item)}
                className="rounded-lg shrink-0"
              >
                {pendingId === item._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : added ? (
                  <>
                    <Undo2 className="h-4 w-4 mr-1.5" /> Remove
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" /> Add to voice
                  </>
                )}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

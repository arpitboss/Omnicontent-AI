"use client";

import { useTypewriterManager } from "@/context/typewriter-context";
import { useSyncExternalStore, useEffect, useRef } from 'react';

type Snapshot = { displayText: string; isDone: boolean };

const fallbackCache = new Map<string, Snapshot>();

export const useTypewriter = (id: string, text: string) => {
    const store = useTypewriterManager();
    const textRef = useRef(text); // keep latest text stable
    textRef.current = text; // ALWAYS UPDATE THE REF SO IT HAS THE LATEST PROP VALUE!

    useEffect(() => {
        const hasPlayed = sessionStorage.getItem(`typewriter_played_${id}`);
        if (!hasPlayed) {
            store.startAnimation(id, text);
        }
    }, [id, text, store]);

    const state = useSyncExternalStore(
        store.subscribe,
        () => {
            const snapshot = store.getSnapshot();
            const value = snapshot[id];
            if (value) return value;

            // return a cached fallback (so it's stable)
            const played = sessionStorage.getItem(`typewriter_played_${id}`);
            const cached = fallbackCache.get(id);

            if (played) {
                // If it was already played, we should display the latest stable text.
                // If the cache doesn't exist or is holding a stale value, we update it.
                if (!cached || cached.displayText !== textRef.current) {
                    const updated = { displayText: textRef.current, isDone: true };
                    fallbackCache.set(id, updated);
                    return updated;
                }
                return cached;
            } else {
                // If it hasn't been played yet, display empty until typewriter starts animating.
                if (!cached) {
                    const updated = { displayText: "", isDone: false };
                    fallbackCache.set(id, updated);
                    return updated;
                }
                return cached;
            }
        }
    );

    useEffect(() => {
        if (state?.isDone) {
            sessionStorage.setItem(`typewriter_played_${id}`, "true");
        }
    }, [id, state?.isDone]);

    return state;
};

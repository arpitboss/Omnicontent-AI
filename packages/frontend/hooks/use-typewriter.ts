"use client";

import { useTypewriterManager } from "@/context/typewriter-context";
import { useSyncExternalStore, useEffect, useRef } from 'react';

type Snapshot = { displayText: string; isDone: boolean };

const fallbackCache = new Map<string, Snapshot>();

export const useTypewriter = (id: string, text: string) => {
    const store = useTypewriterManager();
    const textRef = useRef(text); // keep latest text stable

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
            if (!fallbackCache.has(id)) {
                const played = sessionStorage.getItem(`typewriter_played_${id}`);
                fallbackCache.set(id, played
                    ? { displayText: textRef.current, isDone: true }
                    : { displayText: "", isDone: false }
                );
            }
            return fallbackCache.get(id)!;
        }
    );

    useEffect(() => {
        if (state?.isDone) {
            sessionStorage.setItem(`typewriter_played_${id}`, "true");
        }
    }, [id, state?.isDone]);

    return state;
};

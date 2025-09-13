"use client";

import { createContext, useContext, ReactNode, useMemo } from 'react';

// Interfaces for our state and context
interface TypewriterState {
    displayText: string;
    isDone: boolean;
}

// The Store Class (The Engine for animations)
class TypewriterStore {
    private animations: Record<string, TypewriterState> = {};
    private listeners: Set<() => void> = new Set();

    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    getSnapshot = () => this.animations; // stable reference

    startAnimation = (id: string, text: string, speed: number = 10) => {
        if (this.animations[id] || !text) return;

        this.animations[id] = { displayText: "", isDone: false };
        this.emitChange();

        let index = 0;
        const intervalId = setInterval(() => {
            if (index < text.length - 1) {
                this.animations[id] = {
                    ...this.animations[id],
                    displayText: text.substring(0, index + 1),
                };
                index++;
            } else {
                this.animations[id] = { displayText: text, isDone: true };
                clearInterval(intervalId);
            }
            this.emitChange();
        }, speed);
    };

    private emitChange = () => {
        for (const listener of this.listeners) {
            listener();
        }
    };
}


const TypewriterContext = createContext<TypewriterStore | null>(null);

export const TypewriterProvider = ({ children }: { children: ReactNode }) => {
    // useMemo ensures the store instance is created only once
    const store = useMemo(() => new TypewriterStore(), []);
    return (
        <TypewriterContext.Provider value= { store } >
        { children }
        </TypewriterContext.Provider>
    );
};

// Hook to access the store instance (for starting animations)
export const useTypewriterManager = () => {
    const store = useContext(TypewriterContext);
    if (!store) throw new Error('useTypewriterManager must be used within a TypewriterProvider');
    return store;
};
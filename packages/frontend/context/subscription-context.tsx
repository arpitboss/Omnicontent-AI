"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

// ─── Types ───
export type PlanType = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired" | "none";

export interface SubscriptionData {
    plan: PlanType;
    status: SubscriptionStatus;
    trialDaysLeft: number | null;
    trialEndsAt: string | null;
    atomizationsUsed: number;
    atomizationsLimit: number;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    stripeCustomerId: string | null;
}

interface SubscriptionContextType extends SubscriptionData {
    isLoading: boolean;
    isProFeatureAvailable: boolean;
    canAtomize: boolean;
    refetch: () => Promise<void>;
    startTrial: () => Promise<{ success: boolean; error?: string }>;
    createCheckout: (interval?: "monthly" | "yearly") => Promise<{ url?: string; error?: string }>;
    openPortal: () => Promise<{ url?: string; error?: string }>;
}

const defaultContext: SubscriptionContextType = {
    plan: "free",
    status: "none",
    trialDaysLeft: null,
    trialEndsAt: null,
    atomizationsUsed: 0,
    atomizationsLimit: 3,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    stripeCustomerId: null,
    isLoading: true,
    isProFeatureAvailable: false,
    canAtomize: true,
    refetch: async () => {},
    startTrial: async () => ({ success: false }),
    createCheckout: async () => ({}),
    openPortal: async () => ({}),
};

const SubscriptionContext = createContext<SubscriptionContextType>(defaultContext);

const API_BASE = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8080");

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const [data, setData] = useState<SubscriptionData>({
        plan: "free",
        status: "none",
        trialDaysLeft: null,
        trialEndsAt: null,
        atomizationsUsed: 0,
        atomizationsLimit: 3,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        stripeCustomerId: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchSubscription = useCallback(async () => {
        if (!isLoaded) return;
        
        if (!isSignedIn) {
            setIsLoading(false);
            return;
        }
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/v1/billing/subscription`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setData({
                    plan: json.plan || "free",
                    status: json.status || "none",
                    trialDaysLeft: json.trialDaysLeft ?? null,
                    trialEndsAt: json.trialEndsAt ?? null,
                    atomizationsUsed: json.atomizationsUsed || 0,
                    atomizationsLimit: json.atomizationsLimit === -1 ? Infinity : (json.atomizationsLimit || 3),
                    cancelAtPeriodEnd: json.cancelAtPeriodEnd || false,
                    currentPeriodEnd: json.currentPeriodEnd ?? null,
                    stripeCustomerId: json.stripeCustomerId ?? null,
                });
            }
        } catch (err) {
            console.error("[Subscription] Failed to fetch:", err);
        } finally {
            setIsLoading(false);
        }
    }, [getToken, isSignedIn, isLoaded]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const isProFeatureAvailable = data.plan === "pro" && data.status === "active";

    const canAtomize = isProFeatureAvailable || data.atomizationsUsed < data.atomizationsLimit;

    const startTrial = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/v1/billing/start-trial`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const json = await res.json();
            if (res.ok) {
                await fetchSubscription();
                return { success: true };
            }
            return { success: false, error: json.message || "Failed to start trial." };
        } catch (err) {
            return { success: false, error: "Network error. Please try again." };
        }
    }, [getToken, fetchSubscription]);

    const createCheckout = useCallback(async (interval: "monthly" | "yearly" = "monthly") => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/v1/billing/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ interval }),
            });
            const json = await res.json();
            if (res.ok && json.url) {
                return { url: json.url };
            }
            return { error: json.message || "Failed to create checkout session." };
        } catch (err) {
            return { error: "Network error. Please try again." };
        }
    }, [getToken]);

    const openPortal = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/v1/billing/portal`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const json = await res.json();
            if (res.ok && json.url) {
                return { url: json.url };
            }
            return { error: json.message || "Failed to open billing portal." };
        } catch (err) {
            return { error: "Network error. Please try again." };
        }
    }, [getToken]);

    return (
        <SubscriptionContext.Provider
            value={{
                ...data,
                isLoading,
                isProFeatureAvailable,
                canAtomize,
                refetch: fetchSubscription,
                startTrial,
                createCheckout,
                openPortal,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    return useContext(SubscriptionContext);
}

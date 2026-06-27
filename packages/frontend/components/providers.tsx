"use client";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider, useTheme } from "@/context/theme-context";
import { SubscriptionProvider } from "@/context/subscription-context";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn as clerkLight, dark } from "@clerk/themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ClerkThemeSync>{children} </ClerkThemeSync>
      <Toaster
        position="bottom-right"
        richColors
        theme="system"
        className="font-mono uppercase tracking-wide"
        toastOptions={{
          style: {
            borderRadius: '0px',
            border: '1px solid var(--border)',
            background: 'var(--background)',
            color: 'var(--foreground)',
          },
        }}
      />
    </ThemeProvider>
  );
}


function ClerkThemeSync({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  const clerkBaseTheme = theme === "dark" ? dark : clerkLight;

  return (
    <ClerkProvider
      appearance={{
        baseTheme: clerkBaseTheme,
        variables: {
          colorPrimary: "oklch(0.715 0.170 162)", // --accent-500
          colorBackground: theme === "dark" ? "oklch(0.180 0.005 270)" : "oklch(1 0 0)", // surface-overlay
          colorText: theme === "dark" ? "oklch(0.94 0 0)" : "oklch(0.115 0.005 270)",
          borderRadius: "0.625rem",
        },
        elements: {
          card: "border border-border shadow-xl",
          navbar: "hidden",
          headerTitle: "text-xl font-bold tracking-tight",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "border-border hover:bg-muted transition-colors",
          formButtonPrimary: "bg-brand text-brand-foreground hover:opacity-90 transition-opacity",
          footerActionLink: "text-brand hover:text-brand-strong font-medium",
        }
      }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <SubscriptionProvider>
        {children}
      </SubscriptionProvider>
    </ClerkProvider>
  );
}


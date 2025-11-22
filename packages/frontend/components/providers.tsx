"use client";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider, useTheme } from "@/context/theme-context";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn as clerkLight, dark, neobrutalism } from "@clerk/themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ClerkThemeSync>{children} </ClerkThemeSync>
      <Toaster
        position="top-center"
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

  const clerkBaseTheme = theme === "dark"
    ? [dark, neobrutalism]
    : [clerkLight, neobrutalism];

  return (
    <ClerkProvider
      appearance={{
        baseTheme: clerkBaseTheme,
      }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      {children}
    </ClerkProvider>
  );
}


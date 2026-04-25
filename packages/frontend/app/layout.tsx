import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "OmniContent AI — Upload once, publish everywhere",
  description:
    "AI-native content distribution. Atomize long-form video into clips, articles, and platform-native posts in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const saved = localStorage.getItem("theme");
                const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const theme = saved || (systemDark ? "dark" : "light");
                document.documentElement.classList.toggle("dark", theme === "dark");
              } catch {}
            })();`,
          }}
        />
      </head>
      <body
        className={`${geist.variable} ${jetbrains.variable} antialiased min-h-screen flex flex-col`}
      >
        {/* Quiet emerald glow + faint noise; replaces animated BackgroundShader */}
        <div aria-hidden className="bg-page" />
        <div className="animate-page-blur flex flex-col flex-1">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}

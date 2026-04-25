import { Providers } from "@/components/providers";
import { BackgroundShader } from "@/components/ui/background-shader";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "OmniContent AI",
  description: "Upload once, publish everywhere.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
    (() => {
      const saved = localStorage.getItem("theme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = saved || (systemDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", theme === "dark");
    })();
  `
        }} />
      </head>
      <body className={`${outfit.variable} ${bricolage.variable} ${jetbrains.variable} antialiased selection:bg-foreground/10 min-h-screen flex flex-col`}>
        <BackgroundShader />
        <div className="animate-page-blur">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}

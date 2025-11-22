import { Providers } from "@/components/providers";
import { BackgroundShader } from "@/components/ui/background-shader";
import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
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
      <body className={`${inter.variable} ${dmSerif.variable} font-sans antialiased bg-transparent text-neutral-900 dark:text-neutral-50`}>
        <BackgroundShader />
        <div className="animate-page-blur">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}

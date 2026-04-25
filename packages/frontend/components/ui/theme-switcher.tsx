// ThemeSwitcher.tsx — Monochrome premium toggle
"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/theme-context";
import { motion } from "framer-motion";

export const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX: x, clientY: y } = e;
    toggleTheme({ x, y });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={handleClick}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-all duration-500 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark
          ? "bg-foreground/10 border-border"
          : "bg-muted border-border"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "pointer-events-none flex h-5 w-5 items-center justify-center rounded-full shadow-sm",
          isDark
            ? "ml-[22px] bg-foreground/15"
            : "ml-[3px] bg-white shadow-md"
        )}
      >
        <Sun
          className={cn(
            "absolute h-3 w-3 transition-all duration-500",
            isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100 text-foreground"
          )}
        />
        <Moon
          className={cn(
            "absolute h-3 w-3 transition-all duration-500",
            isDark ? "scale-100 rotate-0 opacity-100 text-foreground" : "scale-0 -rotate-90 opacity-0"
          )}
        />
      </motion.span>
    </button>
  );
};

function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

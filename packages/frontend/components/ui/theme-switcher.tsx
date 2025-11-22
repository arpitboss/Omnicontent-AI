// ThemeToggle.tsx
"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/theme-context";

export const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // get click position
    const { clientX: x, clientY: y } = e;
    toggleTheme({ x, y });
  };

  return (
    <div className="px-2">
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={handleClick}
        value={isDark ? "on" : "off"}
        className={cn(
          "peer focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300",
          isDark ? "bg-primary" : "bg-muted",
          "focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <span
          className={cn(
            "bg-background pointer-events-none flex size-5 items-center justify-center rounded-full shadow-lg ring-0 transition-transform duration-300",
            isDark ? "translate-x-5" : "translate-x-0"
          )}
        >
          <Sun
            className={cn(
              "absolute size-3 transition-all duration-300",
              isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"
            )}
          />
          <Moon
            className={cn(
              "absolute size-3 transition-all duration-300",
              isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"
            )}
          />
        </span>
      </button>
    </div>
  );
};

function cn(...classes: (string | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
}

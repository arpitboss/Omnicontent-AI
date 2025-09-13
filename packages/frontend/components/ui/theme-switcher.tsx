import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ThemeSwitcher: React.FC = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check for saved theme preference or default to system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
        setIsDark(shouldBeDark);

        // Apply theme to document
        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);

        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <Button
      variant= "ghost"
    size = "sm"
    onClick = { toggleTheme }
    className = "relative w-10 h-10 p-0 rounded-lg hover:bg-muted/80 transition-all duration-300"
    data-testid="theme-switcher"
        >
        <div className="relative w-full h-full flex items-center justify-center" >
            <Sun className={
                cn(
                    "w-5 h-5 transition-all duration-300",
                    isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"
                )
    } />
        < Moon className = {
            cn(
          "absolute w-5 h-5 transition-all duration-300",
                isDark? "scale-100 rotate-0" : "scale-0 -rotate-90"
            )
        } />
            </div>
            < span className = "sr-only" > Toggle theme </span>
                </Button>
  );
};

function cn(...classes: (string | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
}

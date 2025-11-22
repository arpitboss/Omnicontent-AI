"use client";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { cn } from "@/lib/utils";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { LayoutDashboard, Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Create", href: "/create", icon: Sparkles },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-white/80 dark:bg-black/80 backdrop-blur-md border-neutral-200 dark:border-neutral-800 py-3"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center rounded-none">
              <span className="text-white dark:text-black font-bold text-sm transition-transform duration-500 group-hover:rotate-180">O</span>
            </div>
            <span className="font-bold text-lg tracking-tight">OmniContent</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "px-4 py-2 rounded-none text-sm font-medium transition-all duration-300 flex items-center gap-2 relative group overflow-hidden",
                      isActive
                        ? "text-black dark:text-white"
                        : "text-neutral-500 hover:text-black dark:hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black dark:bg-white" />
                    )}
                    <span className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <ThemeSwitcher />

            <SignedOut>
              <SignInButton>
                <Button
                  size="sm"
                  className="hidden md:inline-flex bg-black text-white dark:bg-white dark:text-black hover:opacity-90 rounded-full px-6 font-medium transition-transform hover:scale-105 active:scale-95"
                >
                  Get Started
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  },
                }}
              />
            </SignedIn>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800 p-6 space-y-4 animate-in slide-in-from-top-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <SignedOut>
                <SignInButton>
                  <Button className="w-full bg-black text-white dark:bg-white dark:text-black rounded-full">
                    Get Started
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

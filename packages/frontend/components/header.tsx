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
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── OmniContent Logomark (SVG) ──────────────────────────── */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer orbit ring */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 6"
        opacity="0.3"
      />
      {/* Inner solid ring */}
      <circle
        cx="16"
        cy="16"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.7"
      />
      {/* Core dot */}
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
      {/* Orbiting accent dot */}
      <circle cx="16" cy="3" r="2" fill="currentColor" />
    </svg>
  );
}

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { name: "Create", href: "/create", icon: Sparkles },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        isScrolled
          ? "py-2.5"
          : "py-4"
      )}
    >
      {/* Frosted glass container with rounded edges */}
      <div
        className={cn(
          "max-w-5xl mx-auto px-4 transition-all duration-500 ease-out",
          isScrolled ? "px-4" : "px-6"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-4 transition-all duration-500 ease-out",
            isScrolled
              ? "bg-background/70 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg shadow-black/[0.03] dark:shadow-black/[0.15] py-2.5"
              : "bg-transparent border border-transparent rounded-2xl py-2"
          )}
        >
          {/* ── Logo ──────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <LogoMark className="w-8 h-8 text-foreground transition-transform duration-700 ease-out group-hover:rotate-[60deg]" />
            </div>
            <span className="font-display font-bold text-lg tracking-[-0.03em] pt-0.5">
              OmniContent
            </span>
          </Link>

          {/* ── Desktop Navigation ─────────────────── */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "relative px-3.5 py-2 text-[13px] font-medium transition-all duration-300 flex items-center gap-2 rounded-lg group",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}

                    {/* Active indicator — subtle gradient pill */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-primary/[0.08] dark:bg-primary/[0.12] rounded-lg -z-10"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Hover background */}
                    {!isActive && (
                      <span className="absolute inset-0 bg-accent/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* ── Actions ────────────────────────────── */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />

            <AnimatePresence mode="wait">
              {!mounted ? (
                <div key="loader" className="w-8 h-8 rounded-full bg-muted/30 animate-pulse" />
              ) : (
                <motion.div
                  key="clerk-loaded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <SignedOut>
                    <SignInButton>
                      <Button
                        size="sm"
                        className="hidden md:inline-flex bg-foreground text-background hover:bg-foreground/90 rounded-md px-5 h-8 text-[13px] font-medium transition-all duration-300 hover:shadow-md hover:-translate-y-px active:translate-y-0 cursor-pointer"
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
                          userButtonAvatarBox: "w-7 h-7 ring-2 ring-border",
                        },
                      }}
                    />
                  </SignedIn>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Mobile Menu Toggle ──────────────── */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-accent/60 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ──────────────────────────── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden mt-2 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl p-4 space-y-1 shadow-xl"
            >
              {navItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200",
                      pathname === item.href
                        ? "bg-primary/[0.08] text-foreground"
                        : "hover:bg-accent/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="pt-3 border-t border-border/40"
              >
                <SignedOut>
                  <SignInButton>
                    <Button className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl h-10 font-medium cursor-pointer">
                      Get Started
                    </Button>
                  </SignInButton>
                </SignedOut>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

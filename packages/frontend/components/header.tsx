"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/* ─── Brand mark ─────────────────────────────────────
   Concept: "play once, broadcast everywhere."
   A solid play triangle radiating two concentric arcs.
   Pure currentColor — inherits theme + sits well on
   any surface in light or dark.                       */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Outer broadcast arcs (left + right) */}
      <path
        d="M5.6 22.5 A12 12 0 0 1 5.6 9.5"
        stroke="currentColor"
        strokeOpacity="0.32"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M26.4 9.5 A12 12 0 0 1 26.4 22.5"
        stroke="currentColor"
        strokeOpacity="0.32"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Inner broadcast arcs */}
      <path
        d="M9.4 20.5 A7 7 0 0 1 9.4 11.5"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22.6 11.5 A7 7 0 0 1 22.6 20.5"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Center play triangle */}
      <path
        d="M14 12.4 L20.5 16 L14 19.6 Z"
        fill="currentColor"
      />
    </svg>
  );
}

const NAV_ITEMS = [
  { name: "Create", href: "/create" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Pricing", href: "/#pricing" },
] as const;

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-14",
        "transition-[background-color,backdrop-filter,border-color] duration-300 ease-out",
        scrolled
          ? "bg-background/72 backdrop-blur-xl backdrop-saturate-150 border-b border-border"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="container-page h-full flex items-center justify-between gap-6">
        {/* ── Brand ──────────────────────────────────── */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 -ml-1 px-1 py-1 rounded-md focus-visible:outline-none"
        >
          <LogoMark className="h-6 w-6 text-foreground transition-transform duration-300 ease-out group-hover:scale-110" />
          <span className="font-heading text-[15px] font-semibold tracking-[-0.02em]">
            OmniContent
          </span>
        </Link>

        {/* ── Desktop nav ────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href.startsWith("/") &&
                !item.href.includes("#") &&
                pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-1.5 text-[13.5px] rounded-md transition-colors duration-200",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.name}
                {isActive && !item.href.includes("#") && (
                  <motion.span
                    layoutId="header-active"
                    className="absolute inset-x-3 -bottom-[1px] h-px bg-foreground/70"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Actions ────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher />

          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex h-8 px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-transparent"
              >
                Sign in
              </Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button
                size="sm"
                className={cn(
                  "h-8 px-3.5 text-[13px] font-medium rounded-md",
                  "bg-foreground text-background",
                  "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_1px_2px_rgba(0,0,0,0.12)]",
                  "transition-[transform,opacity] duration-200",
                  "hover:opacity-92 active:translate-y-px"
                )}
              >
                Get started
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { userButtonAvatarBox: "w-7 h-7 ring-1 ring-border" },
              }}
            />
          </SignedIn>

          {/* ── Mobile menu ──────────────────────────── */}
          {mounted ? (
            <MobileNav pathname={pathname} />
          ) : (
            // Placeholder: identical footprint, prevents layout shift &
            // avoids Radix useId hydration drift caused by Clerk's
            // SignedIn/SignedOut tree changes on mount.
            <span
              aria-hidden
              className="md:hidden inline-block h-8 w-8"
            />
          )}
        </div>
      </div>

      {/* Soft underglow when scrolled — Linear's signature hairline */}
      <AnimatePresence>
        {scrolled && (
          <motion.div
            key="hairline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-border to-transparent"
          />
        )}
      </AnimatePresence>
    </header>
  );
};

function MobileNav({ pathname }: { pathname: string | null }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[86%] max-w-sm p-0 bg-background/85 backdrop-blur-2xl backdrop-saturate-150 border-l border-border"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-full flex-col">
          <div className="h-14 px-5 flex items-center border-b border-border">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] font-heading"
            >
              <LogoMark className="h-6 w-6 text-foreground" />
              OmniContent
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block px-3 py-2.5 rounded-md text-[14px] font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    {item.name}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>
          <div className="p-4 border-t border-border space-y-2">
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10 text-[14px] font-medium"
                >
                  Sign in
                </Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button className="w-full h-10 bg-foreground text-background hover:opacity-92 text-[14px] font-medium">
                  Get started
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

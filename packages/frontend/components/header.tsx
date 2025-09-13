"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import { Menu, X, Sparkles, Plus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { GridBackground } from "@/components/ui/grid-background";
import { cn } from "@/lib/utils";

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

  return (
    <GridBackground pattern="subtle-dots" className="sticky top-0 z-50">
      <header
        className={cn(
          "relative transition-all duration-500",
          isScrolled ? "nav-blur" : "glass-effect backdrop-blur-xl"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="group flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg animate-glow" />
                <Sparkles className="absolute inset-0 w-4 h-4 m-auto text-primary-foreground animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold gradient-text">
                  OmniContent AI
                </h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wide">
                  Premium Content Suite
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <Link href="/create">
                <Button
                  variant={pathname === "/create" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "transition-all duration-200",
                    pathname === "/create"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  data-testid="nav-create"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant={pathname === "/dashboard" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "transition-all duration-200",
                    pathname === "/dashboard"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  data-testid="nav-dashboard"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Keep your ThemeSwitcher */}
              <ThemeSwitcher />

              <SignedOut>
                <SignInButton>
                  <Button
                    size="sm"
                    className="hidden md:inline-flex premium-button font-medium"
                    data-testid="get-started-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
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
                      userButtonPopoverCard:
                        "glass-effect border border-border/50 shadow-lg",
                      userButtonActionButton: "text-sm",
                      userButtonPrimaryButton:
                        "bg-gradient-to-r from-foreground to-muted-foreground text-background border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-medium rounded-lg",
                    },
                  }}
                />
              </SignedIn>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden glass-effect"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-6 pt-6 border-t border-border/30 space-y-3 animate-fade-in">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="w-full text-left justify-start text-muted-foreground hover:text-foreground"
                  data-testid="mobile-nav-home"
                >
                  Home
                </Button>
              </Link>
              <Link href="/create">
                <Button
                  variant={pathname === "/create" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "transition-all duration-200",
                    pathname === "/create"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  data-testid="nav-create"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="w-full text-left justify-start text-muted-foreground hover:text-foreground"
                  data-testid="mobile-nav-dashboard"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="pt-3">
                <SignedOut>
                  <SignInButton>
                    <Button
                      className="w-full premium-button font-medium"
                      data-testid="mobile-get-started-button"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Get Started
                    </Button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
          )}
        </div>
      </header>
    </GridBackground>
  );
};

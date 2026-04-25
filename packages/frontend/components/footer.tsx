"use client";

import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Meteors } from "@/components/ui/meteors";

const ease = [0.4, 0, 0.2, 1] as const;

/* ─── Shared Logomark ──────────────────────────────── */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 6" opacity="0.3" />
      <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
      <circle cx="16" cy="3" r="2" fill="currentColor" />
    </svg>
  );
}

/* ─── Decorative Grid Lines ────────────────────────── */
function GridLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04] dark:opacity-[0.06]">
      {/* Vertical lines */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px bg-foreground"
          style={{ left: `${12.5 * (i + 1)}%` }}
        />
      ))}
      {/* Horizontal lines */}
      {[...Array(4)].map((_, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px bg-foreground"
          style={{ top: `${25 * (i + 1)}%` }}
        />
      ))}
    </div>
  );
}

export function Footer() {
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" });
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "How it Works", href: "#how-it-works" },
      { name: "Testimonials", href: "#testimonials" },
    ],
    company: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
    ],
    resources: [
      { name: "Documentation", href: "/docs" },
      { name: "API Reference", href: "/api" },
      { name: "Support", href: "/support" },
      { name: "Status", href: "/status" },
    ],
    legal: [
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
      { name: "Security", href: "/security" },
      { name: "Cookies", href: "/cookies" },
    ],
  };

  return (
    <footer className="relative overflow-hidden">
      {/* ── CTA Section ──────────────────────────────── */}
      <div className="relative py-24" ref={ctaRef}>
        {/* Decorative grid lines */}
        <GridLines />

        {/* Gradient hairlines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        {/* Background glow and Meteors */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Meteors number={20} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-foreground/[0.02] blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
            className="section-title mx-auto mb-6"
          >
            Ready to <span className="premium-text italic">automate</span>
            <br className="hidden sm:block" />
            <span className="text-muted-foreground/60"> your content today?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="section-subtitle mx-auto mb-10"
          >
            Join thousands of creators who ship content faster with OmniContent AI.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease }}
          >
            <Link href="/create">
              <Button className="h-11 px-7 bg-foreground text-background hover:bg-foreground/90 rounded-lg font-medium text-sm group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-px active:translate-y-0">
                <span className="flex items-center">
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                </span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── Footer Links ─────────────────────────────── */}
      <div className="border-t border-border/40 py-16 relative">
        <GridLines />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{category}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-3">
              <LogoMark className="w-7 h-7 text-foreground" />
              <div>
                <div className="font-display font-bold text-sm tracking-tight">OmniContent</div>
                <div className="text-xs text-muted-foreground">
                  © {currentYear} OmniContent. All rights reserved.
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              <Link
                href="https://twitter.com"
                target="_blank"
                className="w-9 h-9 rounded-lg border border-border/40 flex items-center justify-center hover:border-foreground/20 hover:bg-accent/50 transition-all duration-300 group"
              >
                <svg className="w-4 h-4 fill-muted-foreground group-hover:fill-foreground transition-colors" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                className="w-9 h-9 rounded-lg border border-border/40 flex items-center justify-center hover:border-foreground/20 hover:bg-accent/50 transition-all duration-300 group"
              >
                <svg className="w-4 h-4 fill-muted-foreground group-hover:fill-foreground transition-colors" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

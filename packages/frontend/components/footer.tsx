"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Footer() {
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
      {/* CTA Section with gradient background */}
      <div className="relative bg-gradient-to-b from-neutral-50 via-purple-50/30 to-purple-100/50 dark:from-neutral-950 dark:via-purple-950/20 dark:to-purple-900/30 py-24">
        {/* Decorative tilted lines - Left */}
        <div className="absolute left-0 top-0 bottom-0 w-32 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 400" preserveAspectRatio="none">
            {[...Array(20)].map((_, i) => (
              <line
                key={i}
                x1="0"
                y1={i * 20}
                x2="100"
                y2={i * 20 + 100}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-neutral-400 dark:text-neutral-600"
              />
            ))}
          </svg>
        </div>

        {/* Vertical boundary line - Left */}
        <div className="absolute left-32 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neutral-300 dark:via-neutral-700 to-transparent opacity-50" />

        {/* Decorative tilted lines - Right */}
        <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 400" preserveAspectRatio="none">
            {[...Array(20)].map((_, i) => (
              <line
                key={i}
                x1="100"
                y1={i * 20}
                x2="0"
                y2={i * 20 + 100}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-neutral-400 dark:text-neutral-600"
              />
            ))}
          </svg>
        </div>

        {/* Vertical boundary line - Right */}
        <div className="absolute right-32 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neutral-300 dark:via-neutral-700 to-transparent opacity-50" />

        {/* Concentric circles - Top Left */}
        <div className="absolute -left-20 -top-20 w-40 h-40 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {[20, 40, 60, 80, 100].map((r, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-neutral-400 dark:text-neutral-600"
              />
            ))}
          </svg>
        </div>

        {/* Concentric circles - Bottom Right */}
        <div className="absolute -right-20 -bottom-20 w-40 h-40 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {[20, 40, 60, 80, 100].map((r, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-neutral-400 dark:text-neutral-600"
              />
            ))}
          </svg>
        </div>

        {/* Horizontal boundary lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent opacity-50" />

        {/* CTA Content */}
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Ready to start improving <br />
            <span className="text-neutral-500 dark:text-neutral-400">your content today?</span>
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
            Book a demo appointment to get started. Close the loop between content deployment and improvement.
          </p>
          <Button className="h-12 px-8 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold uppercase tracking-widest text-sm group cursor-pointer relative overflow-hidden">
            <span className="relative z-10 flex items-center">
              Book Demo
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Button>
        </div>
      </div>

      {/* Footer Links Section */}
      <div className="bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Product */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors hover:underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-4"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors hover:underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-4"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Resources</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors hover:underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-4"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors hover:underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-4"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center group cursor-pointer">
                <span className="text-white dark:text-black font-bold text-sm group-hover:rotate-180 transition-transform duration-500">O</span>
              </div>
              <div>
                <div className="font-bold text-sm">OmniContent</div>
                <div className="text-xs text-neutral-500">
                  Built by engineers who get it. © {currentYear} OmniContent. All rights reserved.
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <Link
                href="https://twitter.com"
                target="_blank"
                className="w-8 h-8 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center hover:border-black dark:hover:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                className="w-8 h-8 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center hover:border-black dark:hover:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
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

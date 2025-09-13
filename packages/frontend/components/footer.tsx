import React from 'react';
import { Github, Twitter, Linkedin, Mail, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GridBackground } from '@/components/ui/grid-background';

export const Footer: React.FC = () => {
  return (
    <GridBackground pattern="subtle-dots" className="border-t border-border bg-card/30 backdrop-blur-sm mt-24">
      <footer className="relative">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-1 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-lg" />
                  <Sparkles className="absolute inset-0 w-4 h-4 m-auto text-primary-foreground" />
                </div>
                <div className="space-y-0.5">
                  <h1 className="text-xl font-bold gradient-text">
                    OmniContent AI
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium tracking-wide">
                    Premium Content Suite
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Transform your content into multiple formats with the power of AI. 
                One upload, endless possibilities.
              </p>
              <div className="flex space-x-3">
                {[
                  { icon: Twitter, href: "#", label: "Twitter" },
                  { icon: Github, href: "#", label: "GitHub" },
                  { icon: Linkedin, href: "#", label: "LinkedIn" },
                  { icon: Mail, href: "#", label: "Email" }
                ].map(({ icon: Icon, href, label }) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="sm"
                    asChild
                    className="w-10 h-10 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300"
                  >
                    <a href={href} aria-label={label}>
                      <Icon className="w-4 h-4" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>

            {/* Product Column */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground gradient-text">Product</h3>
              <div className="space-y-3">
                {['Features', 'Pricing', 'API Documentation', 'Integrations'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Company Column */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground gradient-text">Company</h3>
              <div className="space-y-3">
                {['About Us', 'Blog', 'Careers', 'Contact', 'Press Kit'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Support Column */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground gradient-text">Support</h3>
              <div className="space-y-3">
                {['Help Center', 'Documentation', 'Community', 'Status Page', 'Contact Support'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="strategic-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>© 2025 OmniContent AI. All rights reserved.</span>
                <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Made with care</span>
              </div>
              <div className="flex space-x-6 text-sm text-muted-foreground">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="hover:text-foreground transition-colors duration-200"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </GridBackground>
  );
};

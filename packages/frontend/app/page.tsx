import { AgentGrid } from "@/components/agent-grid";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import { MetricsSection } from "@/components/metrics-section";
import { PricingSection } from "@/components/pricing-section";
import { TestimonialsSection } from "@/components/testimonials";


import { PlatformsMarquee } from "@/components/platforms-marquee";
import { TextRevealCard } from "@/components/ui/text-reveal-card";
import { TracingBeam } from "@/components/ui/tracing-beam";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <Header />
      <main className="relative z-10">
        <HeroSection />
        
        <PlatformsMarquee />

        <div className="section-spacing">
          <FeaturesSection />
        </div>

        <div className="section-spacing bg-muted/20">
          <TracingBeam>
            <HowItWorks />
          </TracingBeam>
        </div>

        <div className="section-spacing">
          <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row items-end justify-between gap-8">
            <div>
              <h2 className="section-title mb-4">Neural Infrastructure</h2>
              <p className="section-subtitle">The backbone of our automated content engine.</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6">
            <TextRevealCard
              text="Your raw input is generic"
              revealText="Our neural engine makes it authentic"
              className="w-full"
            >
              <div className="mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-500">Neural Core v2.5</span>
              </div>
            </TextRevealCard>
          </div>
        </div>

        <div className="section-spacing">
          <AgentGrid />
        </div>

        <div className="section-spacing bg-muted/20">
          <MetricsSection />
        </div>

        <div className="section-spacing">
          <TestimonialsSection />
        </div>

        <div className="section-spacing bg-muted/20 border-t border-border/50">
          <PricingSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}

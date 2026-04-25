import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { PlatformsMarquee } from "@/components/platforms-marquee";
import { FeaturesSection } from "@/components/features-section";
import { HowItWorks } from "@/components/how-it-works";
import { AgentGrid } from "@/components/agent-grid";
import { MetricsSection } from "@/components/metrics-section";
import { TestimonialsSection } from "@/components/testimonials";
import { PricingSection } from "@/components/pricing-section";
import { TracingBeam } from "@/components/ui/tracing-beam";

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative pt-14">
        <HeroSection />

        <div className="mt-16 md:mt-24">
          <PlatformsMarquee />
        </div>

        <FeaturesSection />

        <div className="border-t border-border/60">
          <TracingBeam>
            <HowItWorks />
          </TracingBeam>
        </div>

        <div className="border-t border-border/60">
          <AgentGrid />
        </div>

        <div className="border-t border-border/60">
          <MetricsSection />
        </div>

        <div className="border-t border-border/60">
          <TestimonialsSection />
        </div>

        <div className="border-t border-border/60">
          <PricingSection />
        </div>
      </main>
      <Footer />
    </>
  );
}

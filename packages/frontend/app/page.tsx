import { AgentGrid } from "@/components/agent-grid";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import { MetricsSection } from "@/components/metrics-section";
import { PricingSection } from "@/components/pricing-section";
import { TestimonialsSection } from "@/components/testimonials";
import { BackgroundShader } from "@/components/ui/background-shader";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <Header />
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <AgentGrid />
        <MetricsSection />
        <TestimonialsSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}

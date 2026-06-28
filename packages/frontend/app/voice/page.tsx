import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BrandVoiceCard } from "@/components/brand-voice-card";
import { VoiceLearnFromContent } from "@/components/voice-learn-from-content";
import { AudioLines } from "lucide-react";

export const metadata = {
  title: "Brand Voice — OmniContent AI",
  description: "Teach OmniContent how you write so every generated post sounds like you.",
};

export default function VoicePage() {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10 md:py-16">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--accent-500)]/30 bg-[var(--accent-500)]/10">
            <AudioLines className="h-6 w-6 text-[var(--accent-500)]" />
          </div>
          <div>
            <p className="eyebrow mb-1.5">Sounds like you</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Brand voice</h1>
            <p className="text-muted-foreground mt-2 max-w-prose">
              Teach OmniContent how you write once. Every blog, post, and thread we generate
              will match your tone — not generic AI.
            </p>
          </div>
        </div>
        <BrandVoiceCard />
        <div className="mt-6">
          <VoiceLearnFromContent />
        </div>
      </main>
      <Footer />
    </>
  );
}

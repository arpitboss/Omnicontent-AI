import * as React from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Privacy Policy — OmniContent",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="relative pt-32 pb-24 min-h-screen">
        <article className="container-page max-w-2xl prose-quiet">
          <p className="eyebrow mb-3">Legal</p>
          <h1 className="section-title">Privacy Policy</h1>
          <p className="text-[13px] font-mono text-muted-foreground mt-3">
            Last updated: April 2026
          </p>

          <section className="mt-10 space-y-6 text-[15px] leading-7 text-foreground/85">
            <p>
              OmniContent (&quot;we&quot;, &quot;us&quot;) builds AI-native content tooling.
              We take your privacy seriously and only collect data we need to
              run the product responsibly.
            </p>

            <Block heading="What we collect">
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Account information (email, name) provided via Clerk authentication.</li>
                <li>Content you upload or link (videos, transcripts, generated artifacts).</li>
                <li>Usage telemetry (page views, feature usage, error reports).</li>
              </ul>
            </Block>

            <Block heading="How we use it">
              <p className="text-muted-foreground">
                We use your data exclusively to operate the service: process
                your uploads, generate clips and posts, and improve reliability.
                We do not sell your data and we do not train public models on
                it.
              </p>
            </Block>

            <Block heading="Your rights">
              <p className="text-muted-foreground">
                You can export or delete your content at any time from the
                Dashboard. To request full account deletion, email{" "}
                <a className="text-foreground underline-offset-4 hover:underline" href="mailto:privacy@omnicontent.ai">
                  privacy@omnicontent.ai
                </a>
                .
              </p>
            </Block>

            <Block heading="Subprocessors">
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Clerk — authentication</li>
                <li>MongoDB Atlas — primary datastore</li>
                <li>Cloudinary — media storage and delivery</li>
                <li>Google Generative AI — model inference</li>
              </ul>
            </Block>

            <Block heading="Contact">
              <p className="text-muted-foreground">
                Questions? Reach us at{" "}
                <a className="text-foreground underline-offset-4 hover:underline" href="mailto:hello@omnicontent.ai">
                  hello@omnicontent.ai
                </a>
                .
              </p>
            </Block>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}

function Block({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-foreground mb-3">
        {heading}
      </h2>
      {children}
    </section>
  );
}

import * as React from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Terms of Service — OmniContent",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="relative pt-32 pb-24 min-h-screen">
        <article className="container-page max-w-2xl">
          <p className="eyebrow mb-3">Legal</p>
          <h1 className="section-title">Terms of Service</h1>
          <p className="text-[13px] font-mono text-muted-foreground mt-3">
            Last updated: April 2026
          </p>

          <section className="mt-10 space-y-6 text-[15px] leading-7 text-foreground/85">
            <p>
              By using OmniContent you agree to these Terms. They apply to
              everyone who creates an account or uses our APIs.
            </p>

            <Block heading="Your content">
              <p className="text-muted-foreground">
                You retain ownership of everything you upload and generate.
                You grant us a limited license to store and process your
                content solely to provide the service.
              </p>
            </Block>

            <Block heading="Acceptable use">
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>No content that violates copyright, privacy, or applicable law.</li>
                <li>No abuse of compute (mining, DoS, automated scraping).</li>
                <li>No attempt to reverse-engineer or bypass platform limits.</li>
              </ul>
            </Block>

            <Block heading="Subscriptions & billing">
              <p className="text-muted-foreground">
                Paid plans renew automatically until cancelled. You can cancel
                anytime from the dashboard; access continues until the end of
                the current period.
              </p>
            </Block>

            <Block heading="Limitation of liability">
              <p className="text-muted-foreground">
                The service is provided &quot;as is&quot;. To the fullest extent permitted
                by law, OmniContent is not liable for indirect or consequential
                damages.
              </p>
            </Block>

            <Block heading="Contact">
              <p className="text-muted-foreground">
                For legal inquiries, write to{" "}
                <a className="text-foreground underline-offset-4 hover:underline" href="mailto:legal@omnicontent.ai">
                  legal@omnicontent.ai
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

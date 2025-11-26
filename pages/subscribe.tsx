// pages/subscribe.tsx
import type { NextPage } from "next";
import * as React from "react";
import Layout from "@/components/Layout";
import NewsletterForm from "@/components/NewsletterForm";

const SubscribePage: NextPage = () => {
  const pageTitle = "Join the Founding Readers Circle";

  return (
    <Layout pageTitle={pageTitle}>
      <main className="min-h-screen bg-charcoal text-cream">
        <section className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 lg:py-20">
          {/* Eyebrow */}
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-softGold/80">
            The Architecture of Human Purpose · Canon
          </p>

          {/* Heading */}
          <header className="space-y-4">
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Join the Founding Readers Circle
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-[color:var(--color-on-secondary)/0.85]">
              Early access for fathers, founders, builders, and institutional
              architects who want to be part of the first 1,000 readers shaping
              the conversation around{" "}
              <span className="italic">The Architecture of Human Purpose</span>{" "}
              and the wider Canon.
            </p>
          </header>

          {/* Value bullets */}
          <section className="grid gap-4 rounded-2xl border border-softGold/25 bg-black/30 p-5 text-sm sm:text-base">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-softGold">
              As a founding reader, you’ll receive:
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-[color:var(--color-on-secondary)/0.9]">
              <li>Exclusive chapter previews before public release</li>
              <li>Access to founder-only masterclasses and live sessions</li>
              <li>First-release PDF editions of the Canon volumes</li>
              <li>
                Invitations to strategic conversations with other builders and
                reformers
              </li>
              <li>
                Priority access to future{" "}
                <span className="font-semibold">Fathering Without Fear</span>{" "}
                and <span className="font-semibold">Abraham of London</span>{" "}
                initiatives
              </li>
            </ul>

            <p className="mt-2 text-xs text-softGold/80">
              Note: The Founding Readers Circle is intentionally capped at{" "}
              <span className="font-semibold">1,000</span> members to preserve
              relational depth and strategic focus.
            </p>
          </section>

          {/* Form */}
          <section aria-label="Subscribe to the Founding Readers Circle">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-softGold">
              Secure your place
            </h2>
            <p className="mb-4 text-sm text-[color:var(--color-on-secondary)/0.85]">
              Enter your best email. You’ll receive the Prelude MiniBook and
              early Canon updates as they are released. No spam. No noise.
            </p>
            <NewsletterForm variant="premium" buttonText="Join the Founding Readers Circle" />
          </section>

          {/* Footer note */}
          <p className="mt-4 text-xs text-[color:var(--color-on-secondary)/0.7]">
            By subscribing, you agree to receive occasional updates from Abraham
            of London. You can unsubscribe at any time with a single click.
          </p>
        </section>
      </main>
    </Layout>
  );
};

export default SubscribePage;
// pages/subscribe.tsx
import type { NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Layout from "@/components/Layout";
import NewsletterForm from "@/components/NewsletterForm";

const SubscribePage: NextPage = () => {
  const pageTitle =
    "Join the Founding Readers Circle | Abraham of London";
  const pageDescription =
    "Early access to The Architecture of Human Purpose Canon for fathers, founders, builders, and institutional architects shaping the future of civilisation.";

  // ---------------------------------------------------------------------------
  // Share logic – used for “Share this Prelude…” CTA
  // ---------------------------------------------------------------------------
  const [copied, setCopied] = React.useState(false);

  const canonicalPreludeUrl =
    "https://www.abrahamoflondon.org/books/the-architecture-of-human-purpose";

  const handleShareClick = async () => {
    const shareUrl = canonicalPreludeUrl;
    const shareText =
      "THE ARCHITECTURE OF HUMAN PURPOSE — Prelude MiniBook. Read the Prelude here:";

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "The Architecture of Human Purpose — Prelude",
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      }

      if (typeof window !== "undefined") {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      // user cancelled or share failed – no need to surface an error
    }
  };

  return (
    <Layout pageTitle={pageTitle}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />

        <meta property="og:title" content={pageTitle} />
        <meta
          property="og:description"
          content={pageDescription}
        />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta
          name="twitter:description"
          content={pageDescription}
        />
      </Head>

      <main className="min-h-screen bg-charcoal text-cream">
        <section className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16 lg:py-24">
          {/* Premium Header Section */}
          <div className="space-y-6 border-b border-softGold/20 pb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-softGold/30 bg-softGold/10 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-softGold">
                The Architecture of Human Purpose · Canon
              </span>
            </div>

            <h1 className="bg-gradient-to-b from-cream to-softGold bg-clip-text font-serif text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              Join the Founding Readers Circle
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-300 sm:text-xl">
              For builders, reformers, and institutional architects
              ready to shape the conversation around human purpose,
              governance, and civilisational design.
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column: Benefits & Value Proposition */}
            <div className="space-y-8">
              {/* Founding Reader Benefits */}
              <div className="rounded-2xl border border-softGold/25 bg-black/40 p-8 backdrop-blur-sm">
                <h2 className="mb-6 font-serif text-2xl font-bold text-cream">
                  Founding Reader Benefits
                </h2>

                <div className="space-y-6 text-sm leading-relaxed text-gray-300">
                  <div className="flex gap-4">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-softGold/20">
                      <span className="text-sm text-softGold">1</span>
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-cream">
                        Exclusive Early Access
                      </h3>
                      <p>
                        Receive chapter previews and high-level
                        frameworks before public release, with
                        commentary on how to deploy them in real
                        leadership contexts.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-softGold/20">
                      <span className="text-sm text-softGold">2</span>
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-cream">
                        Founder-Only Masterclasses
                      </h3>
                      <p>
                        Live, implementation-focused sessions on
                        purpose, governance, institutional design, and
                        power — not theory for theory’s sake, but
                        strategy for deployment.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-softGold/20">
                      <span className="text-sm text-softGold">3</span>
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-cream">
                        Strategic Community Access
                      </h3>
                      <p>
                        Connect with fathers, founders, and
                        system-builders who are serious about
                        designing families, organisations, and
                        institutions that outlast them.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-softGold/20">
                      <span className="text-sm text-softGold">4</span>
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-cream">
                        Permanent Founding Status
                      </h3>
                      <p>
                        Your name recorded in the Canon’s founding
                        registry and lifetime priority access to
                        Abraham of London and{" "}
                        <span className="italic">
                          Fathering Without Fear
                        </span>{" "}
                        initiatives.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Urgency Indicator – fixed copy, no random */}
                <div className="mt-8 rounded-lg border border-softGold/20 bg-softGold/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 flex-shrink-0 animate-pulse rounded-full bg-softGold" />
                    <p className="text-xs font-semibold text-softGold">
                      The Founding Readers Circle is capped at 1,000
                      serious builders to preserve depth, focus, and
                      access.
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial / Social Proof */}
              <div className="rounded-2xl border border-gray-600/30 bg-black/30 p-6">
                <blockquote className="space-y-3">
                  <p className="text-sm italic leading-relaxed text-gray-300">
                    “This isn’t another motivational framework. It’s
                    the missing architecture for understanding why
                    people, organisations, and entire civilizations
                    either align and flourish — or drift and collapse.”
                  </p>
                  <footer className="text-xs text-gray-400">
                    — Early Reader, Institutional Architect
                  </footer>
                </blockquote>
              </div>
            </div>

            {/* Right Column: Enrollment Form */}
            <div className="space-y-8">
              <div className="rounded-2xl border border-softGold/25 bg-black/40 p-8 backdrop-blur-sm">
                <div className="mb-8 text-center">
                  <h2 className="mb-3 font-serif text-2xl font-bold text-cream">
                    Secure Your Founding Access
                  </h2>
                  <p className="text-sm leading-relaxed text-gray-300">
                    Enter your best email to receive the Prelude
                    MiniBook and join the Founding Readers Circle as we
                    bring{" "}
                    <span className="italic">
                      The Architecture of Human Purpose
                    </span>{" "}
                    into the world.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg border border-softGold/10 bg-gradient-to-r from-softGold/5 to-transparent p-4 text-sm text-gray-300">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cream">
                      You’ll receive:
                    </h3>
                    <ul className="space-y-1">
                      <li>• Prelude MiniBook (PDF) — immediate access</li>
                      <li>
                        • Founding Reader welcome briefing and context
                      </li>
                      <li>
                        • Early access to the first Canon frameworks
                      </li>
                      <li>
                        • Invitation to the first strategic masterclass
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4">
                    <NewsletterForm
                      variant="premium"
                      buttonText="Join the Founding Readers Circle →"
                    />
                  </div>

                  {/* Trust indicators */}
                  <div className="border-t border-gray-600/30 pt-4 text-center text-xs text-gray-400">
                    <div className="mb-2 flex items-center justify-center gap-4">
                      <span>No spam</span>
                      <span>•</span>
                      <span>One-click unsubscribe</span>
                      <span>•</span>
                      <span>Strategic, not noisy</span>
                    </div>
                    <p className="text-gray-500">
                      By joining, you agree to our{" "}
                      <a
                        href="/privacy"
                        className="text-softGold hover:underline"
                      >
                        Privacy Policy
                      </a>{" "}
                      and consent to receive occasional strategic
                      updates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Why this matters now */}
              <div className="rounded-2xl border border-gray-600/30 bg-black/30 p-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cream">
                  Why this matters now
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-softGold">•</span>
                    <span>
                      We are living through the most significant power
                      realignment since Rome — largely hidden behind
                      entertainment and convenience.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-softGold">•</span>
                    <span>
                      Most frameworks address symptoms. The Canon
                      addresses architecture — purpose, governance,
                      moral order, and destiny.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-softGold">•</span>
                    <span>
                      Those who master alignment now will quietly
                      define how families, organisations, and nations
                      are built in the next century.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom CTA + Share block */}
          <div className="space-y-8 border-t border-gray-600/30 pt-12 text-center">
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-400">
              The Founding Readers Circle is not a fan club; it is a
              working coalition of men and women who refuse to drift
              with the age. If you sense that mandate, this is your
              invitation.
            </p>

            {/* Share CTA */}
            <div className="mx-auto max-w-xl rounded-2xl border border-softGold/25 bg-black/40 p-6 text-sm">
              <p className="mb-3 flex items-center justify-center gap-2 text-[color:var(--color-on-secondary)/0.9]">
                <span role="img" aria-label="note">
                  📝
                </span>
                <span>
                  <strong>Share this Prelude</strong> with one person
                  who is ready for alignment.
                </span>
              </p>
              <button
                type="button"
                onClick={handleShareClick}
                className="inline-flex items-center gap-2 rounded-full bg-softGold px-5 py-2 text-sm font-semibold text-black transition hover:bg-softGold/90"
              >
                <span>Share the Prelude</span>
                <span aria-hidden>↗</span>
              </button>
              {copied && (
                <p className="mt-2 text-xs text-softGold/80">
                  Link copied. Send it to the one person who came to
                  mind immediately.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default SubscribePage;
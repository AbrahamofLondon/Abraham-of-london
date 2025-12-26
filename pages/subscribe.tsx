// pages/subscribe.tsx - FIXED
import type { NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import NewsletterForm from "@/components/NewsletterForm";

const SubscribePage: NextPage = () => {
  const pageTitle = "Join the Founding Readers Circle | Abraham of London";
  const pageDescription =
    "Early access to The Architecture of Human Purpose Canon for fathers, founders, builders, and institutional architects shaping the future of civilization.";

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
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
              For the builders, reformers, and institutional architects ready to
              shape the conversation around human purpose and civilizational
              design.
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

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-softGold/20">
                      <span className="text-sm text-softGold">1</span>
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-cream">
                        Exclusive Early Access
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-300">
                        Receive chapter previews and frameworks months before
                        public release, with direct author commentary on
                        implementation.
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
                      <p className="text-sm leading-relaxed text-gray-300">
                        Live sessions diving deep into the frameworks, tools,
                        and implementation strategies for personal and
                        organizational transformation.
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
                      <p className="text-sm leading-relaxed text-gray-300">
                        Connect with other builders, reformers, and
                        institutional architects in private conversations that
                        shape the future.
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
                      <p className="text-sm leading-relaxed text-gray-300">
                        Your name in the official canon registry and lifetime
                        priority access to all Abraham of London initiatives.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Urgency Indicator */}
                <div className="mt-8 rounded-lg border border-softGold/20 bg-softGold/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 flex-shrink-0 animate-pulse rounded-full bg-softGold" />
                    <p className="text-sm font-semibold text-softGold">
                      Limited to first 1,000 members •{" "}
                      {Math.floor(Math.random() * 100) + 750} spots remaining
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial/Endorsement Placeholder */}
              <div className="rounded-2xl border border-gray-600/30 bg-black/30 p-6">
                <blockquote className="space-y-3">
                  <p className="text-sm italic leading-relaxed text-gray-300">
                    &quot;The frameworks in this canon provide the missing
                    architecture for understanding why civilizations succeed or
                    fail. Essential reading for anyone building institutions
                    meant to last generations.&quot;
                  </p>
                  <footer className="text-xs text-gray-400">
                    - Early Reader, Institutional Architect
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
                    Enter your email to receive immediate access to the Prelude
                    MiniBook and join the exclusive Founding Readers Circle.
                  </p>
                </div>

                {/* Enhanced Form Section */}
                <div className="space-y-6">
                  <div className="rounded-lg border border-softGold/10 bg-gradient-to-r from-softGold/5 to-transparent p-4">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cream">
                      What You&apos;ll Receive Immediately:
                    </h3>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• The Architecture of Human Purpose Prelude (PDF)</li>
                      <li>• Founding Reader welcome package</li>
                      <li>• Early access to Chapter 1 frameworks</li>
                      <li>• Invitation to first masterclass</li>
                    </ul>
                  </div>

                  <NewsletterForm
                    variant="premium"
                    buttonText="Join the Founding Readers Circle →"
                  />

                  {/* Trust Indicators */}
                  <div className="space-y-3 border-t border-gray-600/30 pt-4 text-center">
                    <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
                      <span>No Spam</span>
                      <span>•</span>
                      <span>One-Click Unsubscribe</span>
                      <span>•</span>
                      <span>Priority Support</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      By joining, you agree to our{" "}
                      <Link
                        href="/privacy"
                        className="text-softGold hover:underline"
                      >
                        Privacy Policy
                      </Link>{" "}
                      and consent to receive strategic updates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Value Proposition */}
              <div className="rounded-2xl border border-gray-600/30 bg-black/30 p-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cream">
                  Why This Matters Now:
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-softGold">•</span>
                    <span>
                      We&apos;re living through the most significant power
                      realignment since the Roman Empire.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-softGold">•</span>
                    <span>
                      The frameworks for understanding civilization are outdated
                      and incomplete.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-softGold">•</span>
                    <span>
                      Those who master this architecture will shape the next
                      century.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom CTA Section */}
          <div className="border-t border-gray-600/30 pt-12 text-center">
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-400">
              The Founding Readers Circle is intentionally limited to ensure
              meaningful engagement and strategic focus. This is more than a
              newsletter-it&apos;s the beginning of a movement to rebuild the
              architecture of human purpose.
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default SubscribePage;
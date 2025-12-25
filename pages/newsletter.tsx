// pages/newsletter.tsx
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";

export default function NewsletterPage() {
  const pageTitle = "The Inner Circle";

  return (
    <Layout
      title={pageTitle}
      description="Join Abraham of London's Inner Circle - a curated newsletter for founders, fathers, and leaders who build with depth. Occasional, high-signal emails with early access to selected events."
    >
      <div className="min-h-screen bg-gradient-to-b from-charcoal to-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gold/20">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-amber-200/5" />
          <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.h1
                className="mb-6 font-serif text-4xl font-bold text-cream sm:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                The Inner Circle
              </motion.h1>
              <motion.p
                className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-gold/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Curated wisdom for founders, fathers, and leaders building
                lasting legacies. Thoughtful emails, sent when there is
                something genuinely worth your attention.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left Column - Benefits */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="space-y-8">
                  <div>
                    <h2 className="mb-4 font-serif text-2xl font-bold text-cream">
                      Why Join The Inner Circle?
                    </h2>
                    <p className="leading-relaxed text-gold/70">
                      Receive selective content that bridges ancient wisdom
                      with modern leadership and fatherhood-delivered directly
                      to your inbox, without noise or gimmicks.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold/20">
                        <span className="text-sm text-gold">→</span>
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold text-cream">
                          Early Event Insight
                        </h3>
                        <p className="text-sm leading-relaxed text-gold/60">
                          Hear first about upcoming salons, workshops, and
                          intimate gatherings. Where capacity is limited,
                          subscribers are often given early access to details.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold/20">
                        <span className="text-sm text-gold">→</span>
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold text-cream">
                          Exclusive Essays
                        </h3>
                        <p className="text-sm leading-relaxed text-gold/60">
                          Deep-dive writings on leadership, legacy, fatherhood,
                          and the art of meaningful conversation-often shared
                          here before appearing anywhere else.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold/20">
                        <span className="text-sm text-gold">→</span>
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold text-cream">
                          Private Resources
                        </h3>
                        <p className="text-sm leading-relaxed text-gold/60">
                          Access to curated reading lists, conversation
                          frameworks, and tools for personal and family growth
                          that are not broadly published.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold/20">
                        <span className="text-sm text-gold">→</span>
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold text-cream">
                          Community Insights
                        </h3>
                        <p className="text-sm leading-relaxed text-gold/60">
                          Occasional reflections drawn from the collective
                          wisdom of founders, leaders, and fathers within our
                          wider network-shared with discretion and respect.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                    <h4 className="mb-3 font-serif font-semibold text-cream">
                      What to Expect
                    </h4>
                    <ul className="space-y-2 text-sm text-gold/60">
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-gold/40" />
                        Typically 1-2 carefully crafted emails per month
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-gold/40" />
                        Early insight into selected events and gatherings
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-gold/40" />
                        Occasional exclusive interviews and Q&amp;A sessions
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-gold/40" />
                        No routine list rental or sale; your attention is
                        treated as a trust, not a commodity
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Signup Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:sticky lg:top-8"
              >
                <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-charcoal/80 to-charcoal/60 p-8 backdrop-blur-sm">
                  <div className="mb-8 text-center">
                    <h3 className="mb-3 font-serif text-2xl font-bold text-cream">
                      Join The Inner Circle
                    </h3>
                    <p className="text-gold/70">
                      Enter your email to receive curated insights and
                      occasional invitations. You&apos;re free to leave at any
                      time.
                    </p>
                  </div>

                  {/* Reuse your existing NewsletterForm component */}
                  {/* Ensure this component itself does NOT touch window/document at build time */}
                  {/* If it does, we'll refactor that next. */}
                  {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
                  {React.createElement(require("@/components/NewsletterForm").default, {
                    variant: "premium",
                    placeholder: "your.email@example.com",
                    buttonText: "Subscribe to Inner Circle",
                  })}

                  <div className="mt-6 space-y-2 text-center">
                    <p className="text-xs text-gold/40">
                      By subscribing, you consent to receive email
                      communications from Abraham of London about content,
                      events, and related offerings.
                    </p>
                    <p className="text-xs text-gold/40">
                      You can unsubscribe at any time via the link in each
                      email. For details on how we handle your data, please see
                      our{" "}
                      <Link
                        href="/privacy-policy"
                        className="text-gold underline underline-offset-2 hover:text-amber-200"
                      >
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/cookie-policy"
                        className="text-gold underline underline-offset-2 hover:text-amber-200"
                      >
                        Cookie Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                {/* Testimonials */}
                <div className="mt-8 space-y-4">
                  <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                    <p className="mb-3 text-sm italic leading-relaxed text-gold/70">
                      &quot;Abraham&apos;s newsletter is the one email I
                      actually make time to read. The reflections on legacy and
                      leadership have shifted how I show up at home and in the
                      boardroom.&quot;
                    </p>
                    <p className="text-sm font-semibold text-gold">
                      - Founder, Tech Company
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                    <p className="mb-3 text-sm italic leading-relaxed text-gold/70">
                      &quot;The curated nature of The Inner Circle means less
                      noise and more depth. The invite-only gatherings I heard
                      about through the list have been worth their weight in
                      gold.&quot;
                    </p>
                    <p className="text-sm font-semibold text-gold">
                      - CEO, Financial Services
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t border-gold/20 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-bold text-cream">
                Common Questions
              </h2>
              <p className="mx-auto max-w-2xl text-gold/70">
                A brief overview of what you are-and are not-signing up for
                when you join The Inner Circle.
              </p>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="mb-3 font-serif font-semibold text-cream">
                  How often will I receive emails?
                </h3>
                <p className="text-sm leading-relaxed text-gold/70">
                  Typically 1-2 times per month. Frequency may vary slightly
                  depending on season and relevance, but the bias is firmly
                  towards quality over volume.
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="mb-3 font-serif font-semibold text-cream">
                  Is this different from event notifications?
                </h3>
                <p className="text-sm leading-relaxed text-gold/70">
                  Yes. While subscribers may receive earlier insight into
                  selected events, the focus of The Inner Circle is depth:
                  essays, reflections, and frameworks that stand on their own,
                  whether or not you attend any gathering.
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="mb-3 font-serif font-semibold text-cream">
                  Can I suggest topics or ask questions?
                </h3>
                <p className="text-sm leading-relaxed text-gold/70">
                  In many cases, yes. Replies to the newsletter are monitored,
                  and topic suggestions from subscribers often influence future
                  essays and dialogues. We cannot promise an individual
                  response to every message, but all constructive feedback is
                  reviewed.
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="mb-3 font-serif font-semibold text-cream">
                  What if I want to unsubscribe?
                </h3>
                <p className="text-sm leading-relaxed text-gold/70">
                  Every email includes a one-click unsubscribe link. If you
                  prefer, you can also contact us using the details in our{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-gold underline underline-offset-2 hover:text-amber-200"
                  >
                    Privacy Policy
                  </Link>
                  , and we will action your request in line with applicable
                  data protection laws.
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="mb-3 font-serif font-semibold text-cream">
                  How is my data used?
                </h3>
                <p className="text-sm leading-relaxed text-gold/70">
                  Your email address is used to send you the newsletter and
                  related communications you have opted into. We may also use
                  high-level engagement metrics (opens, clicks) to refine what
                  we send. We do not sell your data and handle it in accordance
                  with our{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-gold underline underline-offset-2 hover:text-amber-200"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
// pages/newsletter.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link"; // ADDED: Import Link
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import NewsletterForm from "@/components/NewsletterForm";
import { getPageTitle } from "@/lib/siteConfig";

export default function NewsletterPage() {
  const pageTitle = "Newsletter";

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{getPageTitle(pageTitle)}</title>
        <meta
          name="description"
          content="Join Abraham of London's newsletter for curated reflections on leadership, legacy, and meaningful conversation. Occasional, high-signal emails with early access to selected events."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-charcoal to-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gold/20">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-amber-200/5" />
          <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.h1
                className="font-serif text-4xl font-bold text-cream sm:text-5xl lg:text-6xl mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                The Inner Circle
              </motion.h1>
              <motion.p
                className="mx-auto max-w-2xl text-xl text-gold/70 leading-relaxed mb-8"
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
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
              {/* Left Column - Benefits */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="space-y-8">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-cream mb-4">
                      Why Join The Inner Circle?
                    </h2>
                    <p className="text-gold/70 leading-relaxed">
                      Receive selective content that bridges ancient wisdom with
                      modern leadership and fatherhood—delivered directly to
                      your inbox, without noise or gimmicks.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center mt-1">
                        <span className="text-gold text-sm">→</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-cream mb-2">
                          Early Event Insight
                        </h3>
                        <p className="text-gold/60 text-sm leading-relaxed">
                          Hear first about upcoming salons, workshops, and
                          intimate gatherings. Where capacity is limited,
                          subscribers are often given early access to details.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center mt-1">
                        <span className="text-gold text-sm">→</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-cream mb-2">
                          Exclusive Essays
                        </h3>
                        <p className="text-gold/60 text-sm leading-relaxed">
                          Deep-dive writings on leadership, legacy, fatherhood,
                          and the art of meaningful conversation—often shared
                          here before appearing anywhere else.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center mt-1">
                        <span className="text-gold text-sm">→</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-cream mb-2">
                          Private Resources
                        </h3>
                        <p className="text-gold/60 text-sm leading-relaxed">
                          Access to curated reading lists, conversation
                          frameworks, and tools for personal and family growth
                          that are not broadly published.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center mt-1">
                        <span className="text-gold text-sm">→</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-cream mb-2">
                          Community Insights
                        </h3>
                        <p className="text-gold/60 text-sm leading-relaxed">
                          Occasional reflections drawn from the collective
                          wisdom of founders, leaders, and fathers within our
                          wider network—shared with discretion and respect.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                    <h4 className="font-serif font-semibold text-cream mb-3">
                      What to Expect
                    </h4>
                    <ul className="text-gold/60 text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-gold/40" />
                        Typically 1–2 carefully crafted emails per month
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-gold/40" />
                        Early insight into selected events and gatherings
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-gold/40" />
                        Occasional exclusive interviews and Q&amp;A sessions
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-gold/40" />
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
                  <div className="text-center mb-8">
                    <h3 className="font-serif text-2xl font-bold text-cream mb-3">
                      Join The Inner Circle
                    </h3>
                    <p className="text-gold/70">
                      Enter your email to receive curated insights and
                      occasional invitations. You&apos;re free to leave at any
                      time.
                    </p>
                  </div>

                  <NewsletterForm
                    variant="premium"
                    placeholder="your.email@example.com"
                    buttonText="Subscribe to Inner Circle"
                  />

                  <div className="mt-6 text-center space-y-2">
                    <p className="text-xs text-gold/40">
                      By subscribing, you consent to receive email
                      communications from Abraham of London about content,
                      events, and related offerings.
                    </p>
                    <p className="text-xs text-gold/40">
                      You can unsubscribe at any time via the link in each
                      email. For details on how we handle your data, please see
                      our {/* FIXED: Replace <a> with <Link> */}
                      <Link
                        href="/privacy-policy"
                        className="underline underline-offset-2 text-gold hover:text-amber-200"
                      >
                        Privacy Policy
                      </Link>{" "}
                      and {/* FIXED: Replace <a> with <Link> */}
                      <Link
                        href="/cookie-policy"
                        className="underline underline-offset-2 text-gold hover:text-amber-200"
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
                    <p className="text-gold/70 italic text-sm leading-relaxed mb-3">
                      &quot;Abraham&apos;s newsletter is the one email I
                      actually make time to read. The reflections on legacy and
                      leadership have shifted how I show up at home and in the
                      boardroom.&quot;
                    </p>
                    <p className="text-gold text-sm font-semibold">
                      — Founder, Tech Company
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                    <p className="text-gold/70 italic text-sm leading-relaxed mb-3">
                      &quot;The curated nature of The Inner Circle means less
                      noise and more depth. The invite-only gatherings I heard
                      about through the list have been worth their weight in
                      gold.&quot;
                    </p>
                    <p className="text-gold text-sm font-semibold">
                      — CEO, Financial Services
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 border-t border-gold/20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-cream mb-4">
                Common Questions
              </h2>
              <p className="text-gold/70 max-w-2xl mx-auto">
                A brief overview of what you are—and are not—signing up for when
                you join The Inner Circle.
              </p>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="font-serif font-semibold text-cream mb-3">
                  How often will I receive emails?
                </h3>
                <p className="text-gold/70 text-sm leading-relaxed">
                  Typically 1–2 times per month. Frequency may vary slightly
                  depending on season and relevance, but the bias is firmly
                  towards quality over volume.
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="font-serif font-semibold text-cream mb-3">
                  Is this different from event notifications?
                </h3>
                <p className="text-gold/70 text-sm leading-relaxed">
                  Yes. While subscribers may receive earlier insight into
                  selected events, the focus of The Inner Circle is depth:
                  essays, reflections, and frameworks that stand on their own,
                  whether or not you attend any gathering.
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="font-serif font-semibold text-cream mb-3">
                  Can I suggest topics or ask questions?
                </h3>
                <p className="text-gold/70 text-sm leading-relaxed">
                  In many cases, yes. Replies to the newsletter are monitored,
                  and topic suggestions from subscribers often influence future
                  essays and dialogues. We cannot promise an individual response
                  to every message, but all constructive feedback is reviewed.
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="font-serif font-semibold text-cream mb-3">
                  What if I want to unsubscribe?
                </h3>
                <p className="text-gold/70 text-sm leading-relaxed">
                  Every email includes a one-click unsubscribe link. If you
                  prefer, you can also contact us using the details in our{" "}
                  {/* FIXED: Replace <a> with <Link> */}
                  <Link
                    href="/privacy-policy"
                    className="underline underline-offset-2 text-gold hover:text-amber-200"
                  >
                    Privacy Policy
                  </Link>
                  , and we will action your request in line with applicable data
                  protection laws.
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="font-serif font-semibold text-cream mb-3">
                  How is my data used?
                </h3>
                <p className="text-gold/70 text-sm leading-relaxed">
                  Your email address is used to send you the newsletter and
                  related communications you have opted into. We may also use
                  high-level engagement metrics (opens, clicks) to refine what
                  we send. We do not sell your data and handle it in accordance
                  with our {/* FIXED: Replace <a> with <Link> */}
                  <Link
                    href="/privacy-policy"
                    className="underline underline-offset-2 text-gold hover:text-amber-200"
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

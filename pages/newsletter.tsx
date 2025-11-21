// pages/newsletter.tsx
import * as React from "react";
import Head from "next/head";
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
          content="Join Abraham of London's newsletter for exclusive insights on leadership, legacy, and transformative conversations. Get early access to events and private gatherings."
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
                Curated wisdom for founders, fathers, and leaders building lasting legacies.
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
                      Receive exclusive content that bridges ancient wisdom with modern leadership— 
                      delivered directly to your inbox.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center mt-1">
                        <span className="text-gold text-sm">→</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-cream mb-2">Early Event Access</h3>
                        <p className="text-gold/60 text-sm leading-relaxed">
                          Be the first to know about upcoming salons, workshops, and intimate gatherings before they're announced publicly.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center mt-1">
                        <span className="text-gold text-sm">→</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-cream mb-2">Exclusive Essays</h3>
                        <p className="text-gold/60 text-sm leading-relaxed">
                          Deep-dive writings on leadership, legacy, fatherhood, and the art of meaningful conversation.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center mt-1">
                        <span className="text-gold text-sm">→</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-cream mb-2">Private Resources</h3>
                        <p className="text-gold/60 text-sm leading-relaxed">
                          Access to curated reading lists, conversation frameworks, and tools for personal growth.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center mt-1">
                        <span className="text-gold text-sm">→</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-cream mb-2">Community Insights</h3>
                        <p className="text-gold/60 text-sm leading-relaxed">
                          Learn from the collective wisdom of other founders and leaders in our private network.
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
                        <span className="w-1 h-1 rounded-full bg-gold/40"></span>
                        Monthly curated essays and reflections
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-gold/40"></span>
                        Early announcements for events and gatherings
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-gold/40"></span>
                        Occasional exclusive interviews and Q&A sessions
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-gold/40"></span>
                        Zero spam, always respectful of your attention
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
                      Enter your email to receive exclusive content and early access to events.
                    </p>
                  </div>

                  <NewsletterForm 
                    variant="premium"
                    placeholder="your.email@example.com"
                    buttonText="Subscribe to Inner Circle"
                  />

                  <div className="mt-6 text-center">
                    <p className="text-xs text-gold/40">
                      Unsubscribe at any time. We respect your privacy and will never share your information.
                    </p>
                  </div>
                </div>

                {/* Testimonials */}
                <div className="mt-8 space-y-4">
                  <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                    <p className="text-gold/70 italic text-sm leading-relaxed mb-3">
                      "Abraham's newsletter is the one email I actually look forward to. The insights on legacy and leadership have been transformative for both my business and family life."
                    </p>
                    <p className="text-gold text-sm font-semibold">
                      — Founder, Tech Startup
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                    <p className="text-gold/70 italic text-sm leading-relaxed mb-3">
                      "The early access to events alone is worth subscribing. I've attended two Founder Salons that weren't announced publicly, and both were incredible experiences."
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
                Everything you need to know about The Inner Circle newsletter.
              </p>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="font-serif font-semibold text-cream mb-3">
                  How often will I receive emails?
                </h3>
                <p className="text-gold/70 text-sm leading-relaxed">
                  Typically 1-2 times per month. We believe in quality over quantity and will never flood your inbox. Each email is carefully crafted to provide meaningful value.
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="font-serif font-semibold text-cream mb-3">
                  Is this different from event notifications?
                </h3>
                <p className="text-gold/70 text-sm leading-relaxed">
                  Yes. While you'll get early access to event announcements, The Inner Circle focuses on deeper content—essays, reflections, and resources that complement our gatherings.
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="font-serif font-semibold text-cream mb-3">
                  Can I suggest topics or ask questions?
                </h3>
                <p className="text-gold/70 text-sm leading-relaxed">
                  Absolutely. Replies to our newsletters go directly to Abraham, and topic suggestions from subscribers often inspire future content and events.
                </p>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="font-serif font-semibold text-cream mb-3">
                  What if I want to unsubscribe?
                </h3>
                <p className="text-gold/70 text-sm leading-relaxed">
                  Every email includes a one-click unsubscribe link. We understand that interests change and respect your inbox space.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
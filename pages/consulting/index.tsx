// pages/consulting/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Users, Target, Globe } from "lucide-react";

import MandateStatement from "@/components/MandateStatement";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";

export default function ConsultingPage(): JSX.Element {
  return (
    <>
      <Head>
        <title>Consulting & Advisory - Abraham of London</title>
        <meta
          name="description"
          content="Faith-rooted strategy for founders, boards, and builders."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-charcoal to-black pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-amber-200/5" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <motion.header
              className="mb-12 max-w-3xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.p
                className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Advisory & Consulting
              </motion.p>
              <motion.h1
                className="mt-4 font-serif text-4xl font-semibold text-cream sm:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Faith-rooted strategy for
                <span className="block bg-gradient-to-r from-gold to-amber-200 bg-clip-text text-transparent">
                  founders, boards, and builders.
                </span>
              </motion.h1>
              <motion.p
                className="mt-6 text-lg leading-relaxed text-gold/70 sm:text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                I work with leaders who refuse to outsource responsibility —
                men and women who carry weight for families, organisations, and
                nations. The work sits at the intersection of strategy,
                governance, and character.
              </motion.p>

              <motion.div
                className="mt-8 flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/contact"
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gold to-amber-200 px-8 py-4 text-lg font-semibold text-charcoal shadow-2xl transition-all hover:shadow-3xl"
                >
                  <span className="relative z-10">Request a consultation</span>
                  <motion.div
                    className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.8 }}
                  />
                </Link>
                <Link
                  href="/events"
                  className="rounded-xl border border-gold/40 px-8 py-4 text-lg font-semibold text-gold transition-all hover:border-gold hover:bg-gold/10"
                >
                  View upcoming salons
                </Link>
              </motion.div>
            </motion.header>
          </div>
        </section>

        {/* Mandate + Strategic Funnel */}
        <section className="border-t border-gold/15 bg-charcoal/90">
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
            <MandateStatement />
          </div>

          {/* Global engagement pathways – consulting, rooms, events */}
          <StrategicFunnelStrip />
        </section>

        {/* Service Pillars */}
        <section className="relative py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="grid gap-8 lg:grid-cols-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              {[
                {
                  icon: Users,
                  title: "Board & Executive Strategy",
                  description:
                    "Support for boards, founders, and C-suite on strategy, governance, and execution — with an eye on consequence, culture, and long-term legitimacy.",
                  points: [
                    "Strategy clarification and scenario thinking",
                    "Board-level challenge, not flattery",
                    "Market, political, and stakeholder mapping",
                  ],
                },
                {
                  icon: Target,
                  title: "Founder & Leadership Advisory",
                  description:
                    "One-to-one advisory for founders and senior leaders: decision support, crisis navigation, and building strategy that honours both calling and commercial reality.",
                  points: [
                    "Confidential sounding board",
                    "Decision frameworks & escalation ladders",
                    "Personal disciplines, not just business hacks",
                  ],
                },
                {
                  icon: Globe,
                  title: "Africa & Frontier Markets",
                  description:
                    "Advisory for investors and operators engaging Nigeria and wider Africa — with honest context on risk, opportunity, and political reality.",
                  points: [
                    "Go-to-market and partnership strategy",
                    "Public–private and stakeholder navigation",
                    "Governance and execution discipline",
                  ],
                },
              ].map((service, index) => (
                <motion.div
                  key={service.title}
                  className="group rounded-2xl border border-gold/20 bg-charcoal/60 p-8 backdrop-blur transition-all hover:border-gold/40 hover:bg-charcoal/70"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <service.icon className="mb-4 h-12 w-12 text-gold" />
                  <h3 className="mb-4 font-serif text-xl font-semibold text-cream">
                    {service.title}
                  </h3>
                  <p className="mb-6 leading-relaxed text-gold/70">
                    {service.description}
                  </p>
                  <ul className="space-y-3">
                    {service.points.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm text-gold/70"
                      >
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="grid gap-12 lg:grid-cols-[3fr,2fr]"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div>
                <motion.h2
                  className="mb-6 font-serif text-3xl font-semibold text-cream"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  How I work
                </motion.h2>
                <motion.p
                  className="mb-8 text-lg leading-relaxed text-gold/70"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  I am not a motivational coach. I am a strategist and advisor.
                  The work is structured, documented, and accountable — but
                  always anchored in conviction and integrity.
                </motion.p>
                <motion.ol
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  {[
                    {
                      step: "Initial call",
                      description:
                        "30–45 minutes to understand context, stakes, and fit.",
                    },
                    {
                      step: "Diagnostic",
                      description:
                        "Clear articulation of the real problem, not the fashionable one.",
                    },
                    {
                      step: "Engagement",
                      description:
                        "Defined scope, cadence, and measures of success.",
                    },
                  ].map((item, index) => (
                    <motion.li
                      key={item.step}
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-semibold text-charcoal">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-cream font-semibold">
                          {item.step}
                        </h4>
                        <p className="mt-1 text-gold/70">{item.description}</p>
                      </div>
                    </motion.li>
                  ))}
                </motion.ol>
              </div>

              <motion.aside
                className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/5 to-gold/10 p-8"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="mb-4 font-serif text-xl font-semibold text-cream">
                  Is this for you?
                </h3>
                <p className="mb-6 leading-relaxed text-gold/80">
                  This advisory is for leaders who:
                </p>
                <ul className="mb-6 space-y-3">
                  {[
                    "Carry responsibility for others' livelihoods",
                    "Want strategy that respects both God and data",
                    "Are willing to be challenged, not entertained",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-gold/80"
                    >
                      <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mb-6 text-gold/80">
                  If that sounds like you, send a short context note and we
                  will decide — together — if there is a serious mandate.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/60 px-6 py-3 font-semibold text-gold transition-all hover:bg-gold hover:text-charcoal"
                >
                  Share context
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.aside>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
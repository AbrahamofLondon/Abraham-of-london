// pages/consulting/index.tsx
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Users, Target, Globe } from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import RouteHero from "@/components/RouteHero";

export default function ConsultingPage(): JSX.Element {
  return (
    <Layout
      title="Consulting & Advisory - Abraham of London"
      transparentHeader
      className="bg-gradient-to-b from-charcoal to-black"
    >
      {/* Unified hero driven by hero-banners.ts */}
      <RouteHero bannerKey="consulting" />

      {/* Mandate + Strategic Funnel */}
      <section className="border-t border-gold/15 bg-charcoal/90">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6 lg:px-8 md:pb-10 md:pt-10">
          <MandateStatement />
        </div>

        <StrategicFunnelStrip />
      </section>

      {/* Service Pillars */}
      <section className="relative py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid gap-6 md:gap-8 lg:grid-cols-3"
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
                className="group rounded-2xl border border-gold/20 bg-charcoal/60 p-6 backdrop-blur transition-all hover:border-gold/40 hover:bg-charcoal/70 md:p-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <service.icon className="mb-4 h-10 w-10 text-gold md:h-12 md:w-12" />
                <h3 className="mb-4 font-serif text-lg font-semibold text-cream md:text-xl">
                  {service.title}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-gold/70 md:text-base">
                  {service.description}
                </p>
                <ul className="space-y-3">
                  {service.points.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gold/70"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                      <span className="text-xs md:text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid gap-8 md:gap-12 lg:grid-cols-[3fr,2fr]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div>
              <motion.h2
                className="mb-6 font-serif text-2xl font-semibold text-cream md:text-3xl"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                How I work
              </motion.h2>

              <motion.p
                className="mb-6 text-base leading-relaxed text-gold/70 md:mb-8 md:text-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                I am not a motivational coach. I am a strategist and advisor. The
                work is structured, documented, and accountable — but always
                anchored in conviction and integrity.
              </motion.p>

              <motion.ol
                className="space-y-4 md:space-y-6"
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
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-semibold text-charcoal md:h-8 md:w-8">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-cream md:text-lg">
                        {item.step}
                      </h4>
                      <p className="mt-1 text-sm text-gold/70 md:text-base">
                        {item.description}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </motion.ol>
            </div>

            <motion.aside
              className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/5 to-gold/10 p-6 md:p-8"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="mb-4 font-serif text-lg font-semibold text-cream md:text-xl">
                Is this for you?
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-gold/80 md:mb-6 md:text-base">
                This advisory is for leaders who:
              </p>
              <ul className="mb-4 space-y-2 text-sm text-gold/80 md:mb-6 md:space-y-3 md:text-base">
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
              <p className="mb-4 text-sm text-gold/80 md:mb-6 md:text-base">
                If that sounds like you, send a short context note and we will
                decide — together — if there is a serious mandate.
              </p>
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/60 px-4 py-2 text-sm font-semibold text-gold transition-all hover:bg-gold hover:text-charcoal md:px-6 md:py-3 md:text-base sm:w-auto"
              >
                Share context
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.aside>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
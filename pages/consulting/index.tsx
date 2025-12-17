import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Users, Target, Globe, ShieldCheck } from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";

export default function ConsultingPage(): JSX.Element {
  return (
    <Layout
      title="Advisory & Strategy"
      description="Strategic counsel for founders and boards who refuse to outsource responsibility."
      className="bg-black text-cream"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
        
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <motion.header
            className="max-w-3xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Private Advisory
            </p>

            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Strategy for those who 
              <span className="block text-gold/90">carry the weight.</span>
            </h1>

            <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
              I work with leaders who refuse to outsource responsibility — founders, boards, and builders 
              who carry weight for families, organisations, and nations. The work sits at the intersection 
              of high-stakes strategy and personal character.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/contact"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                Request Consultation
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-widest text-cream transition-colors hover:bg-white/10"
              >
                View Salons
              </Link>
            </div>
          </motion.header>
        </div>
      </section>

      {/* Mandate + Strategic Funnel */}
      <section className="bg-black py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <MandateStatement />
        </div>
        <div className="mt-16">
           <StrategicFunnelStrip />
        </div>
      </section>

      {/* Service Pillars */}
      <section className="relative bg-zinc-950 py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="mb-16 max-w-2xl">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">Areas of Engagement</h2>
            <p className="mt-4 text-gray-400">Formal advisory focused on consequence, culture, and long-term legitimacy.</p>
          </div>

          <motion.div
            className="grid gap-8 lg:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {[
              {
                icon: Users,
                title: "Board & Executive Strategy",
                description: "Deep support for C-suite and boards on governance and execution with an eye on multi-generational impact.",
                points: ["Scenario thinking & clarification", "Board-level challenge (not flattery)", "Political & stakeholder mapping"],
              },
              {
                icon: Target,
                title: "Founder Advisory",
                description: "One-to-one confidential support for decision makers navigating crises or scaling significant mandates.",
                points: ["Confidential sounding board", "Decision frameworks", "Escalation discipline"],
              },
              {
                icon: Globe,
                title: "Frontier Market Strategy",
                description: "Specialist advisory for operators engaging Nigeria and wider Africa with honest context on risk and reality.",
                points: ["Partnership & Entry strategy", "Stakeholder navigation", "Execution discipline"],
              },
            ].map((service, index) => (
              <div
                key={service.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-gold/30 hover:bg-white/[0.04]"
              >
                <service.icon className="mb-6 h-10 w-10 text-gold/80" />
                <h3 className="mb-4 font-serif text-xl font-semibold text-cream group-hover:text-gold transition-colors">
                  {service.title}
                </h3>
                <p className="mb-8 text-sm leading-relaxed text-gray-400">
                  {service.description}
                </p>
                <ul className="space-y-3">
                  {service.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs text-gray-300">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold/60" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Methodology & Qualification */}
      <section className="bg-black py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-white">How I Work</h2>
              <p className="mt-6 text-lg text-gray-400 leading-relaxed">
                I am not a motivational coach. I am a strategist and advisor. The work is structured, 
                documented, and accountable — anchored in conviction and integrity.
              </p>

              <div className="mt-12 space-y-8">
                {[
                  { step: "Initial Call", desc: "45 minutes to understand context, stakes, and fit." },
                  { step: "Diagnostic", desc: "Clear articulation of the real problem, not the fashionable one." },
                  { step: "Engagement", desc: "Defined scope, cadence, and clear measures of success." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 font-mono text-sm font-bold text-gold border border-gold/20">
                      0{i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold uppercase tracking-widest text-cream">{item.step}</h4>
                      <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-12">
              <ShieldCheck className="mb-6 h-10 w-10 text-gold" />
              <h3 className="font-serif text-2xl font-semibold text-cream">Is this for you?</h3>
              <p className="mt-4 text-gray-400">This advisory is reserved for leaders who:</p>
              
              <ul className="mt-8 space-y-4">
                {[
                  "Carry responsibility for others' livelihoods",
                  "Want strategy that respects both Faith and Data",
                  "Are willing to be challenged, not entertained",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-cream/90">
                    <div className="h-1.5 w-1.5 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-12">
                <Link
                  href="/contact"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/50 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black"
                >
                  Share Context Note
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-4 text-center text-[10px] uppercase tracking-tighter text-gray-500">
                  strictly confidential · limited mandates available
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
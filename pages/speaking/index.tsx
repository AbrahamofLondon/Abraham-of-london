/* pages/speaking/index.tsx — SPEAKING & ROOMS (INTEGRITY MODE) */
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Target,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Workflow,
  GraduationCap,
  Layers,
  Hammer,
  MessageSquare,
  Mic,
  Calendar,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

/**
 * STRATEGIC FIX: INTEGRITY MODE
 * All engagement formats and materials are synchronized with the central vault.
 */
const SpeakingPage: NextPage = () => {
  const speakingFormats = [
    {
      format: "Keynote Addresses",
      description: "Strategic frameworks for leadership retreats and board away days.",
      duration: "45-90 minutes",
      audience: "Boards & Executives",
      icon: Mic,
      topics: ["The Seven Domains of Purpose", "Leadership and Reality", "Building to Outlast"]
    },
    {
      format: "Chatham Rooms",
      description: "Private, off-record conversations held under the Chatham House Rule.",
      duration: "2-3 hours",
      audience: "6-12 Curated Leaders",
      icon: Users,
      topics: ["Fatherhood and Power", "Founder Legitimacy", "Generational Stewardship"]
    },
    {
      format: "Strategy Salons",
      description: "Closed-room intensives on specific institutional strategic challenges.",
      duration: "Half-day / Full-day",
      audience: "Board members & Founders",
      icon: Target,
      topics: ["Decision Architecture", "Institutional Health", "Frontier Market Strategy"]
    }
  ];

  return (
    <Layout
      title="Speaking & Rooms"
      description="Keynotes, Chatham Rooms, and strategic salons built on canonical doctrine and implementation tooling."
      className="bg-black text-cream"
    >
      <main>
        {/* HERO: SUBSTANCE OVER PERFORMANCE */}
        <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Speaking · Rooms · Strategy</p>
              <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Speaking without <span className="italic text-gold">theatrics</span>
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
                Keynotes, Chatham Rooms, and salons built on canonical doctrine — designed for leaders who want depth, not performance.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="#formats" className="rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black hover:bg-gold/80 transition-all flex items-center justify-center">
                  View Formats <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/contact?source=speaking" className="rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold hover:bg-gold/15 transition-all flex items-center justify-center">
                  Discuss a Room <MessageSquare className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* MANDATE */}
        <section className="bg-black py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4"><MandateStatement /></div>
        </section>

        {/* SPEAKING FORMATS */}
        <section id="formats" className="bg-zinc-950 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-serif text-3xl font-semibold text-white mb-16">Engagement Formats</h2>
            <div className="grid gap-8 lg:grid-cols-3">
              {speakingFormats.map((f, i) => (
                <div key={i} className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 flex flex-col h-full">
                  <div className="mb-6 flex items-center justify-between">
                    <f.icon className="h-8 w-8 text-gold/60" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{f.duration}</span>
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-white mb-4">{f.format}</h3>
                  <p className="text-sm text-gray-400 mb-6 flex-grow">{f.description}</p>
                  <div className="mb-6">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gold/60 block mb-3">Core Topics</span>
                    <ul className="space-y-2">
                      {f.topics.map((t, idx) => (
                        <li key={idx} className="text-xs text-gray-500 flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-gold/40" /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-6 border-t border-white/5">
                    <span className="text-[10px] font-mono text-gray-600 uppercase">Audience: {f.audience}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SPEAKING MATERIALS FOUNDATION */}
        <section className="bg-black py-20 border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-serif text-3xl font-semibold text-white mb-16 text-center">Built on the Work</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Seven Domains", href: "/blog/ultimate-purpose-of-man", icon: Layers, status: "public" },
                { title: "Strategic Tooling", href: "/resources/strategic-frameworks", icon: Workflow, status: "public" },
                { title: "Founder Catechism", href: "/canon/builders-catechism", icon: Hammer, status: "inner-circle" },
                { title: "Institutional Canon", href: "/canon", icon: BookOpen, status: "inner-circle" }
              ].map((m, i) => (
                <Link key={i} href={m.href} className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-gold/30 transition-all text-center">
                  <m.icon className="h-6 w-6 text-gold mx-auto mb-4" />
                  <h4 className="text-sm font-bold text-white mb-1">{m.title}</h4>
                  <span className="text-[9px] font-mono uppercase text-gray-600">{m.status}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-zinc-950 py-20 border-t border-gold/10">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h3 className="font-serif text-3xl text-white mb-6">Substance Over Performance</h3>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">No motivational noise. No generic content. Just canonical doctrine and strategic architecture for serious leaders.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact?source=speaking" className="bg-gold px-8 py-4 rounded-xl text-black font-bold uppercase tracking-widest hover:bg-gold/80 transition-all">Discuss Engagement</Link>
              <Link href="/chatham-rooms" className="border border-gold/40 px-8 py-4 rounded-xl text-gold font-bold uppercase tracking-widest hover:bg-gold/10 transition-all">Learn About Rooms</Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default SpeakingPage;
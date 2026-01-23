/* pages/fatherhood/index.tsx — FATHERHOOD DOMAIN (INTEGRITY MODE) */
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Users as UsersIcon,
  Target as TargetIcon,
  BookOpen as BookOpenIcon,
  Hammer,
  Landmark,
  Shield,
  Home,
  ArrowRight,
  Compass,
  CheckCircle,
  GraduationCap,
  Clock,
  Award,
  Castle
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

const FatherhoodPage: NextPage = () => {
  const fatherhoodEssays = [
    {
      title: "Fathering Without Fear",
      description: "Complete framework for courageous fatherhood beyond sentimentality",
      href: "/blog/fathering-without-fear",
      readTime: "18 min",
      icon: Shield,
      tags: ["courage", "framework"]
    },
    {
      title: "The Brotherhood Code",
      description: "Principles for building lasting brotherhood and accountability",
      href: "/blog/the-brotherhood-code",
      readTime: "25 min",
      icon: UsersIcon,
      tags: ["brotherhood", "accountability"]
    },
    {
      title: "Leadership Begins at Home",
      description: "How household governance shapes organizational leadership",
      href: "/blog/leadership-begins-at-home",
      readTime: "12 min",
      icon: Home,
      tags: ["leadership", "governance"]
    }
  ];

  const fatherhoodTools = [
    {
      title: "Canon Household Charter",
      description: "Template for family governance and household operating principles",
      href: "/resources/canon-household-charter",
      status: 'inner-circle' as const,
      icon: Home,
      purpose: "Family governance"
    },
    {
      title: "Fatherhood Impact Framework",
      description: "Measurement framework for fatherhood's long-term impact",
      href: "/resources/fatherhood-impact-framework",
      status: 'public' as const,
      icon: TargetIcon,
      purpose: "Impact measurement"
    },
    {
      title: "Multi-Generational Legacy Ledger",
      description: "Framework for legacy mapping across financial and intellectual domains",
      href: "/resources/multi-generational-legacy-ledger",
      status: 'inner-circle' as const,
      icon: Landmark,
      purpose: "Legacy architecture"
    }
  ];

  return (
    <Layout
      title="Fatherhood"
      description="Practical frameworks and tools for men who carry the weight of family, legacy, and responsibility."
      className="bg-black text-cream"
    >
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">The Work That Matters</p>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Fatherhood
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
              Not sentimentality. The practical work of building men who build families that build futures.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="#essays" className="rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black hover:bg-gold/80 transition-all flex items-center justify-center">
                Read Essays <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/resources/fatherhood-impact-framework" className="rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold hover:bg-gold/15 transition-all flex items-center justify-center">
                Impact Framework <TargetIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MANDATE */}
      <section className="bg-black py-16">
        <div className="mx-auto max-w-6xl px-4"><MandateStatement /></div>
      </section>

      {/* ESSAYS GRID */}
      <section id="essays" className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-serif text-3xl font-semibold text-white mb-16">Essays & Field Notes</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {fatherhoodEssays.map((essay, idx) => (
              <Link key={idx} href={essay.href} className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]">
                <div className="mb-4 flex items-start justify-between">
                  <essay.icon className="h-6 w-6 text-gold/60" />
                  <span className="text-xs text-gray-500">{essay.readTime}</span>
                </div>
                <h3 className="mb-3 font-serif text-xl font-semibold text-white group-hover:text-gold">{essay.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400 mb-6">{essay.description}</p>
                <div className="flex flex-wrap gap-2">
                  {essay.tags.map(t => <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-500">{t}</span>)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* IMPLEMENTATION TOOLS */}
      <section className="bg-black py-20 lg:py-28 border-t border-gold/10">
        <div className="mx-auto max-w-6xl px-4 text-center mb-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">The Work in Practice</p>
          <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">Tools & Frameworks</h2>
        </div>
        <div className="mx-auto max-w-6xl px-4 grid gap-6 lg:grid-cols-3">
          {fatherhoodTools.map((tool, idx) => (
            <div key={idx} className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]">
              <div className="mb-6 flex items-center justify-between">
                <div className="rounded-xl border border-gold/25 bg-gold/10 p-3"><tool.icon className="h-6 w-6 text-gold" /></div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gold/60">{tool.status}</span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-white mb-2 group-hover:text-gold transition-colors">{tool.title}</h3>
              <p className="text-sm text-gray-400 mb-6">{tool.description}</p>
              <Link href={tool.href} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold hover:text-gold/80">
                {tool.status === 'public' ? 'Download' : 'Access Preview'} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-zinc-950 py-20 lg:py-28 border-t border-gold/10">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-serif text-3xl font-semibold text-white mb-6">Build what lasts</h2>
          <p className="text-gray-400 mb-10 max-w-2xl mx-auto">The work of fatherhood is the work of civilization. Start with one framework. Implement one system. Strategy compounds across generations.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/resources/canon-household-charter" className="rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black hover:bg-gold/80 transition-all">
              Household Charter
            </Link>
            <Link href="/inner-circle?source=fatherhood" className="rounded-xl border border-gold/60 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold hover:bg-gold/10 transition-all">
              Join Inner Circle
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FatherhoodPage;
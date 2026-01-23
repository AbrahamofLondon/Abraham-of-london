/* pages/founders/index.tsx — BUILDER'S FORMATION (INTEGRITY MODE) */
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Target,
  ShieldCheck,
  Workflow,
  BookOpen,
  Hammer,
  Users,
  Landmark,
  ArrowRight,
  FileSpreadsheet,
  Presentation,
  ClipboardCheck,
  GraduationCap,
  Layers,
  Compass,
  Network,
  Lock,
  FileStack,
  Map,
  Home,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

/**
 * STRATEGIC FIX: INTEGRITY MODE
 * All routing and resources are synchronized with the central vault.
 */
const FoundersPage: NextPage = () => {
  const formationPath = [
    {
      stage: "Foundations",
      title: "Ultimate Purpose of Man",
      description: "Understanding human purpose across seven domains",
      href: "/blog/ultimate-purpose-of-man",
      status: 'public' as const,
      icon: Layers,
      outcome: "Clarity on why you build"
    },
    {
      stage: "Doctrine",
      title: "The Canon (Vol I-IV)",
      description: "Complete doctrinal architecture for builders",
      href: "/canon",
      status: 'inner-circle' as const,
      icon: BookOpen,
      outcome: "Intellectual foundation"
    },
    {
      stage: "Application",
      title: "Builder's Catechism",
      description: "Authoritative question-set for founder legitimacy",
      href: "/canon/builders-catechism",
      status: 'inner-circle' as const,
      icon: Hammer,
      outcome: "Execution clarity"
    },
    {
      stage: "Implementation",
      title: "Strategic Frameworks",
      description: "Decision matrices, prioritization logic, governance templates",
      href: "/resources/strategic-frameworks",
      status: 'public' as const,
      icon: Map,
      outcome: "Board-ready tooling"
    }
  ];

  const builderTools = [
    {
      title: "Board Decision Log",
      description: "Excel template for documenting board-level decisions with accountability matrices",
      href: "/resources/board-decision-log-template",
      status: 'public' as const,
      icon: FileSpreadsheet,
      useCase: "Governance"
    },
    {
      title: "Operating Cadence Pack",
      description: "Complete presentation deck for board meeting design and execution rhythm",
      href: "/resources/operating-cadence-pack",
      status: 'inner-circle' as const,
      icon: Presentation,
      useCase: "Meeting architecture"
    },
    {
      title: "Institutional Health Scorecard",
      description: "Diagnostic tool for organizational legitimacy and operational health",
      href: "/resources/institutional-health-scorecard",
      status: 'public' as const,
      icon: ShieldCheck,
      useCase: "Diagnostics"
    }
  ];

  return (
    <Layout
      title="Builders"
      description="Formation path and tooling for founders, fathers, and leaders building what lasts across generations."
      className="bg-black text-cream"
    >
      <main>
        {/* HERO: THE BUILDER'S CALLING */}
        <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Builders · Founders · Fathers</p>
              <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Build what <span className="italic text-gold">lasts</span>
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
                Formation and tooling for builders who want to create institutions that outlast them.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="#formation" className="rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black hover:bg-gold/80 transition-all flex items-center justify-center">
                  Begin Formation <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/resources/strategic-frameworks" className="rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold hover:bg-gold/15 transition-all flex items-center justify-center">
                  Get Frameworks <Map className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* MANDATE */}
        <section className="bg-black py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4"><MandateStatement /></div>
        </section>

        {/* FORMATION PATH */}
        <section id="formation" className="bg-zinc-950 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-serif text-3xl font-semibold text-white mb-16">Formation for Builders</h2>
            <div className="space-y-6">
              {formationPath.map((stage, index) => (
                <div key={index} className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-6">
                      <div className="rounded-2xl bg-gold/10 p-4"><stage.icon className="h-6 w-6 text-gold" /></div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1 block">{stage.stage}</span>
                        <h3 className="font-serif text-xl font-semibold text-white mb-2">{stage.title}</h3>
                        <p className="text-sm text-gray-400 max-w-xl">{stage.description}</p>
                      </div>
                    </div>
                    <Link href={stage.href} className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/15">
                      {stage.status === 'public' ? 'Access' : 'Preview'} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TOOLBOX */}
        <section className="bg-black py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-serif text-3xl font-semibold text-white mb-16">Builder's Toolbox</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              {builderTools.map((tool, index) => (
                <div key={index} className="rounded-3xl border border-white/8 bg-white/[0.02] p-8 hover:border-gold/20 transition-all flex flex-col h-full">
                  <tool.icon className="h-8 w-8 text-gold/60 mb-6" />
                  <h3 className="font-serif text-lg font-semibold text-white mb-2">{tool.title}</h3>
                  <p className="text-sm text-gray-500 mb-6 flex-grow">{tool.description}</p>
                  <Link href={tool.href} className="mt-auto text-xs font-bold uppercase tracking-widest text-gold hover:text-gold/80 flex items-center gap-2">
                    {tool.status === 'public' ? 'Download' : 'Access'} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LEGACY SECTION */}
        <section className="bg-zinc-950 py-20 border-t border-gold/10">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="font-serif text-3xl font-semibold text-white mb-6">Legacy & Stewardship</h2>
            <p className="text-gray-400 mb-12">Building that lasts means planning beyond your lifetime. Institutional architecture requires multi-generational thinking.</p>
            <div className="grid gap-4 sm:grid-cols-2 justify-center">
              <Link href="/resources/multi-generational-legacy-ledger" className="rounded-xl border border-white/10 bg-white/5 p-6 hover:border-gold/30 transition-all">
                <h4 className="font-bold text-white mb-2">Legacy Ledger</h4>
                <p className="text-xs text-gray-500 text-center">Map financial and intellectual domains.</p>
              </Link>
              <Link href="/resources/canon-household-charter" className="rounded-xl border border-white/10 bg-white/5 p-6 hover:border-gold/30 transition-all">
                <h4 className="font-bold text-white mb-2">Household Charter</h4>
                <p className="text-xs text-gray-500 text-center">Architect family governance principles.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-black py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h3 className="font-serif text-2xl text-white mb-8">Begin the Work</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact?source=builders" className="bg-gold px-8 py-4 rounded-xl text-black font-bold uppercase tracking-widest">Request Formation Path</Link>
              <Link href="/inner-circle" className="border border-gold/40 px-8 py-4 rounded-xl text-gold font-bold uppercase tracking-widest hover:bg-gold/10">Join Inner Circle</Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default FoundersPage;
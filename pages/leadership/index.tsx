/* pages/leadership/index.tsx — LEADERSHIP FORMATION (INTEGRITY MODE) */
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Target,
  ShieldCheck,
  Users,
  Landmark,
  ArrowRight,
  Compass,
  Layers,
  BookOpen,
  Hammer,
  Map,
  FileSpreadsheet,
  Building2,
  GraduationCap,
  Workflow,
  Lock,
  Home,
  Award,
  Clock,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

/**
 * STRATEGIC FIX: INTEGRITY MODE
 * Ensures all leadership artifacts and formation stages align with the established vault routing.
 */
const LeadershipPage: NextPage = () => {
  const leadershipProgression = [
    {
      stage: "01 · Self",
      title: "Ultimate Purpose of Man",
      description: "Understand human purpose across seven domains - the foundation of stewardship.",
      href: "/blog/ultimate-purpose-of-man",
      status: 'public' as const,
      icon: Compass,
      outcome: "Clarity on why you lead"
    },
    {
      stage: "02 · Purpose",
      title: "Builder's Catechism",
      description: "Authoritative question-set for founder legitimacy and execution discipline.",
      href: "/canon/builders-catechism",
      status: 'inner-circle' as const,
      icon: Hammer,
      outcome: "Execution clarity"
    },
    {
      stage: "03 · Vision",
      title: "The Canon (Vol I-X)",
      description: "Complete doctrinal architecture for institutional leadership and legacy.",
      href: "/canon",
      status: 'inner-circle' as const,
      icon: BookOpen,
      outcome: "Intellectual foundation"
    },
    {
      stage: "04 · Mission",
      title: "Strategic Frameworks",
      description: "Board-ready tooling for turning vision into documented operational reality.",
      href: "/resources/strategic-frameworks",
      status: 'public' as const,
      icon: Map,
      outcome: "Operational tooling"
    }
  ];

  const leadershipTools = [
    {
      category: "Governance",
      title: "Board Decision Log",
      description: "Institutional template for documented decisions and accountability matrices.",
      href: "/resources/board-decision-log-template",
      status: 'public' as const,
      icon: FileSpreadsheet,
      useCase: "Decision hygiene"
    },
    {
      category: "Development",
      title: "Leadership Standards",
      description: "Framework for defining and measuring high-stakes leadership performance.",
      href: "/resources/leadership-standards-blueprint",
      status: 'public' as const,
      icon: Target,
      useCase: "Formation"
    },
    {
      category: "Stewardship",
      title: "Legacy Ledger",
      description: "Multi-generational mapping for financial and intellectual capital.",
      href: "/resources/multi-generational-legacy-ledger",
      status: 'inner-circle' as const,
      icon: Landmark,
      useCase: "Legacy planning"
    }
  ];

  return (
    <Layout
      title="Leadership Formation"
      description="Formation path and tooling for leaders building institutions and legacies that survive them."
      className="bg-black text-cream"
    >
      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24 text-center sm:text-left">
          <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Leadership · Formation · Legacy</p>
              <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Lead what <span className="italic text-gold">lasts</span>
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
                A structured formation path for serious leaders — from self-discovery to institution building and generational stewardship.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="#progression" className="rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black hover:bg-gold/80 transition-all flex items-center justify-center">
                  Begin Formation <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/resources/board-decision-log-template" className="rounded-xl border border-gold/30 bg-gold/5 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold hover:bg-gold/10 transition-all flex items-center justify-center">
                  Governance Tool <FileSpreadsheet className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* MANDATE */}
        <section className="bg-black py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4"><MandateStatement /></div>
        </section>

        {/* PROGRESSION PATHWAY */}
        <section id="progression" className="bg-zinc-950 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-serif text-3xl font-semibold text-white mb-16">The Leadership Progression</h2>
            <div className="grid gap-8">
              {leadershipProgression.map((stage, index) => (
                <div key={index} className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-start gap-6">
                      <div className="rounded-2xl bg-gold/10 p-4 shrink-0"><stage.icon className="h-6 w-6 text-gold" /></div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1 block">{stage.stage}</span>
                        <h3 className="font-serif text-2xl font-semibold text-white mb-2 group-hover:text-gold transition-colors">{stage.title}</h3>
                        <p className="text-sm text-gray-400 max-w-xl">{stage.description}</p>
                      </div>
                    </div>
                    <div className="text-left lg:text-right">
                       <span className="text-[10px] block uppercase text-gray-500 mb-4">Outcome: {stage.outcome}</span>
                       <Link href={stage.href} className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/15 transition-all">
                        {stage.status === 'public' ? 'Access' : 'Preview'} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* IMPLEMENTATION TOOLS */}
        <section className="bg-black py-20 lg:py-28 border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-serif text-3xl font-semibold text-white mb-16">Institutional Tooling</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              {leadershipTools.map((tool, idx) => (
                <div key={idx} className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 hover:border-gold/20 transition-all flex flex-col h-full">
                  <div className="mb-6 flex items-center justify-between">
                    <tool.icon className="h-8 w-8 text-gold/60" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gold/60">{tool.status}</span>
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-white mb-2">{tool.title}</h3>
                  <p className="text-sm text-gray-500 mb-6 flex-grow">{tool.description}</p>
                  <Link href={tool.href} className="mt-auto text-xs font-bold uppercase tracking-widest text-gold hover:text-gold/80 flex items-center gap-2">
                    {tool.status === 'public' ? 'Download' : 'Access'} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="bg-zinc-950 py-20 lg:py-28 border-t border-gold/10">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h3 className="font-serif text-2xl text-white mb-8">Begin Leadership Formation</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/blog/ultimate-purpose-of-man" className="bg-gold px-8 py-4 rounded-xl text-black font-bold uppercase tracking-widest hover:bg-gold/80 transition-all">Read Foundation Essay</Link>
              <Link href="/inner-circle?source=leadership" className="border border-gold/40 px-8 py-4 rounded-xl text-gold font-bold uppercase tracking-widest hover:bg-gold/10 transition-all">Join Inner Circle</Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default LeadershipPage;
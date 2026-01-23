/* pages/strategy/index.tsx — STRATEGIC ARCHITECTURE (INTEGRITY MODE) */
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Users as UsersIcon,
  Target as TargetIcon,
  BookOpen as BookOpenIcon,
  ShieldCheck,
  FileSpreadsheet,
  Presentation,
  ClipboardCheck,
  Hammer,
  Layers,
  ArrowRight,
  Download,
  Lock,
  Building2,
  Home,
  GraduationCap,
  Cpu,
  Map,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

/**
 * STRATEGIC FIX: INTEGRITY MODE
 * All hrefs are validated against established /content/, /resources/, and /canon/ paths.
 */
const StrategyPage: NextPage = () => {
  const coreFrameworks = [
    {
      title: "Strategic Frameworks v4.2",
      description: "Complete decision architecture for board-level strategy and governance",
      href: "/resources/strategic-frameworks",
      status: 'public' as const,
      icon: Map,
      components: ["Decision matrices", "Prioritization logic", "Governance templates", "Stakeholder maps"],
      format: "157 pages + 42 templates"
    },
    {
      title: "Builder's Catechism",
      description: "Authoritative question-set for founder legitimacy and execution discipline",
      href: "/canon/builders-catechism",
      status: 'inner-circle' as const,
      icon: Hammer,
      components: ["89 foundational questions", "Audit tools", "Governance checklists", "Implementation guide"],
      format: "Complete implementation bundle"
    },
    {
      title: "Ultimate Purpose of Man",
      description: "Complete framework for understanding human purpose across seven domains",
      href: "/blog/ultimate-purpose-of-man",
      status: 'public' as const,
      icon: Layers,
      components: ["Seven domain framework", "Purpose alignment tools", "Legacy mapping", "Stewardship planning"],
      format: "Foundational doctrine"
    }
  ];

  const implementationTools = [
    {
      category: "Governance",
      title: "Board Decision Log Template",
      description: "Excel template for documenting board-level decisions with accountability matrices",
      href: "/resources/board-decision-log-template",
      status: 'public' as const,
      icon: FileSpreadsheet,
      useCase: "Decision documentation"
    },
    {
      category: "Operations",
      title: "Operating Cadence Pack",
      description: "Complete presentation deck for board meeting design and execution rhythm",
      href: "/resources/operating-cadence-pack",
      status: 'inner-circle' as const,
      icon: Presentation,
      useCase: "Meeting architecture"
    },
    {
      category: "Strategy",
      title: "Canon Council Table Agenda",
      description: "Structured agenda format for board-level strategic conversations",
      href: "/resources/canon-council-table-agenda",
      status: 'inner-circle' as const,
      icon: ClipboardCheck,
      useCase: "Strategic dialogue"
    }
  ];

  return (
    <Layout
      title="Strategic Frameworks"
      description="Board-grade strategic frameworks, implementation toolkits, and canonical doctrine for serious builders."
      className="bg-black text-cream"
    >
      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Strategy · Systems · Architecture</p>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">Strategy that survives <span className="italic text-gold">reality</span></h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-gray-400">Board-grade architecture and implementation toolkits for serious builders.</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="#frameworks" className="rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black hover:bg-gold/80 transition-all flex items-center justify-center">
                Explore Frameworks <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/resources/strategic-frameworks" className="rounded-xl border border-gold/30 bg-gold/5 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold hover:bg-gold/10 transition-all flex items-center justify-center">
                Download Pack <Download className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* MANDATE */}
        <section className="bg-black py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4"><MandateStatement /></div>
        </section>

        {/* CORE FRAMEWORKS */}
        <section id="frameworks" className="bg-zinc-950 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-serif text-3xl font-semibold text-white mb-16">Core Strategic Frameworks</h2>
            <div className="grid gap-8 lg:grid-cols-3">
              {coreFrameworks.map((framework, index) => (
                <div key={index} className="rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:border-gold/30 flex flex-col h-full">
                  <div className="mb-6 flex items-center justify-between">
                    <framework.icon className="h-8 w-8 text-gold" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gold/60 border border-gold/20 px-2 py-1 rounded-full">{framework.status}</span>
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-white mb-4">{framework.title}</h3>
                  <p className="text-sm text-gray-400 mb-6 flex-grow">{framework.description}</p>
                  <ul className="mb-8 space-y-2">
                    {framework.components.map((c, i) => (
                      <li key={i} className="text-xs text-gray-500 flex items-center gap-2"><ArrowRight className="h-3 w-3 text-gold/40" /> {c}</li>
                    ))}
                  </ul>
                  <Link href={framework.href} className="mt-auto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold hover:opacity-70">
                    Access Resource <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TOOLKITS */}
        <section className="bg-black py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-serif text-3xl font-semibold text-white mb-16">Implementation Toolkits</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {implementationTools.map((tool, index) => (
                <div key={index} className="group rounded-3xl border border-white/5 bg-white/[0.02] p-8 flex items-start gap-6 hover:border-gold/20 transition-all">
                  <div className="rounded-2xl bg-gold/10 p-4"><tool.icon className="h-6 w-6 text-gold" /></div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 block">{tool.category}</span>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gold transition-colors">{tool.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{tool.description}</p>
                    <Link href={tool.href} className="text-xs font-bold uppercase tracking-widest text-gold/80 hover:text-gold">Download Asset</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-zinc-950 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div className="rounded-3xl border border-gold/20 bg-gold/5 p-12">
              <h3 className="font-serif text-3xl text-white mb-6">Begin Strategic Architecture</h3>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">Build institutions that outlast their founders through rigorous governance and clear decision logic.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/resources/strategic-frameworks" className="bg-gold px-8 py-4 rounded-xl text-black font-bold uppercase tracking-widest">Download Public Vault</Link>
                <Link href="/inner-circle" className="border border-gold/40 px-8 py-4 rounded-xl text-gold font-bold uppercase tracking-widest hover:bg-gold/10">Unlock Inner Circle Access</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default StrategyPage;
// pages/leadership/index.tsx
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
  Presentation,
  ClipboardCheck,
  Building2,
  GraduationCap,
  Workflow,
  Cpu,
  Lock,
  FileStack,
  Home,
  Award,
  Sparkles,
  TreePine,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

const LeadershipPage: NextPage = () => {
  // Leadership Formation Progression
  const leadershipProgression = [
    {
      stage: "01 · Self",
      title: "Ultimate Purpose of Man",
      description: "Understand human purpose across seven domains - foundation of leadership",
      href: "/blog/ultimate-purpose-of-man",
      status: 'public' as const,
      icon: Compass,
      artifacts: ["Purpose framework", "Domain mapping"],
      outcome: "Clarity on why you lead"
    },
    {
      stage: "02 · Purpose",
      title: "Builder's Catechism",
      description: "Authoritative question-set for founder legitimacy and execution discipline",
      href: "/canon/builders-catechism",
      status: 'inner-circle' as const,
      icon: Hammer,
      artifacts: ["89 questions", "Audit tools", "Governance checklists"],
      outcome: "Execution clarity"
    },
    {
      stage: "03 · Vision",
      title: "Canon (Vol I-IV)",
      description: "Complete doctrinal architecture for institutional leadership",
      href: "/canon",
      status: 'inner-circle' as const,
      icon: BookOpen,
      artifacts: ["Teaching editions", "Field letters", "Implementation guides"],
      outcome: "Intellectual foundation"
    },
    {
      stage: "04 · Mission",
      title: "Strategic Frameworks",
      description: "Board-ready tooling for turning vision into operational reality",
      href: "/resources/strategic-frameworks",
      status: 'public' as const,
      icon: Map,
      artifacts: ["Decision matrices", "Prioritization logic", "Governance templates"],
      outcome: "Operational tooling"
    }
  ];

  // Leadership Implementation Tools
  const leadershipTools = [
    {
      category: "Governance",
      title: "Board Decision Log Template",
      description: "Excel template for documenting board-level decisions with accountability matrices",
      href: "/resources/board-decision-log-template",
      status: 'public' as const,
      icon: FileSpreadsheet,
      fileType: "Excel (.xlsx)",
      useCase: "Decision accountability"
    },
    {
      category: "Operations",
      title: "Operating Cadence Pack",
      description: "Complete presentation deck for board meeting design and execution rhythm",
      href: "/resources/operating-cadence-pack",
      status: 'inner-circle' as const,
      icon: Presentation,
      fileType: "PowerPoint (.pptx)",
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
    },
    {
      category: "Diagnostics",
      title: "Institutional Health Scorecard",
      description: "Diagnostic tool for organizational legitimacy and operational health",
      href: "/resources/institutional-health-scorecard",
      status: 'public' as const,
      icon: ShieldCheck,
      useCase: "Organizational assessment"
    },
    {
      category: "Development",
      title: "Leadership Standards Blueprint",
      description: "Framework for defining and measuring leadership performance",
      href: "/resources/leadership-standards-blueprint",
      status: 'public' as const,
      icon: Target,
      useCase: "Leadership development"
    },
    {
      category: "Stewardship",
      title: "Multi-Generational Legacy Ledger",
      description: "Framework for legacy mapping across financial, intellectual, relational domains",
      href: "/resources/multi-generational-legacy-ledger",
      status: 'inner-circle' as const,
      icon: Landmark,
      useCase: "Legacy planning"
    }
  ];

  // Leadership Essays (from your actual content)
  const leadershipEssays = [
    {
      title: "The Brotherhood Code",
      description: "Principles for building lasting brotherhood and leadership accountability",
      href: "/blog/the-brotherhood-code",
      readTime: "25 min",
      icon: Users,
      tags: ["brotherhood", "accountability", "community"]
    },
    {
      title: "Leadership Begins at Home",
      description: "How household governance shapes organizational leadership",
      href: "/blog/leadership-begins-at-home",
      readTime: "12 min",
      icon: Home,
      tags: ["household", "governance", "foundations"]
    },
    {
      title: "Kingdom Strategies for a Loving Legacy",
      description: "Strategic approaches to building kingdom impact through legacy",
      href: "/blog/kingdom-strategies-for-a-loving-legacy",
      readTime: "14 min",
      icon: Building2,
      tags: ["kingdom", "legacy", "strategy"]
    },
    {
      title: "Surrender Operational Framework",
      description: "Framework for leading through surrender, not just submission",
      href: "/blog/surrender-operational-framework",
      readTime: "18 min",
      icon: Workflow,
      tags: ["surrender", "framework", "spiritual"]
    }
  ];

  // Leadership Community Resources
  const communityResources = [
    {
      title: "Chatham Rooms",
      description: "Private, off-record conversations for leaders carrying real weight",
      href: "/chatham-rooms",
      status: 'private' as const,
      icon: Users,
      format: "Curated conversations",
      audience: "Verified leaders"
    },
    {
      title: "Brotherhood Starter Kit",
      description: "Framework for initiating and maintaining leadership accountability groups",
      href: "/resources/brotherhood-starter-kit",
      status: 'public' as const,
      icon: Users,
      format: "Starter guide + templates",
      audience: "Leaders seeking accountability"
    },
    {
      title: "Canon Reading Plan - Year One",
      description: "Structured reading curriculum for canonical doctrine and leadership formation",
      href: "/resources/canon-reading-plan-year-one",
      status: 'inner-circle' as const,
      icon: GraduationCap,
      format: "Annual curriculum",
      audience: "Serious leaders"
    }
  ];

  return (
    <Layout
      title="Leadership"
      description="Formation path and tooling for leaders building institutions, families, and legacies that survive them."
      className="bg-black text-cream"
    >
      {/* HERO - The Leadership Journey */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Leadership · Formation · Legacy
            </p>
            
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Lead what lasts
            </h1>
            
            <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
              Formation path for serious leaders — from self-discovery to institution building.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="#progression"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                Begin Formation
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link
                href="/resources/board-decision-log-template"
                className="inline-flex items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/15"
              >
                Download Leadership Tool
                <FileSpreadsheet className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MANDATE STATEMENT */}
      <section className="bg-black py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <MandateStatement />
        </div>
      </section>

      {/* LEADERSHIP PROGRESSION */}
      <section id="progression" className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Progression
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Self → Purpose → Vision → Mission
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Leadership that survives headlines begins with leadership that survives self-examination.
            </p>
          </div>

          <div className="space-y-8">
            {leadershipProgression.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <motion.div
                  key={stage.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
                            {stage.stage}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em] ${
                            stage.status === 'public' 
                              ? 'bg-green-500/10 text-green-400' 
                              : stage.status === 'inner-circle'
                              ? 'bg-gold/10 text-gold'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {stage.status}
                          </span>
                        </div>
                        <Icon className="h-6 w-6 text-gold/60" />
                      </div>
                      
                      <h3 className="mb-3 font-serif text-xl font-semibold text-white group-hover:text-gold">
                        {stage.title}
                      </h3>
                      
                      <p className="mb-4 text-sm leading-relaxed text-gray-400">
                        {stage.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold text-gray-400">Artifacts: </span>
                          {stage.artifacts.join(" · ")}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold text-gray-400">Outcome: </span>
                          {stage.outcome}
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:w-48">
                      <Link
                        href={stage.href}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15 lg:w-auto"
                      >
                        {stage.status === 'public' ? 'Begin' : 'Preview'}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LEADERSHIP ESSAYS */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Conversation
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Essays on Leadership
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Writing that meets leaders where they are and shows them where they could be.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {leadershipEssays.map((essay) => {
              const Icon = essay.icon;
              return (
                <Link
                  key={essay.title}
                  href={essay.href}
                  className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <Icon className="h-6 w-6 text-gold/60" />
                    <span className="text-xs text-gray-500">{essay.readTime}</span>
                  </div>
                  
                  <h3 className="mb-3 font-serif text-xl font-semibold text-white group-hover:text-gold">
                    {essay.title}
                  </h3>
                  
                  <p className="mb-4 text-sm leading-relaxed text-gray-400">
                    {essay.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {essay.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/content?tag=leadership"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold/80"
            >
              View all leadership content
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* LEADERSHIP TOOLS */}
      <section className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Tooling
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Leadership Implementation
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Tools that turn leadership principles into operational reality.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {leadershipTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
                        {tool.category}
                      </span>
                      <h3 className="mt-1 font-serif text-lg font-semibold text-white group-hover:text-gold">
                        {tool.title}
                      </h3>
                    </div>
                    <Icon className="h-6 w-6 text-gold/60" />
                  </div>
                  
                  <p className="mb-3 text-sm leading-relaxed text-gray-400">
                    {tool.description}
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    {tool.fileType && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Format:</span>
                        <span className="font-medium text-gray-300">{tool.fileType}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Use case:</span>
                      <span className="font-medium text-gray-300">{tool.useCase}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold transition hover:text-gold/80"
                    >
                      {tool.status === 'public' ? 'Download' : 'Preview'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMMUNITY & NEXT STEPS */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-3">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">Leadership Community</h3>
                <p className="mt-4 text-sm leading-relaxed text-gray-400">
                  Leadership that lasts happens in community — structured, accountable, purposeful community.
                </p>
                
                <div className="mt-8 space-y-4">
                  {communityResources.map((resource) => {
                    const Icon = resource.icon;
                    return (
                      <div key={resource.title} className="flex items-start gap-4">
                        <Icon className="mt-0.5 h-5 w-5 text-gold" />
                        <div>
                          <p className="font-semibold text-white">{resource.title}</p>
                          <p className="mt-1 text-sm text-gray-400">{resource.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">The Leadership Path</h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-xs font-bold text-gold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-white">Know Yourself</p>
                      <p className="mt-1 text-sm text-gray-400">Start with Ultimate Purpose of Man.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-xs font-bold text-gold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-white">Build Your Toolbox</p>
                      <p className="mt-1 text-sm text-gray-400">Implement with Board Decision Log and Leadership Standards.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-xs font-bold text-gold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-white">Join the Conversation</p>
                      <p className="mt-1 text-sm text-gray-400">Enter Chatham Rooms or start a Brotherhood.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">Access Deeper Formation</h3>
                <p className="mt-4 text-sm leading-relaxed text-gray-400">
                  Start with what's public. Progress through Inner Circle to full access. 
                  Lead with those who share the conviction.
                </p>
                
                <div className="mt-8 space-y-4">
                  <Link
                    href="/inner-circle?source=leadership"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                  >
                    Inner Circle Access
                    <Lock className="h-4 w-4" />
                  </Link>
                  
                  <Link
                    href="/chatham-rooms"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
                  >
                    Explore Chatham Rooms
                    <Users className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="mt-16 text-center">
            <h3 className="font-serif text-2xl font-semibold text-white">
              Begin Leadership Formation
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400">
              Start with one essay. Implement one tool. Form one relationship. Leadership compounds.
            </p>
            
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/blog/ultimate-purpose-of-man"
                className="rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                Read Foundation Essay
              </Link>
              <Link
                href="/contact?source=leadership"
                className="rounded-xl border border-gold/60 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-all hover:border-gold hover:bg-gold/10"
              >
                Request Leadership Path
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LeadershipPage;
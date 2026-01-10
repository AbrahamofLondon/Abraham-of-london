// pages/founders/index.tsx
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
  Cpu,
  Lock,
  FileStack,
  Map,
  TreePine,
  Home,
  Sparkles,
  Network,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

const FoundersPage: NextPage = () => {
  // Builder's Formation Path
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

  // Builder's Toolbox (actual resources)
  const builderTools = [
    {
      title: "Board Decision Log Template",
      description: "Excel template for documenting board-level decisions with accountability matrices",
      href: "/resources/board-decision-log-template",
      status: 'public' as const,
      icon: FileSpreadsheet,
      fileType: "Excel (.xlsx)",
      useCase: "Governance documentation"
    },
    {
      title: "Operating Cadence Pack",
      description: "Complete presentation deck for board meeting design and execution rhythm",
      href: "/resources/operating-cadence-pack",
      status: 'inner-circle' as const,
      icon: Presentation,
      fileType: "PowerPoint (.pptx)",
      useCase: "Meeting architecture"
    },
    {
      title: "Canon Council Table Agenda",
      description: "Structured agenda format for board-level strategic conversations",
      href: "/resources/canon-council-table-agenda",
      status: 'inner-circle' as const,
      icon: ClipboardCheck,
      useCase: "Strategic dialogue"
    },
    {
      title: "Institutional Health Scorecard",
      description: "Diagnostic tool for organizational legitimacy and operational health",
      href: "/resources/institutional-health-scorecard",
      status: 'public' as const,
      icon: ShieldCheck,
      useCase: "Organizational diagnostics"
    },
    {
      title: "Leadership Standards Blueprint",
      description: "Framework for defining and measuring leadership performance",
      href: "/resources/leadership-standards-blueprint",
      status: 'public' as const,
      icon: Target,
      useCase: "Leadership development"
    },
    {
      title: "Strategy Room Intake",
      description: "Client intake framework for strategic advisory engagements",
      href: "/resources/strategy-room-intake",
      status: 'consulting' as const,
      icon: Network,
      useCase: "Strategic environment setup"
    }
  ];

  // Legacy & Stewardship Tools
  const legacyTools = [
    {
      title: "Multi-Generational Legacy Ledger",
      description: "Framework for legacy mapping across financial, intellectual, relational domains",
      href: "/resources/multi-generational-legacy-ledger",
      status: 'inner-circle' as const,
      icon: Landmark,
      domains: "Financial, intellectual, relational, spiritual",
      purpose: "Stewardship planning"
    },
    {
      title: "Canon Household Charter",
      description: "Template for family governance and household operating principles",
      href: "/resources/canon-household-charter",
      status: 'inner-circle' as const,
      icon: Home,
      domains: "Family governance, household operations",
      purpose: "Household architecture"
    },
    {
      title: "Purpose Alignment Checklist",
      description: "Operational checklist for mandate clarity and strategic focus",
      href: "/resources/purpose-alignment-checklist",
      status: 'public' as const,
      icon: Compass,
      domains: "Purpose, calling, impact",
      purpose: "Direction alignment"
    }
  ];

  // Community & Brotherhood
  const communityResources = [
    {
      title: "Brotherhood Starter Kit",
      description: "Framework for initiating and maintaining accountability groups",
      href: "/resources/brotherhood-starter-kit",
      status: 'public' as const,
      icon: Users,
      format: "Starter guide + templates",
      audience: "Founders, fathers, leaders"
    },
    {
      title: "Canon Reading Plan - Year One",
      description: "Structured reading curriculum for canonical doctrine",
      href: "/resources/canon-reading-plan-year-one",
      status: 'inner-circle' as const,
      icon: GraduationCap,
      format: "Annual curriculum",
      audience: "Serious builders"
    },
    {
      title: "Founder Salons",
      description: "Closed rooms for founders facing similar gravity of decisions",
      href: "/events?category=founders",
      status: 'private' as const,
      icon: Building2,
      format: "Curated conversations",
      audience: "Verified founders"
    }
  ];

  return (
    <Layout
      title="Builders"
      description="Formation path and tooling for founders, fathers, and leaders building what lasts across generations."
      className="bg-black text-cream"
    >
      {/* HERO - The Builder's Calling */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Builders · Founders · Fathers
            </p>
            
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Build what lasts
            </h1>
            
            <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
              Formation path for serious builders — founders, fathers, professionals — 
              who want to build institutions that survive them.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="#formation"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                Begin Formation
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link
                href="/resources/strategic-frameworks"
                className="inline-flex items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/15"
              >
                Strategic Frameworks
                <Map className="ml-2 h-4 w-4" />
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

      {/* FORMATION PATH */}
      <section id="formation" className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Path
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Formation for Builders
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Not random content. A structured path from first principles to implementation.
            </p>
          </div>

          <div className="space-y-8">
            {formationPath.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <motion.div
                  key={stage.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="mb-4 flex items-center gap-3">
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
                      
                      <div className="mb-4 flex items-start gap-4">
                        <Icon className="mt-1 h-6 w-6 text-gold/60" />
                        <div>
                          <h3 className="font-serif text-xl font-semibold text-white group-hover:text-gold">
                            {stage.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-gray-400">
                            {stage.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-400">Outcome: </span>
                        {stage.outcome}
                      </div>
                    </div>
                    
                    <div className="lg:w-48">
                      <Link
                        href={stage.href}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15 lg:w-auto"
                      >
                        {stage.status === 'public' ? 'Access' : 'Preview'}
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

      {/* BUILDER'S TOOLBOX */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Tools
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Builder's Toolbox
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Implementation tools that turn doctrine into board-ready decisions.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {builderTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="rounded-xl border border-gold/25 bg-gold/10 p-2">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em] ${
                      tool.status === 'public' 
                        ? 'bg-green-500/10 text-green-400' 
                        : tool.status === 'inner-circle'
                            ? 'bg-gold/10 text-gold'
                            : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {tool.status}
                    </span>
                  </div>
                  
                  <h3 className="mb-2 font-serif text-lg font-semibold text-white group-hover:text-gold">
                    {tool.title}
                  </h3>
                  
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
                      {tool.status === 'public' ? 'Download' : 'View preview'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LEGACY & STEWARDSHIP */}
      <section className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Beyond the Build
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Legacy & Stewardship
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Building that lasts means planning beyond your lifetime.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {legacyTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-6">
                    <Icon className="h-10 w-10 text-gold/60" />
                  </div>
                  
                  <h3 className="mb-4 font-serif text-xl font-semibold text-white group-hover:text-gold">
                    {tool.title}
                  </h3>
                  
                  <p className="mb-6 text-sm leading-relaxed text-gray-400">
                    {tool.description}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-400">Domains: </span>
                      {tool.domains}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-400">Purpose: </span>
                      {tool.purpose}
                    </div>
                    
                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold transition hover:text-gold/80"
                    >
                      {tool.status === 'public' ? 'Access' : 'Inner Circle preview'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMMUNITY & BROTHERHOOD */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-3">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">Community</h3>
                <p className="mt-4 text-sm leading-relaxed text-gray-400">
                  No builder builds alone. These tools structure the relationships that make the work possible.
                </p>
                
                <div className="mt-8 space-y-4">
                  <Link
                    href="/resources/brotherhood-starter-kit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                  >
                    Brotherhood Starter Kit
                    <Users className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">Formation Resources</h3>
                <div className="mt-6 space-y-6">
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
                <h3 className="font-serif text-2xl font-semibold text-white">Access & Next Steps</h3>
                <p className="mt-4 text-sm leading-relaxed text-gray-400">
                  Start with what's public. Progress to deeper formation through Inner Circle. 
                  Build with others who share the conviction.
                </p>
                
                <div className="mt-8 space-y-4">
                  <Link
                    href="/inner-circle?source=builders"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
                  >
                    Inner Circle Access
                    <Lock className="h-4 w-4" />
                  </Link>
                  
                  <Link
                    href="/resources/vault"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-cream transition hover:bg-white/10"
                  >
                    Explore the Vault
                    <FileStack className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="mt-16 text-center">
            <h3 className="font-serif text-2xl font-semibold text-white">
              Begin the Work
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400">
              Start with one tool. Build one system. Form one relationship. The work compounds.
            </p>
            
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/resources/board-decision-log-template"
                className="rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                Download First Tool
              </Link>
              <Link
                href="/contact?source=builders"
                className="rounded-xl border border-gold/60 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-all hover:border-gold hover:bg-gold/10"
              >
                Request Formation Path
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FoundersPage;
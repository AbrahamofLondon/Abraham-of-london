// pages/strategy/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Target,
  ShieldCheck,
  Workflow,
  Map,
  FileSpreadsheet,
  Presentation,
  ClipboardCheck,
  Landmark,
  BookOpen,
  Hammer,
  Layers,
  Compass,
  ArrowRight,
  Download,
  Lock,
  Users,
  Building2,
  Home,
  GraduationCap,
  Cpu,
  Sparkles,
  TreePine,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

const StrategyPage: NextPage = () => {
  // Core Strategic Frameworks
  const coreFrameworks = [
    {
      title: "Strategic Frameworks v4.2",
      description: "Complete decision architecture for board-level strategy and governance",
      href: "/resources/strategic-frameworks",
      status: 'public' as const,
      icon: Map,
      components: [
        "Decision matrices",
        "Prioritization logic",
        "Governance templates",
        "Stakeholder maps"
      ],
      format: "157 pages + 42 templates"
    },
    {
      title: "Builder's Catechism",
      description: "Authoritative question-set for founder legitimacy and execution discipline",
      href: "/canon/builders-catechism",
      status: 'inner-circle' as const,
      icon: Hammer,
      components: [
        "89 foundational questions",
        "Audit tools",
        "Governance checklists",
        "Implementation guide"
      ],
      format: "Complete implementation bundle"
    },
    {
      title: "Ultimate Purpose of Man",
      description: "Complete framework for understanding human purpose across seven domains",
      href: "/blog/ultimate-purpose-of-man",
      status: 'public' as const,
      icon: Layers,
      components: [
        "Seven domain framework",
        "Purpose alignment tools",
        "Legacy mapping",
        "Stewardship planning"
      ],
      format: "Foundational doctrine"
    }
  ];

  // Implementation Toolkits
  const implementationTools = [
    {
      category: "Governance",
      title: "Board Decision Log Template",
      description: "Excel template for documenting board-level decisions with accountability matrices",
      href: "/resources/board-decision-log-template",
      status: 'public' as const,
      icon: FileSpreadsheet,
      fileType: "Excel (.xlsx)",
      useCase: "Decision documentation"
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
    }
  ];

  // Canon Volumes for Strategy
  const strategyCanonVolumes = [
    {
      volume: "Volume I",
      title: "Foundations of Purpose",
      description: "Teaching edition on epistemology, authority, responsibility, and truth",
      href: "/canon/volume-i-teaching-edition",
      status: 'inner-circle' as const,
      icon: BookOpen,
      focus: "First principles of strategy"
    },
    {
      volume: "Volume II",
      title: "Governance and Formation",
      description: "Teaching edition on board mechanics, stakeholder alignment, ethical boundaries",
      href: "/canon/volume-ii-teaching-edition",
      status: 'inner-circle' as const,
      icon: ShieldCheck,
      focus: "Institutional design"
    },
    {
      volume: "Volume IV",
      title: "Teaching Edition",
      description: "Market reality and execution discipline for frontier contexts",
      href: "/canon/volume-iv-teaching-edition",
      status: 'inner-circle' as const,
      icon: Target,
      focus: "Execution in reality"
    },
    {
      volume: "Volume X",
      title: "The Arc of Future Civilisation",
      description: "Integration and deployment of full implementation stack",
      href: "/canon/volume-x-the-arc-of-future-civilisation",
      status: 'consulting' as const,
      icon: Cpu,
      focus: "Strategic integration"
    }
  ];

  // Application Areas
  const applicationAreas = [
    {
      area: "Family & Household",
      title: "Household Governance",
      description: "Strategic frameworks for family governance and multi-generational planning",
      href: "/resources/canon-household-charter",
      icon: Home,
      tools: ["Household Charter", "Legacy Ledger", "Family Council Agenda"]
    },
    {
      area: "Organization & Board",
      title: "Institutional Strategy",
      description: "Board-level strategy for institutions that survive founders",
      href: "/resources/board-decision-log-template",
      icon: Building2,
      tools: ["Decision Log", "Operating Cadence", "Governance Grid"]
    },
    {
      area: "Personal Formation",
      title: "Builder Formation",
      description: "Strategic frameworks for personal calling and impact alignment",
      href: "/resources/destiny-mapping-worksheet",
      icon: GraduationCap,
      tools: ["Destiny Mapping", "Purpose Alignment", "Calling Canvas"]
    },
    {
      area: "Community Building",
      title: "Brotherhood Formation",
      description: "Strategic frameworks for building accountable community",
      href: "/resources/brotherhood-starter-kit",
      icon: Users,
      tools: ["Brotherhood Starter Kit", "Accountability Frameworks", "Community Governance"]
    }
  ];

  return (
    <Layout
      title="Strategic Frameworks"
      description="Board-grade strategic frameworks, implementation toolkits, and canonical doctrine for serious builders."
      className="bg-black text-cream"
    >
      {/* HERO - Strategy That Survives Reality */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Strategy · Systems · Architecture
            </p>
            
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Strategy that survives reality
            </h1>
            
            <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
              Not theoretical frameworks. Board-grade strategic architecture, implementation toolkits, 
              and canonical doctrine for serious builders.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="#frameworks"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                Explore Frameworks
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link
                href="/resources/strategic-frameworks"
                className="inline-flex items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/15"
              >
                Download Strategic Frameworks
                <Download className="ml-2 h-4 w-4" />
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

      {/* CORE FRAMEWORKS */}
      <section id="frameworks" className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Architecture
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Core Strategic Frameworks
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Complete strategic architecture developed and tested over 17 years.
            </p>
          </div>

          <div className="space-y-8">
            {coreFrameworks.map((framework, index) => {
              const Icon = framework.icon;
              return (
                <motion.div
                  key={framework.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <div className="mb-2 inline-flex items-center gap-2">
                            <Icon className="h-6 w-6 text-gold/60" />
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em] ${
                              framework.status === 'public' 
                                ? 'bg-green-500/10 text-green-400' 
                                : framework.status === 'inner-circle'
                                ? 'bg-gold/10 text-gold'
                                : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {framework.status}
                            </span>
                          </div>
                          <h3 className="font-serif text-2xl font-semibold text-white group-hover:text-gold">
                            {framework.title}
                          </h3>
                        </div>
                      </div>
                      
                      <p className="mb-6 text-sm leading-relaxed text-gray-400">
                        {framework.description}
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Components Include</p>
                          <div className="flex flex-wrap gap-2">
                            {framework.components.map((component, idx) => (
                              <span
                                key={idx}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
                              >
                                {component}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          <span className="font-semibold text-gray-400">Format: </span>
                          {framework.format}
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:w-48">
                      <Link
                        href={framework.href}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15 lg:w-auto"
                      >
                        {framework.status === 'public' ? 'Download' : 'Preview'}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* IMPLEMENTATION TOOLKITS */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Implementation
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Strategy Implementation Toolkits
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Tools that turn strategic frameworks into operational reality.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {implementationTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="rounded-xl border border-gold/25 bg-gold/10 p-3">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
                        {tool.category}
                      </span>
                      <span className={`ml-2 inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em] ${
                        tool.status === 'public' 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-gold/10 text-gold'
                      }`}>
                        {tool.status}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="mb-2 font-serif text-lg font-semibold text-white group-hover:text-gold">
                    {tool.title}
                  </h3>
                  
                  <p className="mb-4 text-sm leading-relaxed text-gray-400">
                    {tool.description}
                  </p>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      {tool.fileType && (
                        <span className="text-xs text-gray-500">{tool.fileType}</span>
                      )}
                      <p className="text-xs font-semibold text-gray-400">{tool.useCase}</p>
                    </div>
                    
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

      {/* CANON VOLUMES */}
      <section className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Foundation
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Canon Volumes for Strategy
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Strategic thinking built on canonical doctrine, not improvised frameworks.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {strategyCanonVolumes.map((volume) => {
              const Icon = volume.icon;
              return (
                <div
                  key={volume.volume}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
                          {volume.volume}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em] ${
                          volume.status === 'inner-circle' 
                            ? 'bg-gold/10 text-gold'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {volume.status}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-white group-hover:text-gold">
                        {volume.title}
                      </h3>
                    </div>
                    <Icon className="h-8 w-8 text-gold/60" />
                  </div>
                  
                  <p className="mb-6 text-sm leading-relaxed text-gray-400">
                    {volume.description}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-400">Focus: </span>
                      {volume.focus}
                    </div>
                    
                    <Link
                      href={volume.href}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold transition hover:text-gold/80"
                    >
                      {volume.status === 'inner-circle' ? 'Inner Circle preview' : 'Consulting access'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* APPLICATION AREAS */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Application
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Where Strategy Lands
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Strategic frameworks applied to real domains of responsibility.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {applicationAreas.map((area) => {
              const Icon = area.icon;
              return (
                <div
                  key={area.area}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-6">
                    <div className="mb-4 flex items-center gap-3">
                      <Icon className="h-6 w-6 text-gold/60" />
                      <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
                        {area.area}
                      </span>
                    </div>
                    
                    <h3 className="mb-3 font-serif text-xl font-semibold text-white group-hover:text-gold">
                      {area.title}
                    </h3>
                    
                    <p className="mb-6 text-sm leading-relaxed text-gray-400">
                      {area.description}
                    </p>
                    
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Tools Included
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {area.tools.map((tool, idx) => (
                          <span
                            key={idx}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href={area.href}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold transition hover:text-gold/80"
                  >
                    Explore {area.area.toLowerCase()} tools
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ACCESS & NEXT STEPS */}
      <section className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">Access the Full Architecture</h3>
                <p className="mt-4 text-sm leading-relaxed text-gray-400">
                  Start with public frameworks, progress through Inner Circle access, 
                  and implement with consulting support for full strategic architecture.
                </p>
                
                <div className="mt-8 space-y-4">
                  <Link
                    href="/resources/strategic-frameworks"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                  >
                    Download Public Frameworks
                    <Download className="h-4 w-4" />
                  </Link>
                  
                  <Link
                    href="/inner-circle?source=strategy"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
                  >
                    Unlock Inner Circle Access
                    <Lock className="h-4 w-4" />
                  </Link>
                  
                  <Link
                    href="/consulting/strategy-room"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-cream transition hover:bg-white/10"
                  >
                    Book Strategy Room
                    <Calendar className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">Strategic Implementation Path</h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-white">Foundation</p>
                      <p className="mt-1 text-sm text-gray-400">Start with Ultimate Purpose of Man and Strategic Frameworks.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-white">Implementation</p>
                      <p className="mt-1 text-sm text-gray-400">Apply specific tools to your domain (family, organization, community).</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-white">Integration</p>
                      <p className="mt-1 text-sm text-gray-400">Join Inner Circle for complete Canon access and integration.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-white">Mastery</p>
                      <p className="mt-1 text-sm text-gray-400">Book Strategy Room for personalized implementation support.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="mt-16 text-center">
            <h3 className="font-serif text-2xl font-semibold text-white">
              Begin Strategic Architecture
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400">
              Start with one framework. Implement one tool. Build one system. Strategy compounds.
            </p>
            
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/resources/strategic-frameworks"
                className="rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                Download Strategic Frameworks
              </Link>
              <Link
                href="/contact?source=strategy"
                className="rounded-xl border border-gold/60 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-all hover:border-gold hover:bg-gold/10"
              >
                Request Strategy Consultation
              </Link>
            </div>
            
            <p className="mt-8 text-xs text-gray-500">
              Not theoretical frameworks. Board-grade strategic architecture.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default StrategyPage;
import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Users,
  Target,
  Globe,
  ShieldCheck,
  FileText,
  Library,
  BookOpen,
  ScrollText,
  GraduationCap,
  Building2,
  Hammer,
  Cpu,
  Map,
  Layers,
  Workflow,
  FileSpreadsheet,
  Presentation,
  ClipboardCheck,
  Landmark,
  Network,
  Shield,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";

type ServicePillar = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  points: string[];
};

type WorkStep = {
  step: string;
  desc: string;
};

type CanonVolume = {
  volume: string;
  title: string;
  description: string;
  pageCount?: string;
  href: string;
  status: 'public' | 'inner-circle' | 'consulting';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type FrameworkArtifact = {
  title: string;
  type: 'template' | 'worksheet' | 'toolkit' | 'charter' | 'agenda' | 'plan';
  description: string;
  href: string;
  fileType?: string;
  status: 'public' | 'inner-circle' | 'consulting';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type BoardOutcome = {
  title: string;
  desc: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const easeSettle: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeSettle },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

export default function ConsultingPage(): JSX.Element {
  const reduceMotion = useReducedMotion();

  const pillars: ServicePillar[] = [
    {
      icon: Users,
      title: "Board & Executive Strategy",
      description:
        "Deep support for C-suite and boards on governance and execution — designed for legitimacy, resilience, and long-range impact.",
      points: [
        "Scenario thinking & decision hygiene",
        "Board-level challenge (not flattery)",
        "Governance & operating cadence design",
      ],
    },
    {
      icon: Target,
      title: "Founder Advisory",
      description:
        "Confidential advisory for decision-makers navigating crises, complexity, or scale — with clarity, structure, and consequences in view.",
      points: [
        "Confidential sounding board",
        "Decision frameworks & trade-off clarity",
        "Escalation discipline & execution focus",
      ],
    },
    {
      icon: Globe,
      title: "Frontier Market Strategy",
      description:
        "Specialist strategy for operators engaging Nigeria and wider Africa — honest context on risk, stakeholders, and execution reality.",
      points: [
        "Entry strategy & partnership design",
        "Stakeholder navigation & legitimacy",
        "Execution discipline & risk containment",
      ],
    },
  ];

  const workSteps: WorkStep[] = [
    {
      step: "Initial Call",
      desc: "45 minutes to understand context, stakes, timelines, and fit.",
    },
    {
      step: "Diagnostic",
      desc: "Define the real problem, not the fashionable one — with evidence and constraints.",
    },
    {
      step: "Engagement",
      desc: "Scope, cadence, deliverables, decision rights, and success measures. Documented. Accountable.",
    },
  ];

  const isForYou: string[] = [
    "Carry responsibility for others' livelihoods and outcomes",
    "Want strategy that respects both Faith and Data",
    "Are willing to be challenged, not entertained",
    "Prefer documented decisions over vibes and improvisation",
  ];

  // Canon Volumes (actual materials from your filesystem)
  const canonVolumes: CanonVolume[] = [
    {
      volume: "Volume I",
      title: "Foundations of Purpose",
      description: "Teaching edition on epistemology, authority, responsibility, and truth",
      pageCount: "Teaching Edition",
      href: "/canon/volume-i-teaching-edition",
      status: 'inner-circle',
      icon: ScrollText,
    },
    {
      volume: "Volume II",
      title: "Governance and Formation",
      description: "Teaching edition on board mechanics, stakeholder alignment, ethical boundaries",
      pageCount: "Teaching Edition",
      href: "/canon/volume-ii-teaching-edition",
      status: 'inner-circle',
      icon: Shield,
    },
    {
      volume: "Volume III",
      title: "Teaching Edition",
      description: "Advanced decision architecture and trade-off frameworks",
      pageCount: "Teaching Edition",
      href: "/canon/volume-iii-teaching-edition",
      status: 'inner-circle',
      icon: Workflow,
    },
    {
      volume: "Volume IV",
      title: "Teaching Edition",
      description: "Market reality and execution discipline for frontier contexts",
      pageCount: "Teaching Edition",
      href: "/canon/volume-iv-teaching-edition",
      status: 'inner-circle',
      icon: Globe,
    },
    {
      volume: "Volume X",
      title: "The Arc of Future Civilisation",
      description: "Integration and deployment of full implementation stack",
      pageCount: "Complete Edition",
      href: "/canon/volume-x-the-arc-of-future-civilisation",
      status: 'consulting',
      icon: Cpu,
    },
  ];

  // Framework Artifacts (actual materials from your resources)
  const frameworkArtifacts: FrameworkArtifact[] = [
    {
      title: "Board Decision Log Template",
      type: 'template',
      description: "Excel template for board-level decision documentation and accountability",
      href: "/resources/board-decision-log-template",
      fileType: "Excel (.xlsx)",
      status: 'public',
      icon: FileSpreadsheet,
    },
    {
      title: "Operating Cadence Pack",
      type: 'toolkit',
      description: "Complete presentation deck for board meeting design and execution rhythm",
      href: "/resources/operating-cadence-pack",
      fileType: "PowerPoint (.pptx)",
      status: 'inner-circle',
      icon: Presentation,
    },
    {
      title: "Builder's Catechism",
      type: 'worksheet',
      description: "Authoritative question-set for founder legitimacy and execution discipline",
      href: "/canon/builders-catechism",
      status: 'inner-circle',
      icon: Hammer,
    },
    {
      title: "Canon Council Table Agenda",
      type: 'agenda',
      description: "Structured agenda format for board-level strategic conversations",
      href: "/resources/canon-council-table-agenda",
      status: 'inner-circle',
      icon: ClipboardCheck,
    },
    {
      title: "Multi-Generational Legacy Ledger",
      type: 'worksheet',
      description: "Framework for legacy mapping across financial, intellectual, relational domains",
      href: "/resources/multi-generational-legacy-ledger",
      status: 'inner-circle',
      icon: Landmark,
    },
    {
      title: "Strategic Frameworks",
      type: 'toolkit',
      description: "Complete collection of decision matrices, prioritization logic, and governance templates",
      href: "/resources/strategic-frameworks",
      status: 'public',
      icon: Map,
    },
  ];

  // Implementation Tools (additional resources)
  const implementationTools: FrameworkArtifact[] = [
    {
      title: "Canon Household Charter",
      type: 'charter',
      description: "Template for family governance and household operating principles",
      href: "/resources/canon-household-charter",
      status: 'inner-circle',
      icon: Building2,
    },
    {
      title: "Canon Reading Plan - Year One",
      type: 'plan',
      description: "Structured reading curriculum for canonical doctrine and strategic thinking",
      href: "/resources/canon-reading-plan-year-one",
      status: 'inner-circle',
      icon: BookOpen,
    },
    {
      title: "Institutional Health Scorecard",
      type: 'worksheet',
      description: "Diagnostic tool for organizational legitimacy and operational health",
      href: "/resources/institutional-health-scorecard",
      status: 'public',
      icon: ClipboardCheck,
    },
    {
      title: "Leadership Standards Blueprint",
      type: 'template',
      description: "Framework for defining and measuring leadership performance",
      href: "/resources/leadership-standards-blueprint",
      status: 'public',
      icon: Target,
    },
    {
      title: "Purpose Alignment Checklist",
      type: 'checklist',
      description: "Operational checklist for mandate clarity and strategic focus",
      href: "/resources/purpose-alignment-checklist",
      status: 'public',
      icon: CheckCircle,
    },
    {
      title: "Strategy Room Intake",
      type: 'template',
      description: "Client intake framework for strategic advisory engagements",
      href: "/resources/strategy-room-intake",
      status: 'consulting',
      icon: Network,
    },
  ];

  // Board outcomes (board language)
  const boardOutcomes: BoardOutcome[] = [
    {
      title: "Risk containment",
      desc:
        "Better decisions under uncertainty: scenario logic, pre-mortems, risk registers, and escalation discipline.",
      icon: ShieldCheck,
    },
    {
      title: "Legitimacy & trust",
      desc:
        "Governance clarity, ethical boundaries, and consistent decision-making that protects reputation and authority.",
      icon: GraduationCap,
    },
    {
      title: "Execution cadence",
      desc:
        "Operating rhythm that actually ships outcomes: meeting design, KPIs, accountability loops, and decision rights.",
      icon: Workflow,
    },
    {
      title: "Stakeholder alignment",
      desc:
        "Map incentives and power honestly — then align actions to reality, not wishful thinking.",
      icon: Network,
    },
    {
      title: "Strategic focus",
      desc:
        "Mandate clarity that cuts noise: priorities tied to purpose, not politics.",
      icon: Target,
    },
  ];

  return (
    <Layout
      title="Advisory & Strategy"
      description="Board-level strategic counsel rooted in conviction, documented method, and deployable frameworks."
      className="bg-black text-cream"
    >
      {/* =========================================================
          HERO
         ========================================================= */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.header
            className="max-w-3xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : { duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Private Advisory
            </p>

            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Strategy for those who{" "}
              <span className="block text-gold/90">carry the weight.</span>
            </h1>

            <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
              I work with leaders who refuse to outsource responsibility — founders, boards, and builders
              who carry weight for families, organisations, and nations. The work sits at the intersection
              of high-stakes strategy and personal character.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/contact?source=consulting&intent=consultation"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                Request Consultation
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/resources/strategic-frameworks"
                className="inline-flex items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/15"
              >
                View Strategic Frameworks
                <Library className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              No gimmicks. Documented method. Deployable tooling. Confidential mandates only.
            </p>
          </motion.header>
        </div>
      </section>

      {/* =========================================================
          MANDATE / STRIP
         ========================================================= */}
      <section className="bg-black py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <MandateStatement />
        </div>
        <div className="mt-16">
          <StrategicFunnelStrip />
        </div>
      </section>

      {/* =========================================================
          CANON VOLUMES (Showcasing actual materials)
         ========================================================= */}
      <section className="relative bg-zinc-950 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Canon
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Volumes I-X: The intellectual foundation
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              A complete doctrinal architecture developed and tested over 17 years. 
              Each volume addresses a specific domain of leadership responsibility.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {canonVolumes.map((volume) => {
              const Icon = volume.icon;
              return (
                <div
                  key={volume.volume}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">
                          {volume.volume}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em] ${
                          volume.status === 'public' 
                            ? 'bg-green-500/10 text-green-400' 
                            : volume.status === 'inner-circle'
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

                  <p className="text-sm leading-relaxed text-gray-400">
                    {volume.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {volume.pageCount}
                    </span>
                    <Link
                      href={volume.href}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold transition hover:text-gold/80"
                    >
                      View {volume.status === 'public' ? 'public' : 'preview'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-3xl border border-gold/20 bg-gold/5 p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <h3 className="font-serif text-xl font-semibold text-white">
                  Complete Canon Collection
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  Access all volumes, teaching editions, and implementation guides through 
                  Inner Circle membership or as part of a consulting engagement.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/inner-circle?section=canon"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                >
                  Inner Circle Access
                  <BookOpen className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact?source=consulting&intent=canon-access"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
                >
                  Consulting Access
                  <GraduationCap className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FRAMEWORK ARTIFACTS (Actual tools and templates)
         ========================================================= */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Implementation Tools
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Board-ready frameworks and templates
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Operational artifacts that transform doctrine into execution. 
              Each tool is designed for immediate deployment.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {frameworkArtifacts.map((artifact) => {
              const Icon = artifact.icon;
              return (
                <div
                  key={artifact.title}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="rounded-2xl border border-gold/25 bg-gold/10 p-3">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em] ${
                      artifact.status === 'public' 
                        ? 'bg-green-500/10 text-green-400' 
                        : artifact.status === 'inner-circle'
                        ? 'bg-gold/10 text-gold'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {artifact.status}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-white group-hover:text-gold">
                    {artifact.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    {artifact.description}
                  </p>

                  {artifact.fileType && (
                    <p className="mt-3 text-xs text-gray-500">
                      {artifact.fileType}
                    </p>
                  )}

                  <div className="mt-6">
                    <Link
                      href={artifact.href}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold transition hover:text-gold/80"
                    >
                      {artifact.status === 'public' ? 'Download' : 'View preview'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {implementationTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-gold/20 hover:bg-white/[0.03]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gold/60" />
                    <h4 className="text-sm font-semibold text-white group-hover:text-gold">
                      {tool.title}
                    </h4>
                  </div>

                  <p className="text-xs leading-relaxed text-gray-400">
                    {tool.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                      {tool.type}
                    </span>
                    <Link
                      href={tool.href}
                      className="text-xs font-medium text-gold transition hover:text-gold/80"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          AREAS OF ENGAGEMENT
         ========================================================= */}
      <section className="relative bg-zinc-950 py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 max-w-2xl">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
              Areas of Engagement
            </h2>
            <p className="mt-4 text-gray-400">
              Formal advisory focused on consequence, culture, and long-term legitimacy.
            </p>
          </div>

          <motion.div
            className="grid gap-8 lg:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : { duration: 0.6 }}
            viewport={{ once: true }}
          >
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={`${pillar.title}-${idx}`}
                  className="group rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-gold/30 hover:bg-white/[0.04]"
                >
                  <Icon className="mb-6 h-10 w-10 text-gold/80" />
                  <h3 className="mb-4 font-serif text-xl font-semibold text-cream transition-colors group-hover:text-gold">
                    {pillar.title}
                  </h3>
                  <p className="mb-8 text-sm leading-relaxed text-gray-400">
                    {pillar.description}
                  </p>
                  <ul className="space-y-3">
                    {pillar.points.map((point, pointIdx) => (
                      <li
                        key={`${pillar.title}-point-${pointIdx}`}
                        className="flex items-start gap-3 text-xs text-gray-300"
                      >
                        <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold/60" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* =========================================================
          BOARD-LEVEL OUTCOMES
         ========================================================= */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Board-level outcomes
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              What boards actually pay for
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-400 sm:text-lg">
              The deliverables are designed to land in board rooms: risk, legitimacy, governance, execution cadence,
              and stakeholder alignment — documented and defensible.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {boardOutcomes.map((o) => {
              const Icon = o.icon;
              return (
                <div
                  key={o.title}
                  className="rounded-3xl border border-white/8 bg-white/[0.02] p-6 hover:border-gold/25"
                >
                  <div className="mb-4 inline-flex rounded-2xl border border-gold/25 bg-gold/10 p-3">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-white">{o.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">{o.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/contact?source=consulting&intent=consultation"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-7 py-4 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
            >
              Request Consultation
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/resources/board-decision-log-template"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-bold uppercase tracking-widest text-cream transition hover:bg-white/10"
            >
              Download sample template
              <FileText className="h-4 w-4" />
            </Link>

            <Link
              href="/inner-circle?source=consulting-outcomes"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-7 py-4 text-sm font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
            >
              Inner Circle preview
              <Library className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW I WORK
         ========================================================= */}
      <section className="bg-black py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-white">How I Work</h2>
              <p className="mt-6 text-lg leading-relaxed text-gray-400">
                I am not a motivational coach. I am a strategist and advisor. The work is structured,
                documented, and accountable — anchored in conviction and integrity.
              </p>

              <div className="mt-12 space-y-8">
                {workSteps.map((step, idx) => (
                  <div key={`${step.step}-${idx}`} className="flex gap-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h4 className="font-bold uppercase tracking-widest text-cream">{step.step}</h4>
                      <p className="mt-1 text-sm text-gray-500">{step.desc}</p>
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
                {isForYou.map((line, idx) => (
                  <li
                    key={`for-you-${idx}`}
                    className="flex items-center gap-3 text-sm font-medium text-cream/90"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-gold" />
                    {line}
                  </li>
                ))}
              </ul>

              <div className="mt-12">
                <Link
                  href="/contact?source=consulting&intent=context-note"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/50 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black"
                >
                  Share Context Note
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-4 text-center text-[10px] uppercase tracking-tighter text-gray-500">
                  strictly confidential · limited mandates available
                </p>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-gray-400">
                  Prefer proof over promises?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  Start with the Strategic Frameworks library. If the tooling resonates, we can discuss
                  mandate-fit and scope privately.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/resources/strategic-frameworks"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-widest text-cream transition hover:bg-white/10"
                  >
                    Open Library
                    <Library className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/inner-circle?source=consulting-proof"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
                  >
                    Unlock full library
                    <Lock className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Footer micro-CTA */}
          <div className="mt-14 border-t border-white/10 pt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                If you want a "call for vibes," this isn't it. If you want board-legible strategy, we can talk.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/canon/volume-i-foundations-of-purpose"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                >
                  Read Volume I Preview
                  <BookOpen className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact?source=consulting&intent=consultation"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/50 bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold hover:text-black"
                >
                  Request Consultation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
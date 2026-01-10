import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  Users as UsersIcon,
  Target as TargetIcon,
  BookOpen as BookOpenIcon,
  ArrowRight,
  CheckCircle,
  Globe,
  ShieldCheck,
  FileText,
  Library,
  ScrollText,
  GraduationCap,
  Building2,
  Hammer,
  Cpu,
  Map,
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

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

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
  type: 'template' | 'worksheet' | 'toolkit' | 'charter' | 'agenda' | 'plan' | 'checklist';
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

/* -------------------------------------------------------------------------- */
/* ANIMATION VARIANTS                                                         */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* PAGE COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function ConsultingPage(): JSX.Element {
  const reduceMotion = useReducedMotion();

  const pillars: ServicePillar[] = [
    {
      icon: UsersIcon,
      title: "Board & Executive Strategy",
      description: "Deep support for C-suite and boards on governance and execution — designed for legitimacy, resilience, and long-range impact.",
      points: [
        "Scenario thinking & decision hygiene",
        "Board-level challenge (not flattery)",
        "Governance & operating cadence design",
      ],
    },
    {
      icon: TargetIcon,
      title: "Founder Advisory",
      description: "Confidential advisory for decision-makers navigating crises, complexity, or scale — with clarity, structure, and consequences in view.",
      points: [
        "Confidential sounding board",
        "Decision frameworks & trade-off clarity",
        "Escalation discipline & execution focus",
      ],
    },
    {
      icon: Globe,
      title: "Frontier Market Strategy",
      description: "Specialist strategy for operators engaging Nigeria and wider Africa — honest context on risk, stakeholders, and execution reality.",
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
      title: "Decision Architecture",
      description: "Advanced decision architecture and trade-off frameworks",
      pageCount: "Teaching Edition",
      href: "/canon/volume-iii-teaching-edition",
      status: 'inner-circle',
      icon: Workflow,
    },
    {
      volume: "Volume IV",
      title: "Frontier Execution",
      description: "Market reality and execution discipline for frontier contexts",
      pageCount: "Teaching Edition",
      href: "/canon/volume-iv-teaching-edition",
      status: 'inner-circle',
      icon: Globe,
    },
  ];

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
  ];

  const boardOutcomes: BoardOutcome[] = [
    {
      title: "Risk containment",
      desc: "Better decisions under uncertainty: scenario logic, pre-mortems, and escalation discipline.",
      icon: ShieldCheck,
    },
    {
      title: "Legitimacy & trust",
      desc: "Governance clarity and consistent decision-making that protects reputation and authority.",
      icon: GraduationCap,
    },
    {
      title: "Execution cadence",
      desc: "Operating rhythm that actually ships outcomes: meeting design, KPIs, and accountability.",
      icon: Workflow,
    },
    {
      title: "Stakeholder alignment",
      desc: "Map incentives and power honestly — then align actions to reality.",
      icon: Network,
    },
    {
      title: "Strategic focus",
      desc: "Mandate clarity that cuts noise: priorities tied to purpose, not politics.",
      icon: TargetIcon,
    },
  ];

  /* -------------------------------------------------------------------------- */
  /* RENDER                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <Layout
      title="Advisory & Strategy"
      description="Board-level strategic counsel rooted in conviction, documented method, and deployable frameworks."
      className="bg-black text-cream"
    >
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.header
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Private Advisory
            </motion.p>

            <motion.h1 variants={fadeUp} className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Strategy for those who <span className="block text-gold/90">carry the weight.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
              I work with leaders who refuse to outsource responsibility — founders, boards, and builders
              who carry weight for families, organisations, and nations.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
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
            </motion.div>
          </motion.header>
        </div>
      </section>

      {/* MANDATE */}
      <section className="bg-black py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <MandateStatement />
        </div>
        <div className="mt-16">
          <StrategicFunnelStrip />
        </div>
      </section>

      {/* CANON */}
      <section className="relative bg-zinc-950 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">The Canon</p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">The intellectual foundation</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {canonVolumes.map((volume) => {
              const Icon = volume.icon;
              return (
                <div key={volume.volume} className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">{volume.volume}</span>
                        <span className="bg-gold/10 text-gold rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em]">{volume.status}</span>
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-white group-hover:text-gold">{volume.title}</h3>
                    </div>
                    <Icon className="h-8 w-8 text-gold/60" />
                  </div>
                  <p className="text-sm leading-relaxed text-gray-400">{volume.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW I WORK */}
      
      <section className="bg-black py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-white">How I Work</h2>
              <p className="mt-6 text-lg leading-relaxed text-gray-400">
                I am not a motivational coach. I am a strategist and advisor. The work is structured,
                documented, and accountable.
              </p>
              <div className="mt-12 space-y-8">
                {workSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-xs font-bold text-gold">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{step.step}</h4>
                      <p className="mt-1 text-sm text-gray-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/5 bg-zinc-900/50 p-8 lg:p-12">
              <h3 className="font-serif text-2xl text-white">Is this for you?</h3>
              <ul className="mt-8 space-y-6">
                {isForYou.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 shrink-0 text-gold" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-12">
                <Link href="/contact" className="inline-flex w-full items-center justify-center rounded-xl bg-gold py-4 text-sm font-bold uppercase tracking-widest text-black">
                  Request Engagement
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
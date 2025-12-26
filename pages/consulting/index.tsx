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
  Layers,
  Library,
  Workflow,
  Lock,
  FileText,
  BadgeCheck,
  Landmark,
  Radar,
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

type PipelineCard = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  subtitle: string;
  body: string;
  outputs: string[];
};

type FrameworkCard = {
  title: string;
  solves: string;
  when: string;
  outputs: string;
  publicHref: string;
  gated: boolean;
  tag: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type BoardOutcome = {
  title: string;
  desc: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

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
    "Carry responsibility for others’ livelihoods and outcomes",
    "Want strategy that respects both Faith and Data",
    "Are willing to be challenged, not entertained",
    "Prefer documented decisions over vibes and improvisation",
  ];

  // Canon → Framework → Deployment (pipeline cards)
  const pipeline: PipelineCard[] = [
    {
      icon: Layers,
      title: "Principle",
      subtitle: "Canon doctrine",
      body:
        "The Canon is the philosophical spine — a durable operating philosophy that defines truth, responsibility, legitimacy, and authority.",
      outputs: [
        "Worldview alignment & decision boundaries",
        "Definitions (what we mean by key terms)",
        "Non-negotiables & governing constraints",
      ],
    },
    {
      icon: Workflow,
      title: "Framework",
      subtitle: "Tooling",
      body:
        "Principles become practical instruments: templates, matrices, canvases, and board-ready models that compress complexity into clarity.",
      outputs: [
        "Decision matrices & prioritisation logic",
        "Governance and cadence templates",
        "Stakeholder maps and operating playbooks",
      ],
    },
    {
      icon: ShieldCheck,
      title: "Deployment",
      subtitle: "Applied force",
      body:
        "Consulting is applied force — frameworks deployed into real decisions, governance, operating cadence, and execution discipline.",
      outputs: [
        "Board decisions with documented trade-offs",
        "Operating cadence that survives reality",
        "Execution accountability and risk containment",
      ],
    },
  ];

  // Flagship frameworks (samples)
  const frameworks: FrameworkCard[] = [
    {
      title: "Purpose Pyramid",
      tag: "Mandate clarity",
      icon: BadgeCheck,
      solves:
        "Mission drift, competing priorities, and leadership noise by forcing a hierarchy of purpose.",
      when:
        "Annual strategy, culture reset, founder transitions, post-crisis mandate clarification.",
      outputs:
        "One-page purpose hierarchy; alignment narrative; priorities tied to mandate.",
      publicHref: "/resources/strategic-frameworks",
      gated: true,
    },
    {
      title: "Decision Matrix",
      tag: "Trade-off discipline",
      icon: Radar,
      solves:
        "Slow decisions and false urgency by scoring reality — impact, effort, risk, and certainty.",
      when:
        "Portfolio prioritisation, resourcing, product bets, capability investment decisions.",
      outputs:
        "Decision scorecard; options ranking; risk notes; next actions.",
      publicHref: "/resources/strategic-frameworks",
      gated: true,
    },
    {
      title: "Legacy Canvas",
      tag: "Long-range architecture",
      icon: Landmark,
      solves:
        "Short-termism by mapping legacy domains (financial, intellectual, relational, spiritual) into a coherent plan.",
      when:
        "Succession, personal brand consolidation, household planning, foundation design.",
      outputs:
        "Legacy map; stewardship plan; multi-year milestones; accountability cadence.",
      publicHref: "/resources/strategic-frameworks",
      gated: true,
    },
    {
      title: "Governance Grid",
      tag: "Legitimacy & control",
      icon: ShieldCheck,
      solves:
        "Blurry authority and weak execution by defining decision rights, controls, cadence, and accountability.",
      when:
        "Board resets, operating model upgrades, investor readiness, post-merger alignment.",
      outputs:
        "Decision rights map; meeting cadence; escalation rules; accountability structure.",
      publicHref: "/resources/strategic-frameworks",
      gated: true,
    },
    {
      title: "Stakeholder Heatmap",
      tag: "Political reality",
      icon: Globe,
      solves:
        "Surprises, resistance, and hidden veto power by mapping influence, incentives, risk, and alignment.",
      when:
        "Market entry, public/private partnerships, transformation programmes, high-stakes changes.",
      outputs:
        "Stakeholder map; influence score; engagement plan; risk mitigations.",
      publicHref: "/resources/strategic-frameworks",
      gated: true,
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
      icon: BadgeCheck,
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
      icon: Radar,
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

        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
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
                href="/contact"
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

              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-widest text-cream transition-colors hover:bg-white/10"
              >
                View Salons
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
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <MandateStatement />
        </div>
        <div className="mt-16">
          <StrategicFunnelStrip />
        </div>
      </section>

      {/* =========================================================
          STRATEGIC FRAMEWORKS ENGINE (CANON → FRAMEWORK → DEPLOYMENT)
         ========================================================= */}
      <section className="relative bg-zinc-950 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-12"
          >
            <motion.p
              variants={fadeUp}
              className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold"
            >
              Strategic Frameworks Engine
            </motion.p>

            <motion.h2
              variants={fadeUp}
              className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl"
            >
              From Canon → Framework → Deployment
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg"
            >
              The Canon is the spine. Resources are the muscles. Consulting is applied force.
              This is how ancient principles become modern execution — without turning the page into a
              lead-gen gimmick.
            </motion.p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {pipeline.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={reduceMotion ? { duration: 0.01 } : { duration: 0.6, ease: easeSettle }}
                  className="rounded-3xl border border-white/8 bg-white/[0.03] p-8 hover:border-gold/25"
                >
                  <div className="mb-5 inline-flex items-center gap-3">
                    <div className="rounded-2xl border border-gold/25 bg-gold/10 p-3">
                      <Icon className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.32em] text-gold/90">
                        {card.subtitle}
                      </p>
                      <h3 className="font-serif text-xl font-semibold text-white">
                        {card.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-gray-400">{card.body}</p>

                  <div className="mt-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-gray-500">
                      Typical outputs
                    </p>
                    <ul className="mt-3 space-y-2">
                      {card.outputs.map((o) => (
                        <li key={o} className="flex items-start gap-3 text-xs text-gray-300">
                          <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold/60" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/resources/strategic-frameworks"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-7 py-4 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
            >
              Enter the Framework Library
              <Library className="h-4 w-4" />
            </Link>

            <Link
              href="/inner-circle"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-7 py-4 text-sm font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
            >
              Unlock the Full Library
              <Lock className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          FLAGSHIP FRAMEWORKS (SAMPLES)
         ========================================================= */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="mb-12 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Flagship frameworks
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Samples that prove the method
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-400 sm:text-lg">
              Not “thought leadership.” Instruments. Each framework compresses complexity into a usable board artifact.
              View what’s public — unlock the full library for templates, PDFs, and the deeper operating notes.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {frameworks.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/30 hover:bg-white/[0.04]"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="rounded-2xl border border-gold/25 bg-gold/10 p-3">
                      <Icon className="h-6 w-6 text-gold" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-gray-300">
                      {f.tag}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-semibold text-white group-hover:text-gold">
                    {f.title}
                  </h3>

                  <div className="mt-5 space-y-4 text-sm text-gray-400">
                    <p>
                      <span className="font-bold text-gray-200">What it solves:</span>{" "}
                      {f.solves}
                    </p>
                    <p>
                      <span className="font-bold text-gray-200">When to use:</span>{" "}
                      {f.when}
                    </p>
                    <p>
                      <span className="font-bold text-gray-200">Typical outputs:</span>{" "}
                      {f.outputs}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    <Link
                      href={f.publicHref}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-widest text-cream transition hover:bg-white/10"
                    >
                      View (Public)
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/inner-circle"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
                    >
                      Unlock full library
                      <Lock className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
                  Prelude
                </p>
                <h3 className="mt-4 font-serif text-2xl font-semibold text-white">
                  Strategic Frameworks — how tools are built from the Canon
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  A short, board-legible document that explains the engine: principles → instruments → decisions.
                  Read the prelude publicly; unlock the full artifacts through Inner Circle access.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/resources/strategic-frameworks"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                >
                  Read the Prelude
                  <FileText className="h-4 w-4" />
                </Link>
                <Link
                  href="/inner-circle"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
                >
                  Inner Circle access
                  <Lock className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          AREAS OF ENGAGEMENT (existing)
         ========================================================= */}
      <section className="relative bg-zinc-950 py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
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
          BOARD-LEVEL OUTCOMES (inserted)
         ========================================================= */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
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
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-7 py-4 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
            >
              Request Consultation
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/resources/strategic-frameworks"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-bold uppercase tracking-widest text-cream transition hover:bg-white/10"
            >
              Download a sample framework
              <FileText className="h-4 w-4" />
            </Link>

            <Link
              href="/inner-circle"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-7 py-4 text-sm font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
            >
              Inner Circle preview
              <Lock className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW I WORK (existing)
         ========================================================= */}
      <section className="bg-black py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
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
                  href="/contact"
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
                    href="/inner-circle"
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
                If you want a “call for vibes,” this isn’t it. If you want board-legible strategy, we can talk.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/resources/strategic-frameworks"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                >
                  Read the Prelude
                  <FileText className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
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
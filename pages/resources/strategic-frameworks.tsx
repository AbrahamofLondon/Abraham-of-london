// pages/resources/strategic-frameworks.tsx
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Download,
  Shield,
  Briefcase,
  Layers,
  Compass,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Gauge,
  Scale,
  Target,
  Workflow,
} from "lucide-react";

import Layout from "@/components/Layout";

type FrameworkTier = "Board" | "Founder" | "Household";

type Framework = {
  key: string;
  title: string;
  oneLiner: string;
  tier: FrameworkTier[];
  useWhen: string[];
  inputs: string[];
  outputs: string[];
  failureModes: string[];
  canonRoot: string;
  dossierHref: string;
  artifactHref?: string;
  accent: "gold" | "emerald" | "blue" | "rose" | "indigo";
};

type EngagementMode = {
  title: string;
  duration: string;
  outcome: string;
  whoFor: string;
  whatYouReceive: string[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const easeSettle: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easeSettle } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const ACCENTS = {
  gold: {
    ring: "ring-amber-400/25",
    border: "border-amber-400/20 hover:border-amber-400/35",
    chip: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    glow: "from-amber-500/18 via-amber-500/6 to-transparent",
    link: "text-amber-200 hover:text-amber-100",
    icon: "text-amber-200",
  },
  emerald: {
    ring: "ring-emerald-400/20",
    border: "border-emerald-400/20 hover:border-emerald-400/35",
    chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    glow: "from-emerald-500/16 via-emerald-500/6 to-transparent",
    link: "text-emerald-200 hover:text-emerald-100",
    icon: "text-emerald-200",
  },
  blue: {
    ring: "ring-sky-400/20",
    border: "border-sky-400/20 hover:border-sky-400/35",
    chip: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    glow: "from-sky-500/16 via-sky-500/6 to-transparent",
    link: "text-sky-200 hover:text-sky-100",
    icon: "text-sky-200",
  },
  rose: {
    ring: "ring-rose-400/20",
    border: "border-rose-400/20 hover:border-rose-400/35",
    chip: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    glow: "from-rose-500/16 via-rose-500/6 to-transparent",
    link: "text-rose-200 hover:text-rose-100",
    icon: "text-rose-200",
  },
  indigo: {
    ring: "ring-indigo-400/20",
    border: "border-indigo-400/20 hover:border-indigo-400/35",
    chip: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    glow: "from-indigo-500/16 via-indigo-500/6 to-transparent",
    link: "text-indigo-200 hover:text-indigo-100",
    icon: "text-indigo-200",
  },
} as const;

const BOARD_PACK_PDF = "/downloads/strategic-frameworks-board-pack.pdf";
const DECISION_LOG_TEMPLATE = "/downloads/decision-log-template.pdf";
const CADENCE_TEMPLATE = "/downloads/operating-cadence-template.pdf";

const FRAMEWORKS: Framework[] = [
  {
    key: "purpose-pyramid",
    title: "The Purpose Pyramid",
    oneLiner:
      "A hierarchy that forces clarity: survival → success → significance → legacy.",
    tier: ["Board", "Founder", "Household"],
    useWhen: [
      "Your organisation is busy but directionless.",
      "You have strategy decks but no mandate.",
      "The team is optimising outputs while the mission drifts.",
    ],
    inputs: [
      "Stated mission and incentives (what people are rewarded for).",
      "Operating constraints (cash, time, compliance, market reality).",
      "Leadership intent (what you actually want to be true in 3–5 years).",
    ],
    outputs: [
      "Mandate statement (one paragraph, non-poetic).",
      "Priority stack (top 5, ranked, with trade-offs).",
      "Kill list (what stops immediately).",
    ],
    failureModes: [
      "Confusing identity with marketing language.",
      "Trying to serve every tier simultaneously.",
      "Leaving incentives misaligned with the stated purpose.",
    ],
    canonRoot:
      "Created order implies ordered aims: identity precedes assignment; assignment governs stewardship.",
    dossierHref: "/resources/strategic-frameworks/purpose-pyramid",
    artifactHref: "/resources/strategic-frameworks#download",
    accent: "gold",
  },
  {
    key: "decision-matrix",
    title: "The Decision Matrix",
    oneLiner:
      "Decision hygiene for complex calls: impact, effort, risk, certainty, moral cost.",
    tier: ["Board", "Founder"],
    useWhen: [
      "You are drowning in options and starving for decisions.",
      "Politics is winning over evidence.",
      "Risk is being talked about, not quantified.",
    ],
    inputs: [
      "Decision candidates (3–12 items).",
      "Known constraints and non-negotiables.",
      "Risk register inputs (financial, legal, reputational, ethical).",
    ],
    outputs: [
      "Ranked decisions with rationale (audit trail).",
      "Decision log entry (owner, date, assumptions, review date).",
      "Trigger points (what would change the decision).",
    ],
    failureModes: [
      "Scoring without agreeing what the scores mean.",
      "Pretending unknowns are knowns.",
      "Skipping the review date (how bad decisions become permanent).",
    ],
    canonRoot:
      "Wisdom is applied truth under constraint; governance requires accountable reasoning, not vibes.",
    dossierHref: "/resources/strategic-frameworks/decision-matrix",
    artifactHref: DECISION_LOG_TEMPLATE,
    accent: "blue",
  },
  {
    key: "legacy-canvas",
    title: "The Legacy Canvas",
    oneLiner:
      "A 4D legacy model: financial, intellectual, relational, spiritual—measured over time.",
    tier: ["Board", "Founder", "Household"],
    useWhen: [
      "You want multi-generational thinking, not short-term adrenaline.",
      "You sense the cost of success without meaning.",
      "You need a long-range governance frame for decisions today.",
    ],
    inputs: [
      "Current state (assets, relationships, knowledge, convictions).",
      "Time horizon (3, 10, 25 years).",
      "Stewardship priorities and constraints.",
    ],
    outputs: [
      "Legacy scorecard (leading indicators, not just outcomes).",
      "Succession intent and skills gaps.",
      "Household / company formation plan (values, rhythms, boundaries).",
    ],
    failureModes: [
      "Treating legacy as branding.",
      "Ignoring relational debt.",
      "Leaving spiritual formation to chance (it will not go well).",
    ],
    canonRoot:
      "Stewardship is time-bound accountability; the future is shaped by today’s formation and discipline.",
    dossierHref: "/resources/strategic-frameworks/legacy-canvas",
    artifactHref: CADENCE_TEMPLATE,
    accent: "indigo",
  },
  {
    key: "governance-ladder",
    title: "The Governance Ladder",
    oneLiner:
      "A maturity model: from founder intuition → accountable governance → institutional resilience.",
    tier: ["Board", "Founder"],
    useWhen: [
      "The business is bigger than the founder’s bandwidth.",
      "Decisions rely on personalities, not protocols.",
      "Execution fails because roles and authority are vague.",
    ],
    inputs: [
      "Current org chart and actual decision rights.",
      "Recurring failure points (missed deadlines, quality drift, conflict).",
      "Existing cadence (meetings, reporting, escalation paths).",
    ],
    outputs: [
      "Decision rights map (who decides, who advises, who executes).",
      "Cadence design (weekly, monthly, quarterly).",
      "Accountability loops (metrics, reviews, escalation triggers).",
    ],
    failureModes: [
      "Installing bureaucracy instead of governance.",
      "Creating meetings without decisions.",
      "Ignoring incentives (governance that fights the reward system will lose).",
    ],
    canonRoot:
      "Order is mercy: structure prevents chaos; authority without accountability becomes exploitation.",
    dossierHref: "/resources/strategic-frameworks/governance-ladder",
    accent: "rose",
  },
  {
    key: "pressure-protocol",
    title: "The Pressure Protocol",
    oneLiner:
      "A disciplined response model for crisis, conflict, reputational threat, and high-stakes trade-offs.",
    tier: ["Board", "Founder", "Household"],
    useWhen: [
      "Emotions are hijacking decisions.",
      "Speed is required but recklessness is expensive.",
      "You need clarity within 24–72 hours.",
    ],
    inputs: [
      "Situation brief (facts vs interpretations).",
      "Constraints (legal, financial, moral, relational).",
      "Stakeholder map and expected reactions.",
    ],
    outputs: [
      "Response plan (48 hours) + stabilization plan (30 days).",
      "Communication doctrine (what is said, by whom, and what is never said).",
      "Post-mortem structure (learning without scapegoating).",
    ],
    failureModes: [
      "Talking before verifying.",
      "Optimising optics over truth.",
      "Failing to assign an owner with authority.",
    ],
    canonRoot:
      "Self-governance precedes external governance; discipline under pressure is the mark of maturity.",
    dossierHref: "/resources/strategic-frameworks/pressure-protocol",
    accent: "emerald",
  },
];

const ENGAGEMENTS: EngagementMode[] = [
  {
    title: "Board Strategy Room",
    duration: "90 minutes",
    outcome: "Mandate clarity, priority stack, and decision hygiene in one session.",
    whoFor: "Boards, executive teams, founders with institutional weight.",
    whatYouReceive: [
      "Pre-read diagnostic (short, high-signal).",
      "Live facilitation + decision capture.",
      "Post-call board notes (actions, owners, review dates).",
    ],
    icon: Scale,
  },
  {
    title: "Operating System Build",
    duration: "30–60 days",
    outcome: "A durable operating cadence that survives reality, not a slide deck.",
    whoFor: "Founders and leadership teams needing execution discipline.",
    whatYouReceive: [
      "Decision rights + cadence design.",
      "Metrics rhythm (weekly, monthly, quarterly).",
      "Accountability loops and escalation triggers.",
    ],
    icon: Workflow,
  },
  {
    title: "Narrative & Positioning Reset",
    duration: "2–4 weeks",
    outcome: "Story aligned with strategy; market clarity without theatrics.",
    whoFor: "Teams losing trust, traction, or clarity in a noisy market.",
    whatYouReceive: [
      "Positioning map and audience logic.",
      "Message architecture (what you say, what you refuse to say).",
      "Go-to-market focus: fewer bets, higher conviction.",
    ],
    icon: Compass,
  },
  {
    title: "Executive Advisory",
    duration: "Monthly",
    outcome: "Decision support under pressure with an auditable trail.",
    whoFor: "Senior leaders operating in high consequence environments.",
    whatYouReceive: [
      "Decision log discipline.",
      "Risk framing + second-order effect analysis.",
      "Accountability structure, not flattery.",
    ],
    icon: Shield,
  },
];

function TierBadge({ tier }: { tier: FrameworkTier }) {
  const map: Record<FrameworkTier, { label: string; cls: string; icon: JSX.Element }> = {
    Board: {
      label: "Board-grade",
      cls: "border-white/12 bg-white/7 text-white/80",
      icon: <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    Founder: {
      label: "Founder execution",
      cls: "border-white/12 bg-white/7 text-white/80",
      icon: <Gauge className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    Household: {
      label: "Household formation",
      cls: "border-white/12 bg-white/7 text-white/80",
      icon: <Layers className="h-3.5 w-3.5" aria-hidden="true" />,
    },
  };

  const t = map[tier];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        t.cls,
      )}
    >
      {t.icon}
      {t.label}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  icon,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  const Icon = icon;
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1">
        {Icon ? <Icon className="h-4 w-4 text-amber-200" aria-hidden="true" /> : null}
        <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-serif text-4xl font-bold text-white lg:text-5xl">{title}</h2>
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}

const StrategicFrameworksPage: NextPage = () => {
  const reduceMotion = useReducedMotion();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Strategic Frameworks Library | Abraham of London",
    description:
      "Canon-derived strategic frameworks for board-level decisions, founder execution, and household formation: decision hygiene, governance cadence, and durable operating systems.",
    url: "https://www.abrahamoflondon.org/resources/strategic-frameworks",
  };

  return (
    <Layout title="Strategic Frameworks">
      <Head>
        <title>Strategic Frameworks Library | Abraham of London</title>
        <meta
          name="description"
          content="Canon-derived tools for board-level decisions, founder execution, and household formation. Doctrine → decision tools → operating systems."
        />
        <meta property="og:title" content="Strategic Frameworks Library | Abraham of London" />
        <meta
          property="og:description"
          content="Board-grade frameworks with auditable inputs, outputs, and failure modes. Built for decisions under pressure."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://www.abrahamoflondon.org/resources/strategic-frameworks"
        />
        <meta name="theme-color" content="#0b0b10" />
        <link rel="canonical" href="https://www.abrahamoflondon.org/resources/strategic-frameworks" />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* =========================================================
            HERO
           ========================================================= */}
        <section className="relative isolate overflow-hidden border-b border-white/8">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[#06060b]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.14),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.10),transparent_55%)]" />
            <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-black/75 via-black/30 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 py-18 sm:py-22 lg:py-24">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-4xl text-center"
            >
              <motion.div variants={fadeUp} className="mb-6 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 backdrop-blur-sm">
                  <Target className="h-4 w-4 text-amber-200" aria-hidden="true" />
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                    Doctrine → Decision Tools → Operating Systems
                  </span>
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="font-serif text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl"
              >
                Strategic Frameworks{" "}
                <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100 bg-clip-text text-transparent">
                  Library
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-3xl text-lg text-white/80 sm:text-xl">
                Canon-derived frameworks built for decisions under pressure—board-level trade-offs,
                founder execution, and durable household formation.
              </motion.p>

              <motion.div variants={fadeUp} className="mx-auto mt-8 max-w-3xl">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      title: "Auditable",
                      body: "Inputs, outputs, assumptions, review dates. No mystical strategy.",
                      icon: FileText,
                    },
                    {
                      title: "Governance-aware",
                      body: "Decision rights, cadence, escalation triggers, accountability loops.",
                      icon: Shield,
                    },
                    {
                      title: "Reality-tested",
                      body: "Risk, moral cost, second-order effects. Strategy that survives the room.",
                      icon: AlertTriangle,
                    },
                  ].map((i) => {
                    const Icon = i.icon;
                    return (
                      <div
                        key={i.title}
                        className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/7 ring-1 ring-white/10">
                            <Icon className="h-4 w-4 text-amber-200" aria-hidden="true" />
                          </span>
                          <p className="font-semibold text-white">{i.title}</p>
                        </div>
                        <p className="text-sm leading-relaxed text-white/70">{i.body}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-4">
                <a
                  href={BOARD_PACK_PDF}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-8 py-4 font-semibold text-black shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] hover:shadow-amber-500/35"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download the Board Pack (PDF)
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </a>

                <Link
                  href="/consulting"
                  className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/7 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:border-white/28 hover:bg-white/10"
                >
                  Request a Strategy Room
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </motion.div>

              <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-xs uppercase tracking-[0.26em] text-white/55">
                Built for board packs · Designed for repeatability · Optimised for consequences
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* =========================================================
            PIPELINE: CANON → TOOL
           ========================================================= */}
        <section className="relative bg-[#070710] py-18 sm:py-20">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_60%)]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            <SectionHeader
              eyebrow="How this library is built"
              title="The Canon-to-Tool Pipeline"
              subtitle="A simple process that turns ancient principles into deployable frameworks and board-ready artifacts."
              icon={Workflow}
            />

            <div className="mx-auto mt-10 max-w-5xl">
              <div className="grid gap-4 lg:grid-cols-5">
                {[
                  {
                    title: "Canon Principle",
                    body: "A load-bearing truth (origin, order, stewardship, accountability).",
                    icon: Layers,
                  },
                  {
                    title: "Diagnosis",
                    body: "Define the actual problem: constraints, incentives, failure points.",
                    icon: Compass,
                  },
                  {
                    title: "Framework",
                    body: "A repeatable model with clear inputs, outputs, and failure modes.",
                    icon: Target,
                  },
                  {
                    title: "Artifact",
                    body: "Board pack page, worksheet, decision log template, cadence map.",
                    icon: FileText,
                  },
                  {
                    title: "Cadence",
                    body: "Review rhythm + owners + triggers so decisions don’t rot in a drawer.",
                    icon: Gauge,
                  },
                ].map((s, idx) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={reduceMotion ? { duration: 0.01 } : { duration: 0.55, ease: easeSettle, delay: idx * 0.04 }}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-md"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
                    <div className="relative">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/7 ring-1 ring-white/10">
                          <s.icon className="h-4 w-4 text-amber-200" aria-hidden="true" />
                        </span>
                        <p className="text-sm font-semibold text-white">{s.title}</p>
                      </div>
                      <p className="text-sm leading-relaxed text-white/70">{s.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 rounded-3xl border border-amber-400/20 bg-amber-400/8 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/20">
                      <CheckCircle2 className="h-5 w-5 text-amber-200" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">Board-level promise</p>
                      <p className="mt-1 text-sm text-white/75">
                        Every framework ships with a decision trail: assumptions, owners, triggers, and a review date.
                        Strategy without accountability is theatre.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/canon"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/16 bg-white/7 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/26 hover:bg-white/10"
                  >
                    Enter the Canon <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            LIBRARY GRID
           ========================================================= */}
        <section className="relative bg-[#06060c] py-18 sm:py-20">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10),transparent_55%)]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            <SectionHeader
              eyebrow="The library"
              title="Framework Dossiers"
              subtitle="Scan fast. Go deep when needed. Each dossier is built to be used in real rooms—boards, founders, households."
              icon={Layers}
            />

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FRAMEWORKS.map((f, idx) => {
                const A = ACCENTS[f.accent];
                return (
                  <motion.article
                    key={f.key}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-70px" }}
                    transition={reduceMotion ? { duration: 0.01 } : { duration: 0.6, ease: easeSettle, delay: idx * 0.03 }}
                    whileHover={reduceMotion ? {} : { y: -4 }}
                    className={cx(
                      "group relative overflow-hidden rounded-3xl border bg-white/[0.05] p-6 backdrop-blur-md transition",
                      A.border,
                    )}
                  >
                    <div className={cx("absolute inset-0 opacity-80 bg-gradient-to-br", A.glow)} />
                    <div className="relative">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className={cx("rounded-2xl bg-white/7 p-3 ring-1", A.ring)}>
                          <Shield className={cx("h-6 w-6", A.icon)} aria-hidden="true" />
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {f.tier.map((t) => (
                            <TierBadge key={`${f.key}-${t}`} tier={t} />
                          ))}
                        </div>
                      </div>

                      <h3 className="font-serif text-xl font-semibold text-white">{f.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/72">{f.oneLiner}</p>

                      <div className="mt-5 space-y-3">
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60">
                            Use when
                          </p>
                          <ul className="mt-2 space-y-1.5 text-sm text-white/75">
                            {f.useWhen.slice(0, 3).map((x) => (
                              <li key={x} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/55" />
                                <span>{x}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60">
                            Outputs
                          </p>
                          <ul className="mt-2 space-y-1.5 text-sm text-white/75">
                            {f.outputs.slice(0, 3).map((x) => (
                              <li key={x} className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" aria-hidden="true" />
                                <span>{x}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60">
                            Canon root
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-white/75">{f.canonRoot}</p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <Link
                          href={f.dossierHref}
                          className={cx("inline-flex items-center gap-2 text-sm font-semibold", A.link)}
                        >
                          Open dossier <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </Link>

                        {f.artifactHref ? (
                          <a
                            href={f.artifactHref}
                            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-white/22 hover:bg-white/10"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                            Artifact
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {/* Download strip */}
            <div id="download" className="mt-12 rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-white/7 ring-1 ring-white/10">
                    <Download className="h-5 w-5 text-amber-200" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">Download artifacts</p>
                    <p className="mt-1 text-sm text-white/70">
                      Board pack + templates you can use immediately. If you want a clean strategy stack,
                      start here.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={BOARD_PACK_PDF}
                        className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-200"
                      >
                        Board Pack (PDF) <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                      <a
                        href={DECISION_LOG_TEMPLATE}
                        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                      >
                        Decision Log <FileText className="h-4 w-4" aria-hidden="true" />
                      </a>
                      <a
                        href={CADENCE_TEMPLATE}
                        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                      >
                        Operating Cadence <Workflow className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>

                <Link
                  href="/consulting"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/7 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/28 hover:bg-white/10"
                >
                  Apply this in your room <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            ENGAGEMENT MODES
           ========================================================= */}
        <section className="relative bg-[#070710] py-18 sm:py-20">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_60%)]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            <SectionHeader
              eyebrow="Engagements"
              title="Strategy work for serious builders"
              subtitle="Not services. Modes of work. Clear outcomes. Clean artifacts. No motivational theatre."
              icon={Briefcase}
            />

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {ENGAGEMENTS.map((e, idx) => {
                const Icon = e.icon;
                return (
                  <motion.div
                    key={e.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={reduceMotion ? { duration: 0.01 } : { duration: 0.6, ease: easeSettle, delay: idx * 0.04 }}
                    className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/7 ring-1 ring-white/10">
                        <Icon className="h-5 w-5 text-amber-200" aria-hidden="true" />
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-serif text-xl font-semibold text-white">{e.title}</p>
                          <span className="rounded-full border border-white/12 bg-white/7 px-3 py-1 text-[11px] font-semibold text-white/75">
                            {e.duration}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-white/72">
                          <span className="font-semibold text-white">Outcome:</span> {e.outcome}
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60">
                              Who it is for
                            </p>
                            <p className="mt-2 text-sm text-white/75">{e.whoFor}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60">
                              What you receive
                            </p>
                            <ul className="mt-2 space-y-1.5 text-sm text-white/75">
                              {e.whatYouReceive.map((x) => (
                                <li key={x} className="flex gap-2">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" aria-hidden="true" />
                                  <span>{x}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <Link
                            href="/consulting"
                            className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-200"
                          >
                            Request this mode <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                          >
                            Send a brief <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* One-line process */}
            <div className="mt-10 rounded-3xl border border-amber-400/20 bg-amber-400/8 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/20">
                    <Compass className="h-5 w-5 text-amber-200" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">How it works</p>
                    <p className="mt-1 text-sm text-white/75">
                      1 call → 1 diagnostic → 1 proposed operating plan. Clear owners, review dates, and a decision trail.
                    </p>
                  </div>
                </div>
                <Link
                  href="/consulting"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/80"
                >
                  Book a strategy conversation <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            FINAL CTA
           ========================================================= */}
        <section className="relative overflow-hidden border-t border-white/10 bg-gradient-to-r from-amber-300 to-amber-500 py-16 text-center">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.25),transparent_60%)]" />
          </div>

          <div className="relative mx-auto max-w-4xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.7, ease: easeSettle }}
            >
              <h2 className="font-serif text-4xl font-bold text-black lg:text-5xl">
                Build, don&apos;t drift.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-black/85 sm:text-xl">
                Start with the Board Pack, open a dossier, or bring your real decisions into a Strategy Room.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <a
                  href={BOARD_PACK_PDF}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Download Board Pack <Download className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link
                  href="/consulting"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-transparent px-8 py-4 font-semibold text-black transition-all hover:bg-black hover:text-white"
                >
                  Request a Strategy Room <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <p className="mt-8 text-xs font-black uppercase tracking-[0.26em] text-black/75">
                Serious men. Serious systems.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default StrategicFrameworksPage;
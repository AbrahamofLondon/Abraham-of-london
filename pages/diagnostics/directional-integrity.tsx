/* ============================================================================
   FILE: pages/diagnostics/directional-integrity.tsx
   DIRECTIONAL INTEGRITY — SYSTEM ENTRY DIAGNOSTIC
   Purpose:
   - act as the strongest initial assessment entry point
   - feel useful on its own
   - reveal enough of the wider system to create appetite
   - route naturally toward team / enterprise / strategy room
============================================================================ */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  Compass,
  Anchor,
  Activity,
  Target,
  Clock,
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  Scale,
  Crown,
  Lock,
  Radar,
  AlertTriangle,
  Users,
  Building2,
  ChevronRight,
  FileText,
  Sparkles,
  Layers,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  bandFromPct,
  buildSectionScore,
  severityFromPct,
  submitDiagnostic,
  scoreToneClass,
} from "@/lib/diagnostics/client";
import type {
  DiagnosticAnswer,
  DiagnosticAnswerValue,
  DiagnosticSubmitResponse,
  DiagnosticSectionScore,
} from "@/lib/diagnostics/types";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

type DirectionalSection = {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  diagnosticUse: string;
  questions: string[];
};

const SECTIONS: DirectionalSection[] = [
  {
    id: "identity",
    title: "Identity & Mandate",
    icon: ShieldCheck,
    description:
      "Assessing the clarity of your core assignment, calling, and present operating focus.",
    diagnosticUse:
      "This reveals whether drift begins at the level of identity, role confusion, or borrowed purpose.",
    questions: [
      "I can clearly state my current mandate in one sentence.",
      "My priorities reflect that mandate, not my mood.",
      "I am not operating from confusion or borrowed direction.",
    ],
  },
  {
    id: "decision",
    title: "Decision Integrity",
    icon: Compass,
    description:
      "Evaluating the quality, coherence, and integrity of recent decisions.",
    diagnosticUse:
      "This reveals whether the problem is judgement weakness rather than external opposition.",
    questions: [
      "My recent major decisions align with my stated values.",
      "I am not making reactive choices under pressure.",
      "I can explain why I am doing what I am doing.",
    ],
  },
  {
    id: "environment",
    title: "Environmental Alignment",
    icon: Anchor,
    description:
      "Measuring the reinforcing or corrosive effect of your immediate environment.",
    diagnosticUse:
      "This reveals whether your relationships, inputs, and operating conditions are diluting direction.",
    questions: [
      "My relationships reinforce my direction, not dilute it.",
      "I am not tolerating environments that produce confusion.",
      "My inputs are curated, not chaotic.",
    ],
  },
  {
    id: "behaviour",
    title: "Operational Behaviour",
    icon: Activity,
    description:
      "Tracking whether intent is converting into disciplined daily movement.",
    diagnosticUse:
      "This reveals whether the issue is genuine misalignment or simply low behavioural execution.",
    questions: [
      "My daily habits move me toward long-term outcomes.",
      "My calendar reflects what I claim matters.",
      "I am producing measurable outputs, not just activity.",
    ],
  },
  {
    id: "order",
    title: "Emotional & Internal Order",
    icon: Target,
    description:
      "Gauging emotional regulation, pressure response, and internal steadiness.",
    diagnosticUse:
      "This reveals whether instability is being driven by fear, comparison, validation, or poor internal order.",
    questions: [
      "My emotional state is regulated under pressure.",
      "I am not driven by fear, comparison, or validation.",
      "I recover quickly from disruption without losing direction.",
    ],
  },
  {
    id: "legacy",
    title: "Legacy Orientation",
    icon: Clock,
    description:
      "Analyzing the long-range structural value and seriousness of current work.",
    diagnosticUse:
      "This reveals whether current action is building enduring structure or merely servicing comfort.",
    questions: [
      "I am building something that outlasts immediate comfort.",
      "My current actions contribute to a long-term structure.",
      "I am increasing responsibility, not retreating into ease.",
    ],
  },
];

const LADDER = [
  {
    title: "Directional Integrity",
    body: "Start here when the signal still appears personal, internal, behavioural, or mandate-related.",
    href: "/diagnostics/directional-integrity",
    icon: ShieldCheck,
    active: true,
  },
  {
    title: "Team Alignment",
    body: "Move here when several people are now carrying the drag, confusion, or execution cost.",
    href: "/diagnostics/team-alignment",
    icon: Users,
  },
  {
    title: "Enterprise Diagnostic",
    body: "Move here when the matter has become institutional, structural, political, or reputational.",
    href: "/diagnostics/enterprise",
    icon: Building2,
  },
  {
    title: "Strategy Room",
    body: "Enter here when the cost of delay or misjudgement is already commercially material.",
    href: "/strategy-room",
    icon: Crown,
  },
] as const;

function scoreLabel(value: DiagnosticAnswerValue) {
  if (value === 1) return "Strongly No";
  if (value === 2) return "No";
  if (value === 3) return "Mixed";
  if (value === 4) return "Yes";
  return "Strongly Yes";
}

function bandMeta(band: string) {
  switch (band) {
    case "stable":
      return {
        label: "Stable",
        chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
        body: "Your present direction is materially coherent. The task is preservation and strengthening.",
      };
    case "watch":
      return {
        label: "Watch",
        chip: "border-amber-400/25 bg-amber-500/10 text-amber-300",
        body: "Drift is now visible. The structure is not broken, but it is no longer safe to ignore.",
      };
    case "fragile":
      return {
        label: "Fragile",
        chip: "border-orange-400/25 bg-orange-500/10 text-orange-300",
        body: "Direction is weakening under pressure. Correction should happen before wider consequence forms.",
      };
    case "escalate":
    default:
      return {
        label: "Escalate",
        chip: "border-red-400/25 bg-red-500/10 text-red-300",
        body: "This is no longer minor drift. The pattern suggests deeper weakness or unstable operating logic.",
      };
  }
}

function severityMeta(severity: string) {
  switch (severity) {
    case "low":
      return "Low severity";
    case "moderate":
      return "Moderate severity";
    case "high":
      return "High severity";
    case "critical":
    default:
      return "Critical severity";
  }
}

function insightFromResults(args: {
  pct: number;
  weakest: DiagnosticSectionScore[];
}): string {
  const weakestTitles = args.weakest.map((s) => s.title).join(" and ");

  if (args.pct >= 80) {
    return `The present reading suggests reasonable coherence. The real task is to protect strength in ${weakestTitles || "weaker zones"} before complacency introduces drift.`;
  }
  if (args.pct >= 60) {
    return `The centre is still holding, but weakness is forming in ${weakestTitles || "specific domains"}. This is the stage where correction is cheaper than future recovery.`;
  }
  if (args.pct >= 40) {
    return `The reading suggests meaningful directional weakness. ${weakestTitles || "Several domains"} now require correction before the issue spreads into wider execution loss.`;
  }
  return `This no longer looks like ordinary inconsistency. Weakness across ${weakestTitles || "core domains"} suggests that the present operating logic is unstable and should not simply be “managed better.”`;
}

function nextMoveFromResults(args: {
  pct: number;
  weakest: DiagnosticSectionScore[];
}): {
  href: string;
  label: string;
  body: string;
} {
  const weakestIds = new Set(args.weakest.map((s) => s.sectionId));

  if (args.pct < 45) {
    return {
      href: "/strategy-room",
      label: "Escalate to Strategy Room",
      body: "The signal is now strong enough that private mandate work may be justified.",
    };
  }

  if (
    weakestIds.has("environment") ||
    weakestIds.has("behaviour") ||
    weakestIds.has("order")
  ) {
    return {
      href: "/diagnostics/team-alignment",
      label: "Continue into Team Alignment",
      body: "The weakness may no longer be purely personal. It may already be affecting relational or operating execution.",
    };
  }

  return {
    href: "/diagnostics/team-alignment",
    label: "Open Team Alignment next",
    body: "Where personal drift begins to affect shared execution, the next useful reading is team-level, not merely more introspection.",
  };
}

const DirectionalIntegrityPage: NextPage = () => {
  const reduceMotion = useReducedMotion();

  const [answers, setAnswers] = React.useState<Record<string, DiagnosticAnswerValue>>({});
  const [notes, setNotes] = React.useState("");
  const [respondentName, setRespondentName] = React.useState("");
  const [respondentEmail, setRespondentEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitResult, setSubmitResult] = React.useState<DiagnosticSubmitResponse | null>(null);

  const answerList = React.useMemo<DiagnosticAnswer[]>(() => {
    const out: DiagnosticAnswer[] = [];

    for (const section of SECTIONS) {
      section.questions.forEach((prompt, qIdx) => {
        const questionId = `${section.id}-${qIdx}`;
        const value = answers[questionId];
        if (!value) return;

        out.push({
          sectionId: section.id,
          questionId,
          prompt,
          value,
        });
      });
    }

    return out;
  }, [answers]);

  const totalQuestions = React.useMemo(
    () => SECTIONS.reduce((sum, section) => sum + section.questions.length, 0),
    [],
  );

  const completedCount = answerList.length;
  const maxScore = totalQuestions * 5;
  const totalScore = answerList.reduce((sum, a) => sum + a.value, 0);
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const severity = severityFromPct(pct);
  const band = bandFromPct(pct);

  const sectionScores = React.useMemo<DiagnosticSectionScore[]>(() => {
    return SECTIONS.map((section) =>
      buildSectionScore({
        sectionId: section.id,
        title: section.title,
        answers: answerList.filter((a) => a.sectionId === section.id),
      }),
    );
  }, [answerList]);

  const sortedSections = React.useMemo(() => {
    return [...sectionScores].sort((a, b) => a.pct - b.pct);
  }, [sectionScores]);

  const weakestSections = sortedSections.slice(0, 2);
  const strongestSections = [...sectionScores].sort((a, b) => b.pct - a.pct).slice(0, 2);

  const progressPercentage =
    totalQuestions > 0 ? (completedCount / totalQuestions) * 100 : 0;

  const handleSelect = (id: string, value: DiagnosticAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const canSubmit = completedCount === totalQuestions && !isSubmitting;

  const nextMove = React.useMemo(
    () => nextMoveFromResults({ pct, weakest: weakestSections }),
    [pct, weakestSections],
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    const res = await submitDiagnostic({
      kind: "directional-integrity",
      version: "2026.1",
      source: "diagnostics",
      entry: "individual",
      intent: "directional-integrity",
      title: "Directional Integrity Assessment",
      respondent: {
        name: respondentName || null,
        email: respondentEmail || null,
      },
      answers: answerList,
      notes: notes || null,
      summary: {
        totalScore,
        maxScore,
        pct,
        severity,
        band,
        sectionScores,
      },
      metadata: {
        ui: "directional-integrity-v2",
        ladderPosition: "entry",
      },
    });

    setSubmitResult(res);
    setIsSubmitting(false);
  };

  return (
    <Layout
      title="Directional Integrity | Abraham of London"
      description="A governed diagnostic instrument for mandate, decisions, environment, behaviour, internal order, and legacy posture."
      fullWidth
      className="bg-black text-white"
    >
      <Head>
        <link rel="canonical" href={`${SITE}/diagnostics/directional-integrity`} />
      </Head>

      <main className="min-h-screen bg-black text-white">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[10%] top-[8%] h-[26rem] w-[26rem] rounded-full bg-amber-500/[0.05] blur-[140px]" />
            <div className="absolute right-[12%] top-[20%] h-[22rem] w-[22rem] rounded-full bg-white/[0.02] blur-[120px]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.015)_48%,transparent_100%)]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-28 lg:px-12 lg:pb-28 lg:pt-36">
            <div className="grid gap-14 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="inline-flex items-center gap-3"
                >
                  <span className="h-6 w-px bg-amber-500/30" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/62">
                    Directional Integrity
                  </span>
                </motion.div>

                <motion.div
                  className="mt-6 inline-flex items-center gap-3 border border-amber-500/18 bg-amber-500/[0.05] px-4 py-2"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.06 }}
                >
                  <Fingerprint className="h-4 w-4 text-amber-400/70" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-300/78">
                    Entry diagnostic layer
                  </span>
                </motion.div>

                <motion.h1
                  className="mt-8 max-w-[12ch] font-serif text-5xl font-light leading-[0.94] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.4rem]"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.1 }}
                >
                  Start where
                  <span className="mt-2 block text-white/56">
                    direction begins to weaken
                  </span>
                </motion.h1>

                <motion.p
                  className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/54"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.18 }}
                >
                  This is the right first reading when the problem still appears
                  personal, behavioural, internal, or mandate-based. It diagnoses
                  clarity, drift, judgement, environment, emotional order, and
                  legacy posture before the matter spreads into team or institutional consequence.
                </motion.p>

                <motion.div
                  className="mt-10 flex flex-wrap gap-3"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.26 }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/68">
                    <Lock className="h-3.5 w-3.5 text-amber-300/80" />
                    No account required
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/68">
                    <Radar className="h-3.5 w-3.5 text-amber-300/80" />
                    Report-ready structure
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/68">
                    <Scale className="h-3.5 w-3.5 text-amber-300/80" />
                    Escalation-aware
                  </span>
                </motion.div>
              </div>

              <motion.div
                className="self-end"
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.18 }}
              >
                <div className="border border-white/[0.08] bg-white/[0.02] p-8 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">
                      Why this exists
                    </span>
                    <Sparkles className="h-4 w-4 text-amber-400/55" />
                  </div>

                  <div className="grid grid-cols-3 gap-6 border-y border-white/6 py-6">
                    <MetricTile label="Layer" value="Entry" />
                    <MetricTile label="Use" value="Signal" />
                    <MetricTile label="Bias" value="Clarity" />
                  </div>

                  <div className="mt-8 space-y-4">
                    {[
                      "Separates ordinary inconsistency from real drift",
                      "Clarifies whether the issue is personal or already shared",
                      "Creates appetite for deeper system work without giving away the cathedral",
                      "Prepares serious users for the next correct move",
                    ].map((line) => (
                      <div key={line} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-amber-400/70" />
                        <span className="text-sm leading-relaxed text-white/58">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* LADDER */}
        <section className="relative py-20 border-b border-white/5">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12">
              <div className="inline-flex items-center gap-3">
                <span className="h-6 w-px bg-amber-500/30" />
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/62">
                  System ladder
                </span>
              </div>
              <h2 className="mt-7 max-w-4xl font-serif text-4xl text-white md:text-5xl">
                This assessment belongs to a governed sequence.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                It should not feel like an isolated quiz. It should feel like the first honest door into a larger architecture.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
              {LADDER.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.06 }}
                    className={[
                      "border p-6",
                      item.active
                        ? "border-amber-500/20 bg-amber-500/[0.04]"
                        : "border-white/[0.08] bg-white/[0.02]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Icon className="h-5 w-5 text-amber-400/70" />
                      <span className="font-mono text-[10px] text-white/20">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-5 font-serif text-2xl text-white">{item.title}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-white/48">{item.body}</p>
                    <Link
                      href={item.href}
                      className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/72 transition-colors hover:text-amber-300"
                    >
                      <span>{item.active ? "Current step" : "Open step"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* LIVE HEADER BAR */}
        <section className="sticky top-24 z-40 border-b border-white/5 bg-black/80 backdrop-blur-2xl">
          <div className="mx-auto max-w-7xl px-6 py-5 lg:px-12">
            <div className="rounded-sm border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest">
                <span className="text-white/40">Directional Integrity Signal</span>
                <span className={scoreToneClass(pct)}>
                  {totalScore} / {maxScore} • {band}
                </span>
              </div>

              <div className="mt-4 h-[2px] w-full bg-white/5">
                <motion.div
                  className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.18em]">
                <span className="text-white/28">
                  {completedCount} of {totalQuestions} answered
                </span>
                <span className="text-white/28">
                  {severityMeta(severity)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* RESPONDENT */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-10">
              <div className="inline-flex items-center gap-3">
                <span className="h-6 w-px bg-amber-500/30" />
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/62">
                  Identity layer
                </span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="border border-white/5 bg-white/[0.02] p-6">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40">
                  Respondent Name
                </label>
                <input
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  className="mt-3 w-full border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition-colors focus:border-amber-500/40"
                  placeholder="Your name"
                />
              </div>

              <div className="border border-white/5 bg-white/[0.02] p-6">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40">
                  Respondent Email
                </label>
                <input
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  className="mt-3 w-full border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none transition-colors focus:border-amber-500/40"
                  placeholder="you@example.com"
                  type="email"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION QUESTIONS */}
        <section className="pb-8">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="space-y-28">
              {SECTIONS.map((section) => {
                const Icon = section.icon;

                return (
                  <motion.section
                    key={section.id}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.65 }}
                    className="group relative"
                  >
                    <div className="flex flex-col gap-12 lg:flex-row lg:gap-24">
                      <div className="lg:w-[30%]">
                        <div className="flex h-14 w-14 items-center justify-center border border-white/10 bg-white/[0.02] text-amber-400/40 transition-all group-hover:border-amber-500/30 group-hover:text-amber-400">
                          <Icon size={24} strokeWidth={1} />
                        </div>

                        <h2 className="mt-8 font-serif text-3xl font-light text-white">
                          {section.title}
                        </h2>

                        <p className="mt-4 text-sm leading-relaxed text-white/34">
                          {section.description}
                        </p>

                        <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4">
                          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/26">
                            Why this domain matters
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-white/46">
                            {section.diagnosticUse}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        {section.questions.map((question, qIdx) => {
                          const qId = `${section.id}-${qIdx}`;
                          const current = answers[qId];

                          return (
                            <div
                              key={qId}
                              className="border border-white/5 bg-white/[0.01] p-8 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.03]"
                            >
                              <div className="text-base font-light leading-relaxed text-white/82">
                                {question}
                              </div>

                              <div className="mt-6 grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map((n) => {
                                  const value = n as DiagnosticAnswerValue;
                                  const active = current === value;

                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() => handleSelect(qId, value)}
                                      className={[
                                        "border px-3 py-4 text-center transition-all",
                                        active
                                          ? "border-amber-500 bg-amber-500/10 text-white"
                                          : "border-white/10 bg-black/10 text-white/40 hover:border-white/20 hover:text-white/70",
                                      ].join(" ")}
                                    >
                                      <div className="font-mono text-[11px] font-bold">{n}</div>
                                      <div className="mt-1 text-[9px] uppercase tracking-wide">
                                        {scoreLabel(value)}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.section>
                );
              })}
            </div>
          </div>
        </section>

        {/* NOTES */}
        <section className="pt-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="border-t border-white/10 pt-20">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                Strategic observations
              </h3>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record drift observations, pattern notes, or possible correction priorities..."
                className="mt-8 w-full border border-white/5 bg-white/[0.02] p-8 font-serif text-xl font-light text-white placeholder:text-white/12 transition-colors focus:border-amber-500/30 focus:outline-none focus:ring-0"
                rows={4}
              />
            </div>
          </div>
        </section>

        {/* LIVE INTERPRETATION */}
        <section className="pt-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="border border-white/[0.08] bg-white/[0.02] p-8">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-amber-400/60" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-300/72">
                    Live interpretation
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${bandMeta(band).chip}`}>
                    {bandMeta(band).label}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
                    {severityMeta(severity)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
                    {completedCount}/{totalQuestions} complete
                  </span>
                </div>

                <p className="mt-6 text-base leading-relaxed text-white/64">
                  {bandMeta(band).body}
                </p>

                <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 p-5">
                  <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/26">
                    Forensic reading
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/54">
                    {insightFromResults({ pct, weakest: weakestSections })}
                  </p>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
                    <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/26">
                      Strongest domains
                    </div>
                    <div className="mt-3 space-y-2">
                      {strongestSections.map((s) => (
                        <div key={s.sectionId} className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-white/66">{s.title}</span>
                          <span className="text-emerald-300">{s.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
                    <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/26">
                      Weakest domains
                    </div>
                    <div className="mt-3 space-y-2">
                      {weakestSections.map((s) => (
                        <div key={s.sectionId} className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-white/66">{s.title}</span>
                          <span className="text-amber-300">{s.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-white/[0.08] bg-white/[0.02] p-8">
                <div className="flex items-center gap-3">
                  <ArrowRight className="h-4 w-4 text-amber-400/60" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-300/72">
                    Right next move
                  </span>
                </div>

                <h3 className="mt-6 font-serif text-3xl text-white">{nextMove.label}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/52">{nextMove.body}</p>

                <div className="mt-8 space-y-4">
                  <Link
                    href={nextMove.href}
                    className="inline-flex items-center gap-2 bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                  >
                    Continue forward
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <div className="rounded-2xl border border-amber-500/16 bg-amber-500/[0.04] p-5">
                    <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/72">
                      System intent
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-white/54">
                      This page should not satisfy curiosity alone. It should create disciplined appetite for the rest of the system.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
                    <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/26">
                      Premium bridge
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-white/46">
                      Serious users who want the premium middle layer before private mandate work should inspect Executive Reporting.
                    </p>
                    <Link
                      href="/diagnostics/executive-reporting"
                      className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/72 transition-colors hover:text-amber-300"
                    >
                      <span>View Executive Reporting</span>
                      <FileText className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUBMIT RESULT */}
        {submitResult?.ok ? (
          <section className="pt-20">
            <div className="mx-auto max-w-7xl px-6 lg:px-12">
              <div className="border border-emerald-500/20 bg-emerald-500/[0.04] p-8">
                <div className="flex items-center gap-3 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
                    Diagnostic submitted
                  </span>
                </div>

                <div className="mt-4 font-serif text-3xl text-white">
                  Reference: {submitResult.diagnosticRef}
                </div>

                <div className="mt-3 text-sm text-white/65">
                  Submission captured and prepared for reporting, dashboard continuity, and downstream escalation logic.
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  {submitResult.dashboardHref ? (
                    <Link
                      href={submitResult.dashboardHref}
                      className="inline-flex items-center gap-2 bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                    >
                      Continue to dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}

                  <Link
                    href={nextMove.href}
                    className="inline-flex items-center gap-2 border border-white/10 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 hover:bg-white/[0.04]"
                  >
                    {nextMove.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/strategy-room"
                    className="inline-flex items-center gap-2 border border-amber-500/20 bg-amber-500/[0.04] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300 hover:bg-amber-500/[0.08]"
                  >
                    Private chamber
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {submitResult && !submitResult.ok ? (
          <section className="pt-20">
            <div className="mx-auto max-w-7xl px-6 lg:px-12">
              <div className="border border-red-500/20 bg-red-500/[0.04] p-8">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-red-300">
                  Submission error
                </div>
                <div className="mt-3 text-sm text-white/70">{submitResult.error}</div>
              </div>
            </div>
          </section>
        ) : null}

        {/* FOOTER CTA */}
        <section className="pt-28 pb-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="border-t border-white/10 pt-16">
              <div className="flex flex-col items-center justify-between gap-12 md:flex-row">
                <div className="max-w-xl">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-white/30">
                    Completion status
                  </div>
                  <div className="mt-3 text-base italic text-white/54">
                    Complete all domains to generate a proper signal and place yourself correctly inside the wider diagnostic system.
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="group relative flex items-center gap-6 bg-white px-16 py-7 font-mono text-[10px] uppercase tracking-[0.4em] text-black transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? "Submitting…" : "Score and Save"}
                  <Fingerprint
                    size={18}
                    className="transition-transform group-hover:rotate-12"
                  />
                </motion.button>
              </div>

              <div className="mt-10 text-xs opacity-40">
                Diagnostic Ref: {submitResult?.ok ? submitResult.diagnosticRef : "Pending API generation"}
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/6 pl-4 first:border-l-0 first:pl-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
        {label}
      </div>
      <div className="mt-2 font-serif text-lg text-white/84">{value}</div>
    </div>
  );
}

export default DirectionalIntegrityPage;
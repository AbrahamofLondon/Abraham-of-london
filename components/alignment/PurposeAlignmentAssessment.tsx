"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, Shield, Target, Activity, Heart, Landmark, ChevronRight } from "lucide-react";
import {
  PURPOSE_ALIGNMENT_QUESTIONS,
  ALIGNMENT_DOMAIN_ORDER,
  ALIGNMENT_DOMAIN_LABELS,
} from "@/lib/alignment/checklist";
import { scorePurposeProfile } from "@/lib/alignment/scoring";
import type {
  AlignmentDomain,
  DualAxisAnswer,
  PurposeProfileResult,
  DomainProfile,
  CoherenceBand,
} from "@/lib/alignment/types";

/* ---- Constants ---- */

const STAGE_DOMAINS: AlignmentDomain[][] = [
  ["identity", "decision"],
  ["environment", "behaviour"],
  ["emotional_order", "legacy"],
];

const STAGE_LABELS = [
  "Identity & Decision Integrity",
  "Environment & Behaviour",
  "Internal Order & Legacy",
];

const DOMAIN_ICONS: Record<AlignmentDomain, React.ComponentType<{ className?: string }>> = {
  identity: Shield,
  decision: Target,
  environment: Activity,
  behaviour: CheckCircle2,
  emotional_order: Heart,
  legacy: Landmark,
};

const RESONANCE_LABELS: Record<number, string> = {
  0: "Completely untrue", 1: "Almost entirely untrue", 2: "Mostly untrue",
  3: "Somewhat untrue", 4: "Slightly untrue", 5: "Neutral",
  6: "Slightly true", 7: "Somewhat true", 8: "Mostly true",
  9: "Almost entirely true", 10: "Completely true",
};

const CERTAINTY_LABELS: Record<number, string> = {
  0: "No confidence", 1: "Very low", 2: "Low", 3: "Some doubt",
  4: "Uncertain", 5: "Moderate", 6: "Fairly confident",
  7: "Confident", 8: "High confidence", 9: "Very high", 10: "Absolute certainty",
};

const BAND_CONFIG: Record<CoherenceBand, { color: string; border: string; bg: string }> = {
  SOVEREIGN: { color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  ALIGNED: { color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  DRIFTING: { color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
  FRAGMENTED: { color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10" },
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---- Sub-components ---- */

function RatingRail({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  accent: "amber" | "emerald";
}) {
  const accentClass = accent === "amber" ? "accent-amber-500" : "accent-emerald-500";
  const labels = accent === "amber" ? RESONANCE_LABELS : CERTAINTY_LABELS;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/40">{label}</span>
        <span className="font-mono text-[10px] text-white/60">{value}/10 — {labels[value] ?? ""}</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10", accentClass)}
      />
    </div>
  );
}

function LiveDomainBar({ profile, delay }: { profile: DomainProfile; delay: number }) {
  const Icon = DOMAIN_ICONS[profile.domain];
  const width = Math.max(2, profile.percent);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-3"
    >
      <Icon className="h-3.5 w-3.5 text-white/30 shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/45">{profile.label}</span>
          <span className="font-mono text-[9px] text-white/55">{profile.percent}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              profile.percent >= 70 ? "bg-emerald-500/70" : profile.percent >= 40 ? "bg-amber-500/70" : "bg-red-500/60",
            )}
            initial={{ width: 0 }}
            animate={{ width: `${width}%` }}
            transition={{ duration: 0.8, delay: delay + 0.1, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ---- Main Component ---- */

type Props = {
  onScored?: (result: PurposeProfileResult, answers: Record<string, DualAxisAnswer>) => void;
};

export default function PurposeAlignmentAssessment({ onScored }: Props) {
  const [stage, setStage] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, DualAxisAnswer>>({});
  const [result, setResult] = React.useState<PurposeProfileResult | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [direction, setDirection] = React.useState(1);

  const isResultStage = stage === STAGE_DOMAINS.length;
  const currentDomains = isResultStage ? [] : STAGE_DOMAINS[stage]!;
  const currentQuestions = PURPOSE_ALIGNMENT_QUESTIONS.filter((q) =>
    currentDomains.includes(q.domain),
  );

  const allAnswered = currentQuestions.every((q) => answers[q.id] !== undefined);
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = PURPOSE_ALIGNMENT_QUESTIONS.length;
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // Live profile computation
  const liveProfile = React.useMemo(() => {
    if (totalAnswered === 0) return null;
    return scorePurposeProfile({ answers });
  }, [answers, totalAnswered]);

  const updateAnswer = (questionId: string, field: "resonance" | "certainty", value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        resonance: prev[questionId]?.resonance ?? 5,
        certainty: prev[questionId]?.certainty ?? 5,
        [field]: value,
      },
    }));
  };

  const advance = () => {
    if (stage < STAGE_DOMAINS.length - 1) {
      setDirection(1);
      setStage((s) => s + 1);
    } else if (stage === STAGE_DOMAINS.length - 1) {
      handleScore();
    }
  };

  const retreat = () => {
    if (stage > 0) {
      setDirection(-1);
      setStage((s) => s - 1);
    }
  };

  const handleScore = async () => {
    setStatus("loading");
    const scored = scorePurposeProfile({ answers });
    setResult(scored);
    setDirection(1);
    setStage(STAGE_DOMAINS.length);

    // Persist to session for downstream diagnostics
    try {
      sessionStorage.setItem("purpose-alignment-result", JSON.stringify(scored));
      sessionStorage.setItem("purpose-alignment-answers", JSON.stringify(answers));
    } catch { /* SSR safety */ }

    onScored?.(scored, answers);

    try {
      await fetch("/api/purpose-alignment/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, result: scored }),
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="relative min-h-[600px]">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            Purpose Alignment Assessment
          </span>
          <span className="font-mono text-[9px] text-white/40">
            {totalAnswered}/{totalQuestions} answered — {progressPercent}%
          </span>
        </div>
        <div className="h-px w-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full bg-amber-500/50"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        {/* Stage indicators */}
        <div className="flex gap-2 mt-3">
          {STAGE_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > stage ? 1 : -1); setStage(i); }}
              className={cn(
                "flex-1 py-2 rounded-lg border text-center font-mono text-[7px] uppercase tracking-[0.2em] transition-all duration-300",
                i === stage && !isResultStage
                  ? "border-amber-500/30 bg-amber-500/[0.07] text-amber-300/80"
                  : i < stage || isResultStage
                    ? "border-white/[0.08] bg-white/[0.02] text-white/40"
                    : "border-white/[0.05] text-white/20",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main panel */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait" custom={direction}>
            {!isResultStage ? (
              <motion.div
                key={`stage-${stage}`}
                custom={direction}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif text-2xl text-white/90">
                    {STAGE_LABELS[stage]}
                  </h2>
                  <p className="mt-2 text-sm text-white/40">
                    Rate each statement on two axes: how true it is for you right now, and how confident you are in that assessment.
                  </p>
                </div>

                {currentQuestions.map((q, qi) => {
                  const answer = answers[q.id];
                  const DomainIcon = DOMAIN_ICONS[q.domain];

                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: qi * 0.06 }}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm"
                    >
                      <div className="flex items-start gap-3 mb-5">
                        <DomainIcon className="h-4 w-4 text-white/30 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/30 block mb-1">
                            {ALIGNMENT_DOMAIN_LABELS[q.domain]}
                          </span>
                          <p className="text-sm leading-relaxed text-white/75">{q.statement}</p>
                        </div>
                      </div>

                      <div className="space-y-4 pl-7">
                        <RatingRail
                          label="Resonance — how true is this?"
                          value={answer?.resonance ?? 5}
                          onChange={(v) => updateAnswer(q.id, "resonance", v)}
                          accent="amber"
                        />
                        <RatingRail
                          label="Certainty — how confident are you?"
                          value={answer?.certainty ?? 5}
                          onChange={(v) => updateAnswer(q.id, "certainty", v)}
                          accent="emerald"
                        />
                      </div>
                    </motion.div>
                  );
                })}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={retreat}
                    disabled={stage === 0}
                    className={cn(
                      "flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors",
                      stage === 0 ? "text-white/15 cursor-not-allowed" : "text-white/50 hover:text-white/80",
                    )}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Previous
                  </button>
                  <button
                    onClick={advance}
                    disabled={!allAnswered}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-6 py-3 font-mono text-[9px] uppercase tracking-[0.2em] transition-all",
                      allAnswered
                        ? "border border-amber-500/30 bg-amber-500/[0.08] text-amber-300 hover:bg-amber-500/[0.15]"
                        : "border border-white/[0.06] text-white/20 cursor-not-allowed",
                    )}
                  >
                    {stage === STAGE_DOMAINS.length - 1 ? "Complete Assessment" : "Continue"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                {/* Score headline */}
                <div className={cn("rounded-2xl border p-8", BAND_CONFIG[result.coherenceBand].border, BAND_CONFIG[result.coherenceBand].bg)}>
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/40 block mb-3">
                    Purpose Alignment Score
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className={cn("font-serif text-5xl font-light", BAND_CONFIG[result.coherenceBand].color)}>
                      {result.percent}%
                    </span>
                    <span className={cn("font-mono text-xs uppercase tracking-wider", BAND_CONFIG[result.coherenceBand].color)}>
                      {result.coherenceBand}
                    </span>
                  </div>
                </div>

                {/* Narrative */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-3">
                    Interpretation
                  </span>
                  <p className="text-sm leading-[1.8] text-white/60">{result.narrative}</p>
                </div>

                {/* Domain breakdown */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block">
                    Domain Profile
                  </span>
                  {result.domainProfiles.map((dp, i) => (
                    <LiveDomainBar key={dp.domain} profile={dp} delay={i * 0.08} />
                  ))}
                </div>

                {/* Next actions */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-3">
                    Recommended Next Actions
                  </span>
                  <div className="space-y-3">
                    {result.nextActions.map((action, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <ChevronRight className="h-3.5 w-3.5 text-amber-500/60 mt-0.5 shrink-0" />
                        <p className="text-sm leading-relaxed text-white/55">{action}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Save status */}
                {status === "loading" && (
                  <p className="font-mono text-[9px] text-white/30">Saving assessment...</p>
                )}
                {status === "error" && (
                  <p className="font-mono text-[9px] text-red-400/60">Failed to save. Your results are preserved in this session.</p>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Live purpose profile sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-sm">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-4">
                Live Purpose Profile
              </span>

              {liveProfile ? (
                <div className="space-y-3">
                  {liveProfile.domainProfiles.map((dp) => (
                    <LiveDomainBar key={dp.domain} profile={dp} delay={0} />
                  ))}
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/35">Overall</span>
                      <span className={cn(
                        "font-serif text-lg",
                        liveProfile.percent >= 70 ? "text-emerald-400" : liveProfile.percent >= 40 ? "text-amber-400" : "text-red-400",
                      )}>
                        {liveProfile.percent}%
                      </span>
                    </div>
                    <span className={cn(
                      "font-mono text-[8px] uppercase tracking-[0.2em]",
                      BAND_CONFIG[liveProfile.coherenceBand].color,
                    )}>
                      {liveProfile.coherenceBand}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-white/25 leading-relaxed">
                  Begin answering questions to see your live purpose profile build in real time.
                </p>
              )}
            </div>

            {/* Legend */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
              <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/25 block mb-3">
                Scoring
              </span>
              <div className="space-y-1.5 text-[10px] text-white/35">
                <p><span className="text-amber-400/60">Resonance</span> — how true the statement is for you right now</p>
                <p><span className="text-emerald-400/60">Certainty</span> — how confident you are in that assessment</p>
                <p className="pt-1 border-t border-white/[0.04] mt-2">
                  Score = resonance x (certainty / 10). High resonance with low certainty produces a lower weighted score.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

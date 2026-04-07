"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  Activity,
  Compass,
  Crown,
  Eye,
  Gavel,
  LayoutGrid,
  LineChart,
  Loader2,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  CheckCircle2,
} from "lucide-react";

import {
  evaluateConstitutionalRoute,
  type ConstitutionalDecision,
} from "@/lib/constitution/rules";

type LikertValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type AnswerValue = {
  resonance: LikertValue;
  certainty: LikertValue;
};

type EvaluationPhase = "idle" | "reading" | "parsing" | "weighing" | "complete";

const STORAGE_KEY = "aol-constitutional-diagnostic-v2";
const AUTO_SAVE_DELAY_MS = 700;

const RESONANCE_LABELS = [
  "Completely false",
  "Severely false",
  "Mostly false",
  "Meaningfully false",
  "Slightly false",
  "Uncertain / mixed",
  "Slightly true",
  "Solidly true",
  "Strongly true",
  "Highly true",
  "Completely true",
] as const;

const CERTAINTY_LABELS = [
  "No certainty",
  "Very low",
  "Low",
  "Limited",
  "Some",
  "Moderate",
  "Reasonable",
  "Strong",
  "High",
  "Very high",
  "Absolute",
] as const;

const DIAGNOSTIC_QUESTIONS = [
  {
    id: "q1",
    text: "The stated strategy and actual resource allocation are meaningfully aligned.",
    domain: "coherence",
  },
  {
    id: "q2",
    text: "Decision authority is clear and exercised without chronic diffusion or bottleneck.",
    domain: "authority",
  },
  {
    id: "q3",
    text: "The operating environment has changed faster than the organisation's ability to adapt.",
    domain: "environment",
  },
  {
    id: "q4",
    text: "There is a pattern of strategic drift — direction stated but not executed with discipline.",
    domain: "execution",
  },
  {
    id: "q5",
    text: "Trust between leadership and execution layers is materially intact.",
    domain: "trust",
  },
  {
    id: "q6",
    text: "The organisation carries visible friction: coordination failures, duplicated work, or unresolved conflict.",
    domain: "friction",
  },
  {
    id: "q7",
    text: "There is a clear decision-maker who can authorise strategic intervention.",
    domain: "authority",
  },
  {
    id: "q8",
    text: "The cost of getting this wrong would be material — financial, reputational, or structural.",
    domain: "stakes",
  },
  {
    id: "q9",
    text: "Past attempts to correct the issue have failed due to structural, not motivational, causes.",
    domain: "pattern",
  },
  {
    id: "q10",
    text: "External market or stakeholder pressure is actively forcing attention to this issue.",
    domain: "pressure",
  },
] as const;

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toLikert(value: number): LikertValue {
  return clamp(Math.round(value), 0, 10) as LikertValue;
}

function average(values: number[], fallback = 5) {
  if (!values.length) return fallback;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeConstitutionalInput(answers: Record<string, AnswerValue>) {
  const byDomain = (domain: string) =>
    Object.entries(answers)
      .filter(([id]) => DIAGNOSTIC_QUESTIONS.find((q) => q.id === id)?.domain === domain)
      .map(([, answer]) => answer.resonance);

  const authorityClarity = average(byDomain("authority")) * 10;
  const coherence = average(byDomain("coherence")) * 10;
  const pressure =
    average([
      ...byDomain("pressure"),
      ...byDomain("stakes"),
      ...byDomain("environment"),
    ]) * 10;
  const friction =
    average([
      ...byDomain("friction"),
      ...byDomain("execution"),
      ...byDomain("pattern"),
    ]) * 10;

  return {
    mandateText: `Authority ${authorityClarity}%, coherence ${coherence}%, pressure ${pressure}%, friction ${friction}%.`,
    role: "diagnostic_user",
    jurisdiction: "international",
    organisationType: "corporation",
    annualRevenueBand: "confidential",
    authorityClarity,
    coherence,
    pressure,
    friction,
  };
}

function getRouteFromDecision(decision: ConstitutionalDecision | null) {
  if (!decision) {
    return {
      route: "PENDING" as const,
      title: "Assessment in progress",
      description: "The chamber is still weighing the signal.",
      href: "#",
      cta: "Continue assessment",
      tone: "neutral" as const,
    };
  }

  switch (decision.route) {
    case "STRATEGY":
      return {
        route: "STRATEGY_ROOM" as const,
        title: "Strategy Room — mandate qualified",
        description:
          "The signal suggests material consequence, real stakes, and sufficiently clear authority for escalation.",
        href: "/consulting/strategy-room",
        cta: "Enter Strategy Room",
        tone: "emerald" as const,
      };
    case "DIAGNOSTIC":
      return {
        route: "EXECUTIVE_REPORTING" as const,
        title: "Executive Reporting — structured interpretation required",
        description:
          "The signal is credible, but it should be refined into a disciplined executive reading before mandate-level intervention.",
        href: "/diagnostics/executive-reporting",
        cta: "Review Executive Reporting",
        tone: "amber" as const,
      };
    case "REJECT":
      return {
        route: "DIAGNOSTIC" as const,
        title: "Continue with disciplined diagnosis",
        description:
          "The matter does not yet justify escalation. More clarity is needed before the system advances it.",
        href: "/diagnostics",
        cta: "Open diagnostics",
        tone: "neutral" as const,
      };
    default:
      return {
        route: "DIAGNOSTIC" as const,
        title: "Continue assessment",
        description: "More signal is required before the chamber can route you.",
        href: "#",
        cta: "Continue",
        tone: "neutral" as const,
      };
  }
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

function PhaseStatus({ phase }: { phase: EvaluationPhase }) {
  const label =
    phase === "idle"
      ? "Awaiting sufficient signal"
      : phase === "reading"
        ? "Reading structural pattern"
        : phase === "parsing"
          ? "Parsing authority and coherence"
          : phase === "weighing"
            ? "Weighing against constitutional thresholds"
            : "Assessment complete";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {phase === "complete" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : phase === "idle" ? (
          <Eye className="h-4 w-4 text-white/35" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
        )}

        <span className="text-xs font-mono uppercase tracking-[0.16em] text-white/42">
          {label}
        </span>
      </div>
    </div>
  );
}

function SignalTile({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: string;
  tone?: "neutral" | "amber" | "emerald";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "emerald"
          ? "border-emerald-500/20 bg-emerald-500/10"
          : tone === "amber"
            ? "border-amber-500/20 bg-amber-500/10"
            : "border-white/10 bg-white/5",
      )}
    >
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
        {title}
      </div>
      <div className="mt-2 font-serif text-2xl text-white">{value}</div>
    </div>
  );
}

function RatingRail({
  label,
  value,
  onChange,
  valueLabel,
  accent,
}: {
  label: string;
  value: LikertValue;
  onChange: (value: LikertValue) => void;
  valueLabel: string;
  accent: "amber" | "emerald";
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-xs font-mono uppercase tracking-[0.16em] text-white/40">
          {label}
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            accent === "amber" ? "text-amber-300" : "text-emerald-300",
          )}
        >
          {valueLabel}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(toLikert(Number(e.target.value)))}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10",
          accent === "amber" ? "accent-amber-500" : "accent-emerald-400",
        )}
      />
    </div>
  );
}

export default function ConstitutionalDiagnostic() {
  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<EvaluationPhase>("idle");
  const [decision, setDecision] = React.useState<ConstitutionalDecision | null>(null);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / DIAGNOSTIC_QUESTIONS.length) * 100);
  const currentQuestion = DIAGNOSTIC_QUESTIONS[currentQuestionIndex];
  const currentAnswer =
    answers[currentQuestion.id] ?? { resonance: 5 as LikertValue, certainty: 5 as LikertValue };
  const isComplete = answeredCount === DIAGNOSTIC_QUESTIONS.length;

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.answers) setAnswers(parsed.answers);
      if (typeof parsed?.currentQuestionIndex === "number") {
        setCurrentQuestionIndex(parsed.currentQuestionIndex);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    if (!answeredCount) return;

    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ answers, currentQuestionIndex }),
        );
        setSavingDraft(true);
        setTimeout(() => setSavingDraft(false), 450);
      } catch {}
    }, AUTO_SAVE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [answers, currentQuestionIndex, answeredCount]);

  React.useEffect(() => {
    if (answeredCount < 4) {
      setPhase("idle");
      setDecision(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setPhase("reading");
      await new Promise((r) => setTimeout(r, 320));
      if (cancelled) return;

      setPhase("parsing");
      await new Promise((r) => setTimeout(r, 420));
      if (cancelled) return;

      setPhase("weighing");
      await new Promise((r) => setTimeout(r, 540));
      if (cancelled) return;

      const input = computeConstitutionalInput(answers);
      const result = evaluateConstitutionalRoute(input);
      if (cancelled) return;

      setDecision(result);
      setPhase("complete");
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [answers, answeredCount]);

  const routeInfo = getRouteFromDecision(decision);

  const derivedInput = computeConstitutionalInput(answers);
  const authorityValue = Math.round(derivedInput.authorityClarity || 0);
  const coherenceValue = Math.round(derivedInput.coherence || 0);
  const pressureValue = Math.round(derivedInput.pressure || 0);
  const frictionValue = Math.round(derivedInput.friction || 0);

  const setResonance = (value: LikertValue) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...currentAnswer,
        resonance: value,
      },
    }));
  };

  const setCertainty = (value: LikertValue) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...currentAnswer,
        certainty: value,
      },
    }));
  };

  const goNext = () => {
    if (currentQuestionIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }
    if (isComplete) setShowResults(true);
  };

  const goPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const clearAll = () => {
    const ok = window.confirm("Clear all answers and restart the constitutional intake?");
    if (!ok) return;

    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setDecision(null);
    setPhase("idle");
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  if (showResults && isComplete) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
                Constitutional verdict
              </span>
            </div>

            <h1 className="mt-6 font-serif text-4xl font-light tracking-tight text-white sm:text-5xl">
              The chamber has read your signal
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-white/52">
              This is not a personality quiz. It is a routing verdict based on
              authority, coherence, pressure, and friction.
            </p>
          </div>

          <div
            className={cn(
              "rounded-3xl border-2 p-8 text-center",
              routeInfo.tone === "emerald"
                ? "border-emerald-500/30 bg-emerald-500/10"
                : routeInfo.tone === "amber"
                  ? "border-amber-500/30 bg-amber-500/10"
                  : "border-white/10 bg-white/5",
            )}
          >
            <div className="mb-4">
              {routeInfo.tone === "emerald" ? (
                <div className="inline-flex rounded-full bg-emerald-500/20 p-3">
                  <Crown className="h-8 w-8 text-emerald-400" />
                </div>
              ) : routeInfo.tone === "amber" ? (
                <div className="inline-flex rounded-full bg-amber-500/20 p-3">
                  <Compass className="h-8 w-8 text-amber-400" />
                </div>
              ) : (
                <div className="inline-flex rounded-full bg-white/10 p-3">
                  <Target className="h-8 w-8 text-white/60" />
                </div>
              )}
            </div>

            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              {routeInfo.title}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/58">
              {routeInfo.description}
            </p>

            {decision ? (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Pill
                  className={cn(
                    decision.confidence > 0.7
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      : decision.confidence > 0.4
                        ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
                        : "border-white/20 bg-white/5 text-white/50",
                  )}
                >
                  Confidence: {Math.round(decision.confidence * 100)}%
                </Pill>

                <Pill className="border-white/20 bg-white/5 text-white/65">
                  Authority: {authorityValue}%
                </Pill>
                <Pill className="border-white/20 bg-white/5 text-white/65">
                  Coherence: {coherenceValue}%
                </Pill>
                <Pill className="border-white/20 bg-white/5 text-white/65">
                  Pressure: {pressureValue}%
                </Pill>
                <Pill className="border-white/20 bg-white/5 text-white/65">
                  Friction: {frictionValue}%
                </Pill>
              </div>
            ) : null}
          </div>

          {decision?.disqualifiersTriggered?.length ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                  Constitutional signals
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {decision.disqualifiersTriggered.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 text-sm leading-relaxed text-white/60"
                  >
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            <SignalTile title="Authority" value={`${authorityValue}%`} tone={authorityValue >= 70 ? "emerald" : authorityValue >= 45 ? "amber" : "neutral"} />
            <SignalTile title="Coherence" value={`${coherenceValue}%`} tone={coherenceValue >= 70 ? "emerald" : coherenceValue >= 45 ? "amber" : "neutral"} />
            <SignalTile title="Pressure" value={`${pressureValue}%`} tone={pressureValue >= 70 ? "amber" : "neutral"} />
            <SignalTile title="Friction" value={`${frictionValue}%`} tone={frictionValue >= 70 ? "amber" : "neutral"} />
          </div>

          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:justify-center">
            {routeInfo.href !== "#" ? (
              <Link
                href={routeInfo.href}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-sm font-medium transition",
                  routeInfo.tone === "emerald"
                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                    : routeInfo.tone === "amber"
                      ? "border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                      : "border border-white/20 bg-white/5 text-white/70 hover:bg-white/10",
                )}
              >
                {routeInfo.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}

            <button
              onClick={() => setShowResults(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-8 py-4 text-sm font-medium text-white/50 transition hover:bg-white/5"
            >
              Review answers
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={clearAll}
              className="text-xs text-white/30 transition hover:text-white/50"
            >
              Clear all answers
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
                Constitutional intake
              </span>
            </div>

            <h1 className="mt-6 font-serif text-4xl font-light tracking-tight text-white sm:text-5xl">
              A formidable first reading,
              <span className="block text-white/58">not just a questionnaire</span>
            </h1>

            <p className="mt-4 max-w-2xl text-white/52">
              This intake does not ask whether you feel vaguely stuck. It reads
              whether the situation carries authority, coherence, pressure, and
              friction serious enough to justify escalation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SignalTile title="Progress" value={`${progress}%`} tone="amber" />
            <SignalTile title="Answered" value={`${answeredCount}/${DIAGNOSTIC_QUESTIONS.length}`} tone="neutral" />
            <SignalTile title="Current Domain" value={currentQuestion.domain} tone="neutral" />
            <SignalTile
              title="Draft Status"
              value={savingDraft ? "Saving" : "Saved"}
              tone={savingDraft ? "amber" : "emerald"}
            />
          </div>

          <PhaseStatus phase={phase} />

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                Question {currentQuestionIndex + 1} of {DIAGNOSTIC_QUESTIONS.length}
              </span>

              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/40">
                {currentQuestion.domain}
              </span>
            </div>

            <p className="text-xl leading-relaxed text-white sm:text-2xl">
              {currentQuestion.text}
            </p>

            <div className="mt-8 space-y-6">
              <RatingRail
                label="How true is this?"
                value={currentAnswer.resonance}
                onChange={setResonance}
                valueLabel={RESONANCE_LABELS[currentAnswer.resonance]}
                accent="amber"
              />

              <RatingRail
                label="How certain are you?"
                value={currentAnswer.certainty}
                onChange={setCertainty}
                valueLabel={CERTAINTY_LABELS[currentAnswer.certainty]}
                accent="emerald"
              />
            </div>

            <div className="mt-8 flex justify-between gap-4">
              <button
                onClick={goPrevious}
                disabled={currentQuestionIndex === 0}
                className={cn(
                  "rounded-xl px-5 py-2.5 text-sm font-medium transition",
                  currentQuestionIndex === 0
                    ? "cursor-not-allowed text-white/20"
                    : "border border-white/10 text-white/70 hover:bg-white/5",
                )}
              >
                Previous
              </button>

              <button
                onClick={goNext}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-medium text-black transition hover:bg-amber-400"
              >
                {currentQuestionIndex === DIAGNOSTIC_QUESTIONS.length - 1
                  ? "Complete"
                  : "Next"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="space-y-6"
        >
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-amber-400/70" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                Live constitutional readout
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SignalTile title="Authority clarity" value={`${authorityValue}%`} tone={authorityValue >= 70 ? "emerald" : authorityValue >= 45 ? "amber" : "neutral"} />
              <SignalTile title="Strategic coherence" value={`${coherenceValue}%`} tone={coherenceValue >= 70 ? "emerald" : coherenceValue >= 45 ? "amber" : "neutral"} />
              <SignalTile title="Pressure load" value={`${pressureValue}%`} tone={pressureValue >= 70 ? "amber" : "neutral"} />
              <SignalTile title="Structural friction" value={`${frictionValue}%`} tone={frictionValue >= 70 ? "amber" : "neutral"} />
            </div>

            {decision ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center gap-2">
                  {decision.route === "STRATEGY" ? (
                    <Crown className="h-4 w-4 text-emerald-400" />
                  ) : decision.route === "DIAGNOSTIC" ? (
                    <Scale className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-white/45" />
                  )}

                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/42">
                    Provisional route
                  </span>
                </div>

                <div className="mt-3 text-base font-medium text-white">
                  {routeInfo.title}
                </div>
                <div className="mt-2 text-sm leading-relaxed text-white/52">
                  {routeInfo.description}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-amber-400/70" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                Routing logic
              </span>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-relaxed text-white/58">
              <div className="flex items-start gap-3">
                <Gavel className="mt-0.5 h-4 w-4 text-emerald-400/75" />
                <span>
                  <strong className="text-white/80">Strategy Room</strong> is reserved for signals that demonstrate consequence, authority, and credible escalation fitness.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Scale className="mt-0.5 h-4 w-4 text-amber-400/75" />
                <span>
                  <strong className="text-white/80">Executive Reporting</strong> is the correct middle layer when the issue is real but still needs disciplined interpretation.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Target className="mt-0.5 h-4 w-4 text-white/45" />
                <span>
                  The system does not escalate weak cases merely because the user wants importance theatre.
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-500/16 bg-amber-500/[0.04] p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-300/74">
                Institutional posture
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/56">
                This chamber is designed to feel governed, commercial, and credible.
                It should lower frivolity while increasing buyer confidence.
              </p>
            </div>
          </div>

          {isComplete ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-amber-400/70" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                  Ready for verdict
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-white/54">
                You have completed the intake. Reveal the constitutional verdict
                and let the system route you properly.
              </p>

              <button
                onClick={() => setShowResults(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-medium text-black transition hover:bg-amber-400"
              >
                Reveal verdict
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </motion.aside>
      </div>
    </div>
  );
}
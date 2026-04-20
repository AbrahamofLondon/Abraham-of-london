"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Crown,
  Eye,
  FileText,
  LayoutGrid,
  LineChart,
  Loader2,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import {
  DEFAULT_DIAGNOSTIC_QUESTIONS,
  type DiagnosticAnswers,
  type DiagnosticAnswerValue,
  type LikertValue,
} from "@/lib/constitution/constitutional-diagnostic-derivation";
import {
  writeConstitutionalHandoff,
  clearAllConstitutionalHandoffs,
} from "@/lib/diagnostics/constitutional-handoff";
import type { ConstitutionalBridgeBundle } from "@/lib/diagnostics/constitutional-bridge";

type ApiSuccess = {
  ok: true;
  reportId: string;
  bundle: {
    report: {
      authorityScore: number;
      coherenceScore: number;
      pressureScore: number;
      frictionScore: number;
      trustScore: number;
      seriousnessScore: number;
      governanceDiscipline: number;
      interventionReadiness: number;
      narrativeCoherence: number;
      failureModeCount: number;
      failureModeSeverity: number;
      authorityType: string;
      posture: string;
      readinessTier: string;
      mandateFit: boolean;
      summary: string;
      keyFindings: string[];
      answeredCount: number;
      totalQuestions: number;
      completionPercent: number;
    };
    decision: {
      route: "REJECT" | "DIAGNOSTIC" | "STRATEGY";
      confidence: number;
      disqualifiersTriggered: string[];
      recommendedInterventions: string[];
      rationale: string[];
      escalationAllowed: boolean;
    };
    routeSummary: {
      route: string;
      title: string;
      description: string;
      href: string;
      cta: string;
      tone: "neutral" | "amber" | "emerald";
    };
  };
  bridge: ConstitutionalBridgeBundle;
};

type ApiFailure = {
  ok: false;
  error: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";
type EvaluationPhase = "idle" | "reading" | "parsing" | "weighing" | "complete";

const STORAGE_KEY = "aol-constitutional-diagnostic-v3";
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

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toLikert(value: number): LikertValue {
  return clamp(Math.round(value), 0, 10) as LikertValue;
}

function makeDefaultAnswer(): DiagnosticAnswerValue {
  return {
    resonance: 5,
    certainty: 5,
  };
}

function getPhaseLabel(phase: EvaluationPhase) {
  switch (phase) {
    case "reading":
      return "Reading structural pattern";
    case "parsing":
      return "Parsing constitutional signal";
    case "weighing":
      return "Deriving report and route";
    case "complete":
      return "Assessment complete";
    default:
      return "Awaiting sufficient signal";
  }
}

function toneClass(tone: "neutral" | "amber" | "emerald") {
  if (tone === "emerald") {
    return "border-emerald-500/30 bg-emerald-500/10";
  }
  if (tone === "amber") {
    return "border-amber-500/30 bg-amber-500/10";
  }
  return "border-white/10 bg-white/5";
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
    <div className={cn("rounded-2xl border p-4", toneClass(tone))}>
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
          "h-11 w-full cursor-pointer appearance-none rounded-full bg-white/10",
          accent === "amber" ? "accent-amber-500" : "accent-emerald-400",
        )}
      />
    </div>
  );
}

export default function ConstitutionalDiagnostic() {
  const [answers, setAnswers] = React.useState<DiagnosticAnswers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [phase, setPhase] = React.useState<EvaluationPhase>("idle");
  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [reportData, setReportData] = React.useState<ApiSuccess | null>(null);
  const [showResults, setShowResults] = React.useState(false);

  const questions = DEFAULT_DIAGNOSTIC_QUESTIONS;
  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === questions.length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  const currentQuestion = questions[currentQuestionIndex]!;
  const currentAnswer = answers[currentQuestion.id] ?? makeDefaultAnswer();

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        answers?: DiagnosticAnswers;
        currentQuestionIndex?: number;
      };

      if (parsed.answers) setAnswers(parsed.answers);
      if (typeof parsed.currentQuestionIndex === "number") {
        setCurrentQuestionIndex(parsed.currentQuestionIndex);
      }
    } catch {
      // ignore malformed draft
    }
  }, []);

  React.useEffect(() => {
    if (!answeredCount) return;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            answers,
            currentQuestionIndex,
          }),
        );
        setSavingDraft(true);
        window.setTimeout(() => setSavingDraft(false), 450);
      } catch {
        // ignore storage failures
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [answers, currentQuestionIndex, answeredCount]);

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
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    if (isComplete) {
      void submitAssessment();
    }
  };

  const goPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const clearAll = () => {
    const ok = window.confirm("Clear all answers and restart the constitutional intake?");
    if (!ok) return;

    window.localStorage.removeItem(STORAGE_KEY);
    clearAllConstitutionalHandoffs();
    setAnswers({});
    setCurrentQuestionIndex(0);
    setSavingDraft(false);
    setPhase("idle");
    setSubmitState("idle");
    setErrorMessage("");
    setReportData(null);
    setShowResults(false);
  };

  async function submitAssessment() {
    if (!isComplete) return;

    setSubmitState("submitting");
    setErrorMessage("");
    setPhase("reading");

    try {
      await new Promise((r) => setTimeout(r, 180));
      setPhase("parsing");
      await new Promise((r) => setTimeout(r, 240));
      setPhase("weighing");

      const res = await fetch("/api/diagnostics/constitutional-intake/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "constitutional_diagnostic_public",
          answers,
        }),
      });

      const json = (await res.json()) as ApiSuccess | ApiFailure;

      if (!res.ok || !json.ok) {
        throw new Error(json.ok ? "Assessment failed." : json.error);
      }

      writeConstitutionalHandoff("team-assessment", {
        source: "constitutional-intake",
        reportId: json.reportId,
        createdAt: new Date().toISOString(),
        bridge: json.bridge,
      });

      writeConstitutionalHandoff("executive-reporting", {
        source: "constitutional-intake",
        reportId: json.reportId,
        createdAt: new Date().toISOString(),
        bridge: json.bridge,
      });

      writeConstitutionalHandoff("strategy-room", {
        source: "constitutional-intake",
        reportId: json.reportId,
        createdAt: new Date().toISOString(),
        bridge: json.bridge,
      });

      setReportData(json);
      setSubmitState("success");
      setPhase("complete");
      setShowResults(true);

      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    } catch (error) {
      setSubmitState("error");
      setPhase("idle");
      setErrorMessage(
        error instanceof Error ? error.message : "Assessment failed.",
      );
    }
  }

  const report = reportData?.bundle.report ?? null;
  const decision = reportData?.bundle.decision ?? null;
  const routeSummary = reportData?.bundle.routeSummary ?? null;
  const bridge = reportData?.bridge ?? null;

  if (showResults && report && decision && routeSummary && bridge) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
                Constitutional report generated
              </span>
            </div>

            <h1 className="mt-6 font-serif text-4xl font-light tracking-tight text-white sm:text-5xl">
              The first reading is now real
            </h1>

            <p className="mx-auto mt-4 max-w-3xl text-white/52">
              Not a vague vibe check. A persisted constitutional micro-report with
              route, posture, readiness, findings, risks, and inherited downstream signal.
            </p>
          </div>

          <div className={cn("rounded-3xl border-2 p-8", toneClass(routeSummary.tone))}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                  {routeSummary.title}
                </h2>
                <p className="mt-3 text-white/68">{routeSummary.description}</p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">
                    Confidence {Math.round(decision.confidence * 100)}%
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">
                    Posture {report.posture}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">
                    Readiness {report.readinessTier}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">
                    Authority {report.authorityType}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  href={routeSummary.href}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition",
                    routeSummary.tone === "emerald"
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : routeSummary.tone === "amber"
                        ? "border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                        : "border border-white/20 bg-white/5 text-white/70 hover:bg-white/10",
                  )}
                >
                  {routeSummary.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <SignalTile title="Authority" value={`${report.authorityScore}%`} tone={report.authorityScore >= 70 ? "emerald" : report.authorityScore >= 45 ? "amber" : "neutral"} />
            <SignalTile title="Coherence" value={`${report.coherenceScore}%`} tone={report.coherenceScore >= 70 ? "emerald" : report.coherenceScore >= 45 ? "amber" : "neutral"} />
            <SignalTile title="Pressure" value={`${report.pressureScore}%`} tone={report.pressureScore >= 70 ? "amber" : "neutral"} />
            <SignalTile title="Friction" value={`${report.frictionScore}%`} tone={report.frictionScore >= 70 ? "amber" : "neutral"} />
            <SignalTile title="Trust" value={`${report.trustScore}%`} tone={report.trustScore >= 70 ? "emerald" : report.trustScore >= 45 ? "amber" : "neutral"} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-400/70" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                  Executive reading
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-white/72">
                {report.summary}
              </p>

              <div className="mt-5 space-y-3">
                {report.keyFindings.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-7 text-white/68">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {decision.recommendedInterventions.length > 0 ? (
                <div className="mt-6">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
                    Priority interventions
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {decision.recommendedInterventions.slice(0, 5).map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-white/62"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-amber-400/70" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                  Inherited next-stage signal
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-300" />
                    <div className="text-sm font-medium text-white">Team Assessment</div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    {bridge.teamAssessment.hypotheses[0] || "Inherited hypotheses ready."}
                  </p>
                  <Link
                    href="/diagnostics"
                    className="mt-3 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-amber-300"
                  >
                    Continue into team layer
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-300" />
                    <div className="text-sm font-medium text-white">Executive Reporting</div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    {bridge.executiveReporting.headline}
                  </p>
                  <Link
                    href="/diagnostics/executive-reporting"
                    className="mt-3 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-amber-300"
                  >
                    Continue into executive reporting
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-300" />
                    <div className="text-sm font-medium text-white">Strategy Room</div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    {bridge.strategyRoom.mandateDraft}
                  </p>
                  <Link
                    href="/strategy-room"
                    className="mt-3 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-amber-300"
                  >
                    Continue into strategy room
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {decision.disqualifiersTriggered.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                  Constitutional disqualifiers
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {decision.disqualifiersTriggered.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm leading-relaxed text-white/60">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => setShowResults(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-8 py-4 text-sm font-medium text-white/50 transition hover:bg-white/5"
            >
              Review answers
            </button>

            <button
              onClick={clearAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-8 py-4 text-sm font-medium text-white/50 transition hover:bg-white/5"
            >
              Start fresh
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
                Constitutional intake
              </span>
            </div>

            <h1 className="mt-6 font-serif text-4xl font-light tracking-tight text-white sm:text-5xl">
              A serious first reading,
              <span className="block text-white/58">not a decorative questionnaire</span>
            </h1>

            <p className="mt-4 max-w-2xl text-white/52">
              This gate produces a real micro-report: posture, readiness, authority,
              friction, risks, interventions, route, and inherited signal for the next layers.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SignalTile title="Progress" value={`${progress}%`} tone="amber" />
            <SignalTile title="Answered" value={`${answeredCount}/${questions.length}`} />
            <SignalTile title="Current Domain" value={currentQuestion.domain} />
            <SignalTile title="Draft Status" value={savingDraft ? "Saving" : "Saved"} tone={savingDraft ? "amber" : "emerald"} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {submitState === "submitting" ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              ) : phase === "complete" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Eye className="h-4 w-4 text-white/35" />
              )}

              <span className="text-xs font-mono uppercase tracking-[0.16em] text-white/42">
                {getPhaseLabel(phase)}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                Question {currentQuestionIndex + 1} of {questions.length}
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
                valueLabel={RESONANCE_LABELS[currentAnswer.resonance] ?? ""}
                accent="amber"
              />

              <RatingRail
                label="How certain are you?"
                value={currentAnswer.certainty}
                onChange={setCertainty}
                valueLabel={CERTAINTY_LABELS[currentAnswer.certainty] ?? ""}
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
                disabled={submitState === "submitting"}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-medium text-black transition hover:bg-amber-400 disabled:opacity-60"
              >
                {currentQuestionIndex === questions.length - 1
                  ? submitState === "submitting"
                    ? "Generating report..."
                    : "Generate report"
                  : "Next"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {submitState === "error" && errorMessage ? (
              <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
                {errorMessage}
              </div>
            ) : null}
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
                What this gate now delivers
              </span>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-relaxed text-white/62">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                <span>A persisted constitutional micro-report, not just local theatre.</span>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-amber-300" />
                <span>An executive reading with findings, route, posture, readiness, and interventions.</span>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-amber-300" />
                <span>Inherited team-level prompts and hypotheses for downstream assessment.</span>
              </div>
              <div className="flex items-start gap-3">
                <Crown className="mt-0.5 h-4 w-4 text-amber-300" />
                <span>A strategy-room handoff draft if escalation becomes justified.</span>
              </div>
            </div>
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
                <Crown className="mt-0.5 h-4 w-4 text-emerald-400/75" />
                <span>
                  <strong className="text-white/80">Strategy Room</strong> is for signals with clear authority, meaningful consequence, and sufficient readiness.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Scale className="mt-0.5 h-4 w-4 text-amber-400/75" />
                <span>
                  <strong className="text-white/80">Executive Reporting</strong> is the right middle layer when the issue is real but still needs disciplined interpretation.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 text-white/45" />
                <span>
                  The system does not escalate weak cases merely because the user wants dramatic importance.
                </span>
              </div>
            </div>
          </div>

          {isComplete ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-amber-400/70" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                  Ready to generate
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-white/54">
                The intake is complete. Generate the constitutional report and carry the inherited signal into the next layers.
              </p>

              <button
                onClick={() => void submitAssessment()}
                disabled={submitState === "submitting"}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-medium text-black transition hover:bg-amber-400 disabled:opacity-60"
              >
                {submitState === "submitting" ? "Generating..." : "Generate report"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="rounded-3xl border border-amber-500/16 bg-amber-500/[0.04] p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-300/74">
              Product posture
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/56">
              This gate is now a real microcosm of the wider estate: interrogation, diagnosis, routing, recommendations, and downstream inheritance.
            </p>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

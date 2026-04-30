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
} from "@/lib/diagnostics/constitutional-diagnostic-derivation";
import {
  writeConstitutionalHandoff,
  clearAllConstitutionalHandoffs,
} from "@/lib/diagnostics/constitutional-handoff";
import type { ConstitutionalBridgeBundle } from "@/lib/diagnostics/constitutional-bridge";
import DecisionChallengeCard from "@/components/diagnostics/DecisionChallengeCard";
import ResultEmailCapture from "@/components/diagnostics/ResultEmailCapture";
import {
  clearVersionedAssessmentState,
  loadVersionedAssessmentState,
  saveVersionedAssessmentState,
} from "@/lib/client/assessment-state";
import { detectDualAxisIntegrityChallenge } from "@/lib/client/assessment-integrity";
import type { ChallengeResult } from "@/lib/server/decision/challenge-engine.server";

type ApiSuccess = {
  ok: true;
  reportId: string;
  stateToken: string;
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
type DraftSnapshot = {
  answers: DiagnosticAnswers;
  currentQuestionIndex: number;
  startedAt: string;
};

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
const STORAGE_KEY = "aol-constitutional-diagnostic-state";
const STORAGE_VERSION = "2026-04-standardized";
const LOADING_LINES = [
  "Evaluating structural alignment…",
  "Mapping contradictions…",
  "Projecting consequences…",
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
      return "Parsing constitutional reading";
    case "weighing":
      return "Deriving report and route";
    case "complete":
      return "Assessment complete";
    default:
      return "Awaiting sufficient detail";
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

function StatusTile({
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
  const [phase, setPhase] = React.useState<EvaluationPhase>("idle");
  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [reportData, setReportData] = React.useState<ApiSuccess | null>(null);
  const [showResults, setShowResults] = React.useState(false);
  const [challenge, setChallenge] = React.useState<ChallengeResult | null>(null);
  const [showResume, setShowResume] = React.useState(false);
  const [draftSnapshot, setDraftSnapshot] = React.useState<DraftSnapshot | null>(null);
  const [loadingLineIndex, setLoadingLineIndex] = React.useState(0);
  const startedAtRef = React.useRef<string>(new Date().toISOString());
  const questionStartedAtRef = React.useRef<number>(Date.now());
  const timingRef = React.useRef<Record<string, number>>({});

  const questions = DEFAULT_DIAGNOSTIC_QUESTIONS;
  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === questions.length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  const currentQuestion = questions[currentQuestionIndex]!;
  const currentAnswer = answers[currentQuestion.id] ?? makeDefaultAnswer();

  React.useEffect(() => {
    const stored = loadVersionedAssessmentState<DraftSnapshot>(
      STORAGE_KEY,
      STORAGE_VERSION,
    );
    if (!stored || Object.keys(stored.answers ?? {}).length === 0) return;
    setDraftSnapshot(stored);
    setShowResume(true);
  }, []);

  React.useEffect(() => {
    if (showResults) {
      clearVersionedAssessmentState(STORAGE_KEY);
      return;
    }

    if (Object.keys(answers).length === 0) return;

    const timer = window.setTimeout(() => {
      saveVersionedAssessmentState(STORAGE_KEY, STORAGE_VERSION, {
        answers,
        currentQuestionIndex,
        startedAt: startedAtRef.current,
        timestamp: new Date().toISOString(),
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [answers, currentQuestionIndex, showResults]);

  React.useEffect(() => {
    if (submitState !== "submitting") return;
    const timer = window.setInterval(() => {
      setLoadingLineIndex((prev) => (prev + 1) % LOADING_LINES.length);
    }, 1100);
    return () => window.clearInterval(timer);
  }, [submitState]);

  React.useEffect(() => {
    questionStartedAtRef.current = Date.now();
  }, [currentQuestionIndex]);

  const captureQuestionTiming = () => {
    const elapsed = Date.now() - questionStartedAtRef.current;
    timingRef.current[currentQuestion.id] =
      (timingRef.current[currentQuestion.id] ?? 0) + elapsed;
    questionStartedAtRef.current = Date.now();
  };

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
    captureQuestionTiming();
    setChallenge(null);

    if (currentQuestionIndex < questions.length - 1) {
      const nextAnswers = {
        ...answers,
        [currentQuestion.id]: currentAnswer,
      };
      const localChallenge = detectDualAxisIntegrityChallenge({
        answers: nextAnswers,
        minimumAnswers: 5,
        startedAt: Date.parse(startedAtRef.current),
        submittedAt: Date.now(),
      });

      if (localChallenge) {
        setChallenge(localChallenge);
        return;
      }

      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    if (isComplete) {
      void submitAssessment();
    }
  };

  const goPrevious = () => {
    if (currentQuestionIndex > 0) {
      captureQuestionTiming();
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const clearAll = () => {
    const ok = window.confirm("Clear all answers and restart the constitutional intake?");
    if (!ok) return;

    clearAllConstitutionalHandoffs();
    clearVersionedAssessmentState(STORAGE_KEY);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setPhase("idle");
    setSubmitState("idle");
    setErrorMessage("");
    setReportData(null);
    setShowResults(false);
    startedAtRef.current = new Date().toISOString();
    questionStartedAtRef.current = Date.now();
    timingRef.current = {};
  };

  const resumeDraft = () => {
    if (!draftSnapshot) return;
    setAnswers(draftSnapshot.answers);
    setCurrentQuestionIndex(draftSnapshot.currentQuestionIndex);
    startedAtRef.current = draftSnapshot.startedAt;
    setShowResume(false);
  };

  const discardDraft = () => {
    clearVersionedAssessmentState(STORAGE_KEY);
    setDraftSnapshot(null);
    setShowResume(false);
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
          telemetry: {
            startedAt: startedAtRef.current,
            submittedAt: new Date().toISOString(),
            questionTimingsMs: timingRef.current,
          },
        }),
      });

      const json = (await res.json()) as ApiSuccess | ApiFailure;

      if (!res.ok || !json.ok) {
        throw new Error(json.ok ? "Assessment failed." : json.error);
      }

      writeConstitutionalHandoff("team-assessment", {
        token: json.stateToken,
      });

      writeConstitutionalHandoff("executive-reporting", {
        token: json.stateToken,
      });

      writeConstitutionalHandoff("strategy-room", {
        token: json.stateToken,
      });

      setReportData(json);
      setSubmitState("success");
      setPhase("complete");
      setShowResults(true);
      clearVersionedAssessmentState(STORAGE_KEY);

      timingRef.current = {};
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
  const contradictionInputs = questions
    .map((question) => ({
      question,
      answer: answers[question.id],
    }))
    .filter(
      (entry): entry is { question: (typeof questions)[number]; answer: DiagnosticAnswerValue } =>
        Boolean(entry.answer),
    )
    .filter(
      ({ answer }) => Math.abs(answer.resonance - answer.certainty) >= 4 || answer.certainty <= 3,
    )
    .slice(0, 5);

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
              state, posture, readiness, findings, risks, and inherited downstream context.
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

            <div className="mt-6">
              <ResultEmailCapture
                source="constitutional_diagnostic"
                resultRef={reportData!.reportId}
              />
            </div>

            <p className="mt-6 text-sm leading-7 text-white/40" style={{ fontStyle: "italic" }}>
              This pattern is commonly seen before structural correction. This reading can be tracked over time. Re-evaluate in 14 days to see whether the pattern improves or repeats.
            </p>
          </div>

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

          <details className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <summary className="cursor-pointer text-sm font-medium text-white">Advanced reading</summary>
            <div className="mt-5 grid gap-4 md:grid-cols-5">
              <StatusTile title="State" value={routeSummary.route} tone={routeSummary.tone} />
              <StatusTile title="Posture" value={report.posture} tone={routeSummary.tone} />
              <StatusTile title="Readiness" value={report.readinessTier} tone={routeSummary.tone} />
              <StatusTile title="Authority" value={report.authorityType} tone={routeSummary.tone} />
              <StatusTile title="Escalation" value={decision.escalationAllowed ? "Available" : "Contained"} tone={decision.escalationAllowed ? "amber" : "neutral"} />
            </div>
          </details>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-amber-400/70" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                  Inherited next-stage context
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

          <details className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <summary className="cursor-pointer text-sm font-medium text-white">
              How this was determined
            </summary>
            <div className="mt-5 grid gap-5 text-sm leading-7 text-white/70">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                  You indicated
                </div>
                <ul className="mt-3 grid gap-2">
                  {questions.slice(0, 5).map((question) => {
                    const answer = answers[question.id];
                    if (!answer) return null;
                    return (
                      <li key={question.id}>
                        {question.text} → resonance {answer.resonance}/10, certainty {answer.certainty}/10
                      </li>
                    );
                  })}
                </ul>
              </div>

              {contradictionInputs.length > 0 ? (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                    Contradiction mapping
                  </div>
                  <ul className="mt-3 grid gap-2">
                    {contradictionInputs.map(({ question, answer }) => (
                      <li key={question.id}>
                        {question.text} → tension between resonance {answer.resonance}/10 and certainty {answer.certainty}/10
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Pattern trigger explanation
                </div>
                <p className="mt-3">
                  This combination produces {routeSummary.title.toLowerCase()} because the authority,
                  coherence, friction, and pressure scores resolved into a {report.posture.toLowerCase()} posture with{" "}
                  {report.readinessTier.toLowerCase().replaceAll("_", " ")} readiness.
                </p>
              </div>
            </div>
          </details>

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
              risks, interventions, state, and inherited context for the next layers.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatusTile title="Progress" value={`${progress}%`} tone="amber" />
            <StatusTile title="Answered" value={`${answeredCount}/${questions.length}`} />
            <StatusTile title="Current Domain" value={currentQuestion.domain} />
            <StatusTile title="State" value="Ephemeral" tone="emerald" />
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

          {showResume ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300/80">
                Resume your assessment?
              </div>
              <p className="mt-2 text-sm leading-6 text-white/60">
                A saved constitutional reading is available on this device.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resumeDraft}
                  className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60"
                >
                  Start fresh
                </button>
              </div>
            </div>
          ) : null}

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

            {challenge ? (
              <div className="mt-6">
                <DecisionChallengeCard
                  challenge={challenge}
                  onRevise={() => setChallenge(null)}
                  onAccept={() => {
                    setChallenge(null);
                    if (currentQuestionIndex < questions.length - 1) {
                      setCurrentQuestionIndex((prev) => prev + 1);
                    } else if (isComplete) {
                      void submitAssessment();
                    }
                  }}
                />
              </div>
            ) : null}

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
                  <strong className="text-white/80">Strategy Room</strong> is for cases with clear authority, meaningful consequence, and sufficient readiness.
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
                The intake is complete. Generate the constitutional report and carry the inherited context into the next layers.
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

      {submitState === "submitting" ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-[#0e0e10] p-8 text-white shadow-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#c9a96e]">Resolution</div>
            <p className="mt-4 font-serif text-3xl leading-tight">
              {LOADING_LINES[loadingLineIndex]}
            </p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#c9a96e]" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

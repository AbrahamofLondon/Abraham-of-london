"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
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
  Building2,
  TimerReset,
  Activity,
} from "lucide-react";

import {
  evaluateConstitutionalRoute,
  type ConstitutionalDecision,
  type AuthorityType,
  type OrgPosture,
  type ReadinessTier,
} from "@/lib/constitution/rules";

type LikertValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type AnswerValue = {
  resonance: LikertValue;
  certainty: LikertValue;
};

type EvaluationPhase = "idle" | "reading" | "parsing" | "weighing" | "complete";

type DiagnosticQuestion = {
  id: string;
  text: string;
  domain:
    | "coherence"
    | "authority"
    | "environment"
    | "execution"
    | "trust"
    | "friction"
    | "stakes"
    | "pattern"
    | "pressure";
  reverse?: boolean;
};

type MicroReport = {
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
  authorityType: AuthorityType;
  posture: OrgPosture;
  readinessTier: ReadinessTier;
  mandateFit: boolean;
  summary: string;
  keyFindings: string[];
};

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

const DIAGNOSTIC_QUESTIONS: readonly DiagnosticQuestion[] = [
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
    reverse: true,
  },
  {
    id: "q4",
    text: "There is a pattern of strategic drift — direction stated but not executed with discipline.",
    domain: "execution",
    reverse: true,
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
    reverse: true,
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
    reverse: true,
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
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function toLikert(value: number): LikertValue {
  return clamp(Math.round(value), 0, 10) as LikertValue;
}

function average(values: number[], fallback = 5) {
  if (!values.length) return fallback;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function percentFromLikert(value: number): number {
  return clamp(Math.round(value * 10), 0, 100);
}

function certaintyWeight(certainty: LikertValue): number {
  return clamp(0.45 + certainty / 18, 0.45, 1);
}

function scoreQuestion(question: DiagnosticQuestion, answer: AnswerValue): number {
  const base = question.reverse ? 10 - answer.resonance : answer.resonance;
  return base * certaintyWeight(answer.certainty);
}

function getDomainScores(answers: Record<string, AnswerValue>) {
  const result: Record<string, number[]> = {};

  for (const question of DIAGNOSTIC_QUESTIONS) {
    const answer = answers[question.id];
    if (!answer) continue;
    const scored = scoreQuestion(question, answer);
    if (!result[question.domain]) result[question.domain] = [];
    result[question.domain].push(scored);
  }

  return result;
}

function classifyAuthorityType(authorityScore: number): AuthorityType {
  if (authorityScore >= 70) return "DIRECT";
  if (authorityScore >= 45) return "PROXY";
  return "UNCLEAR";
}

function classifyPosture(input: {
  coherenceScore: number;
  frictionScore: number;
  trustScore: number;
  governanceDiscipline: number;
}): OrgPosture {
  const disorderSignals = [
    input.coherenceScore < 35,
    input.frictionScore >= 70,
    input.trustScore < 35,
    input.governanceDiscipline < 35,
  ].filter(Boolean).length;

  if (disorderSignals >= 3) return "DISORDERED";
  if (input.coherenceScore < 45 || input.frictionScore >= 60) return "MISALIGNED";
  if (input.coherenceScore < 65 || input.governanceDiscipline < 60) return "DRIFTING";
  return "ORDERED";
}

function classifyReadinessTier(input: {
  authorityScore: number;
  coherenceScore: number;
  trustScore: number;
  interventionReadiness: number;
  governanceDiscipline: number;
}): ReadinessTier {
  const composite = average([
    input.authorityScore / 10,
    input.coherenceScore / 10,
    input.trustScore / 10,
    input.interventionReadiness / 10,
    input.governanceDiscipline / 10,
  ]);

  const pct = percentFromLikert(composite);

  if (pct < 35) return "FRAGILE";
  if (pct < 50) return "EMERGING";
  if (pct < 68) return "STABILIZING";
  if (pct < 85) return "EXECUTION_READY";
  return "SOVEREIGN";
}

function buildMicroReport(
  answers: Record<string, AnswerValue>,
): MicroReport {
  const byDomain = getDomainScores(answers);

  const authorityScore = percentFromLikert(average(byDomain.authority || []));
  const coherenceScore = percentFromLikert(average(byDomain.coherence || []));
  const trustScore = percentFromLikert(average(byDomain.trust || []));
  const pressureScore = percentFromLikert(
    average([
      ...(byDomain.pressure || []),
      ...(byDomain.stakes || []),
      ...(byDomain.environment || []),
    ]),
  );
  const frictionScore = percentFromLikert(
    average([
      ...(byDomain.friction || []),
      ...(byDomain.execution || []),
      ...(byDomain.pattern || []),
    ]),
  );

  const seriousnessScore = clamp(
    Math.round(average([pressureScore, frictionScore, authorityScore]) * 0.9),
    0,
    100,
  );

  const governanceDiscipline = clamp(
    Math.round(average([coherenceScore, trustScore, authorityScore])),
    0,
    100,
  );

  const narrativeCoherence = clamp(
    Math.round(average([coherenceScore, trustScore, authorityScore])),
    0,
    100,
  );

  const interventionReadiness = clamp(
    Math.round(average([authorityScore, coherenceScore, trustScore, 100 - frictionScore])),
    0,
    100,
  );

  let failureModeCount = 0;
  if (coherenceScore < 50) failureModeCount += 1;
  if (authorityScore < 50) failureModeCount += 1;
  if (trustScore < 50) failureModeCount += 1;
  if (frictionScore >= 60) failureModeCount += 1;
  if (pressureScore >= 70) failureModeCount += 1;

  const failureModeSeverity = clamp(
    Math.round(
      average([
        (100 - coherenceScore) / 10,
        (100 - authorityScore) / 10,
        frictionScore / 10,
        pressureScore / 12,
      ]),
    ),
    0,
    10,
  );

  const authorityType = classifyAuthorityType(authorityScore);
  const posture = classifyPosture({
    coherenceScore,
    frictionScore,
    trustScore,
    governanceDiscipline,
  });

  const readinessTier = classifyReadinessTier({
    authorityScore,
    coherenceScore,
    trustScore,
    interventionReadiness,
    governanceDiscipline,
  });

  const mandateFit = seriousnessScore >= 30;

  const findings: string[] = [];

  if (authorityScore < 45) findings.push("Authority is weak or insufficiently explicit.");
  else if (authorityScore < 70) findings.push("Authority exists, but escalation boundaries are still imperfect.");
  else findings.push("Authority appears sufficiently explicit for serious intervention.");

  if (coherenceScore < 45) findings.push("Strategic coherence is materially compromised.");
  else if (coherenceScore < 70) findings.push("Coherence exists, but execution and direction are not fully locked.");
  else findings.push("Strategic coherence is comparatively strong.");

  if (frictionScore >= 70) findings.push("Structural friction is high and likely compounding execution drag.");
  else if (frictionScore >= 50) findings.push("Friction is present and meaningful.");
  else findings.push("Friction is present but currently governable.");

  if (pressureScore >= 70) findings.push("The situation carries material consequence and external pressure.");
  else if (pressureScore >= 50) findings.push("Pressure is real, but not yet fully acute.");
  else findings.push("Pressure exists, but the signal is not yet severe.");

  const summary =
    posture === "DISORDERED"
      ? "The system reads this as a disorder-risk case: structure is compromised, readiness is weak, and escalation must be governed carefully."
      : posture === "MISALIGNED"
        ? "The system reads this as a misalignment case: the signal is real, but coherence, authority, or execution order remain materially imperfect."
        : posture === "DRIFTING"
          ? "The system reads this as a drift case: the problem is meaningful, but foundational correction is still more urgent than full escalation."
          : "The system reads this as relatively ordered: the issue may justify sharper escalation if consequence and authority remain strong.";

  return {
    authorityScore,
    coherenceScore,
    pressureScore,
    frictionScore,
    trustScore,
    seriousnessScore,
    governanceDiscipline,
    interventionReadiness,
    narrativeCoherence,
    failureModeCount,
    failureModeSeverity,
    authorityType,
    posture,
    readinessTier,
    mandateFit,
    summary,
    keyFindings: findings,
  };
}

function computeConstitutionalInput(report: MicroReport) {
  return {
    clarityScore: report.coherenceScore,
    authorityType: report.authorityType,
    readinessTier: report.readinessTier,
    posture: report.posture,
    failureModeCount: report.failureModeCount,
    failureModeSeverity: report.failureModeSeverity,
    narrativeCoherence: report.narrativeCoherence,
    interventionReadiness: report.interventionReadiness,
    seriousnessScore: report.seriousnessScore,
    governanceDiscipline: report.governanceDiscipline,
    trustCondition: report.trustScore,
    mandateFit: report.mandateFit,
    operatorOverrideRequested: false,
    operatorKey: "constitutional_diagnostic_public",
  };
}

function getRouteFromDecision(
  decision: ConstitutionalDecision | null,
  report: MicroReport | null,
) {
  if (!decision || !report) {
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
        title: "Strategy Room — escalation justified",
        description:
          "This signal shows sufficient authority, consequence, and readiness to justify private strategic escalation.",
        href: "/consulting/strategy-room",
        cta: "Enter Strategy Room",
        tone: "emerald" as const,
      };

    case "DIAGNOSTIC":
      return {
        route: "EXECUTIVE_REPORTING" as const,
        title: "Executive Reporting — the right next layer",
        description:
          "The signal is real, but disciplined interpretation should come before premium intervention. This is exactly where Executive Reporting earns its keep.",
        href: "/diagnostics/executive-reporting",
        cta: "Review Executive Reporting",
        tone: "amber" as const,
      };

    case "REJECT":
    default:
      return {
        route: "DIAGNOSTIC" as const,
        title: "Foundational diagnosis required",
        description:
          "The current signal is not yet strong enough for escalation. The right move is clearer diagnostic work, not importance theatre.",
        href: "/diagnostics",
        cta: "Open diagnostics",
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
          ? "Parsing authority, coherence, and strain"
          : phase === "weighing"
            ? "Weighing constitutional thresholds"
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
  const [report, setReport] = React.useState<MicroReport | null>(null);
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
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.answers && typeof parsed.answers === "object") {
        setAnswers(parsed.answers);
      }
      if (typeof parsed?.currentQuestionIndex === "number") {
        setCurrentQuestionIndex(
          clamp(parsed.currentQuestionIndex, 0, DIAGNOSTIC_QUESTIONS.length - 1),
        );
      }
    } catch {
      // ignore bad local state
    }
  }, []);

  React.useEffect(() => {
    if (!answeredCount) return;

    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ answers, currentQuestionIndex }),
        );
        setSavingDraft(true);
        window.setTimeout(() => setSavingDraft(false), 450);
      } catch {
        // ignore local save errors
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [answers, currentQuestionIndex, answeredCount]);

  React.useEffect(() => {
    if (answeredCount < 4) {
      setPhase("idle");
      setDecision(null);
      setReport(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setPhase("reading");
      await new Promise((r) => setTimeout(r, 260));
      if (cancelled) return;

      setPhase("parsing");
      await new Promise((r) => setTimeout(r, 360));
      if (cancelled) return;

      setPhase("weighing");
      await new Promise((r) => setTimeout(r, 460));
      if (cancelled) return;

      const nextReport = buildMicroReport(answers);
      const input = computeConstitutionalInput(nextReport);
      const nextDecision = evaluateConstitutionalRoute(input);

      if (cancelled) return;

      setReport(nextReport);
      setDecision(nextDecision);
      setPhase("complete");
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [answers, answeredCount]);

  const routeInfo = getRouteFromDecision(decision, report);

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

    window.localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setDecision(null);
    setReport(null);
    setPhase("idle");
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  if (showResults && isComplete && report && decision) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
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

            <p className="mx-auto mt-4 max-w-3xl text-white/52">
              This is a governed micro-assessment: a real first reading of authority,
              coherence, strain, readiness, and escalation fitness.
            </p>
          </div>

          <div
            className={cn(
              "rounded-3xl border-2 p-8",
              routeInfo.tone === "emerald"
                ? "border-emerald-500/30 bg-emerald-500/10"
                : routeInfo.tone === "amber"
                  ? "border-amber-500/30 bg-amber-500/10"
                  : "border-white/10 bg-white/5",
            )}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                  {routeInfo.title}
                </h2>
                <p className="mt-3 text-white/62">{routeInfo.description}</p>
                <p className="mt-5 text-sm leading-7 text-white/70">{report.summary}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Pill className="border-white/20 bg-white/5 text-white/70">
                    Posture: {report.posture}
                  </Pill>
                  <Pill className="border-white/20 bg-white/5 text-white/70">
                    Readiness: {report.readinessTier}
                  </Pill>
                  <Pill className="border-white/20 bg-white/5 text-white/70">
                    Authority: {report.authorityType}
                  </Pill>
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
                </div>
              </div>

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
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <SignalTile
              title="Authority"
              value={`${report.authorityScore}%`}
              tone={report.authorityScore >= 70 ? "emerald" : report.authorityScore >= 45 ? "amber" : "neutral"}
            />
            <SignalTile
              title="Coherence"
              value={`${report.coherenceScore}%`}
              tone={report.coherenceScore >= 70 ? "emerald" : report.coherenceScore >= 45 ? "amber" : "neutral"}
            />
            <SignalTile
              title="Pressure"
              value={`${report.pressureScore}%`}
              tone={report.pressureScore >= 70 ? "amber" : "neutral"}
            />
            <SignalTile
              title="Friction"
              value={`${report.frictionScore}%`}
              tone={report.frictionScore >= 70 ? "amber" : report.frictionScore >= 50 ? "amber" : "neutral"}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-400/80" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/42">
                  Micro-report
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {report.keyFindings.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-7 text-white/68">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <SignalTile title="Trust" value={`${report.trustScore}%`} tone={report.trustScore >= 70 ? "emerald" : report.trustScore >= 45 ? "amber" : "neutral"} />
                <SignalTile title="Governance" value={`${report.governanceDiscipline}%`} tone={report.governanceDiscipline >= 70 ? "emerald" : report.governanceDiscipline >= 45 ? "amber" : "neutral"} />
                <SignalTile title="Readiness" value={`${report.interventionReadiness}%`} tone={report.interventionReadiness >= 70 ? "emerald" : report.interventionReadiness >= 45 ? "amber" : "neutral"} />
                <SignalTile title="Failure load" value={`${report.failureModeCount}/${Math.max(report.failureModeCount, 5)}`} tone={report.failureModeCount >= 4 ? "amber" : "neutral"} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-amber-400/70" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                    Constitutional interventions
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {decision.recommendedInterventions.slice(0, 6).map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm leading-7 text-white/64">
                      <TimerReset className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {decision.disqualifiersTriggered.length > 0 ? (
                <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                      Constitutional constraints
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
            </div>
          </div>

          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.05] p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-300" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300/80">
                What the next layers add
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-white">Team assessment</div>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Multi-respondent evidence, variance detection, and cross-layer trust analysis.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-white">Executive Reporting</div>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  A disciplined executive artifact with posture, risks, priorities, and mandate implications.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-white">Strategy Room</div>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Private intervention where the signal is strong enough to justify consequence-bearing action.
                </p>
              </div>
            </div>
          </div>

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
              Start again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const previewReport = report ?? buildMicroReport(answers);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
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
              A real first reading,
              <span className="block text-white/58">not a decorative questionnaire</span>
            </h1>

            <p className="mt-4 max-w-3xl text-white/52">
              This intake is designed to function as a credible city gate. It gives
              serious users immediate structural insight, constitutional routing,
              and practical next-step discipline without pretending to replace deeper layers.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SignalTile title="Progress" value={`${progress}%`} tone="amber" />
            <SignalTile title="Answered" value={`${answeredCount}/${DIAGNOSTIC_QUESTIONS.length}`} tone="neutral" />
            <SignalTile title="Current Domain" value={currentQuestion.domain} tone="neutral" />
            <SignalTile title="Draft Status" value={savingDraft ? "Saving" : "Saved"} tone={savingDraft ? "amber" : "emerald"} />
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
                {currentQuestionIndex === DIAGNOSTIC_QUESTIONS.length - 1 ? "Complete" : "Next"}
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
              <SignalTile title="Authority" value={`${previewReport.authorityScore}%`} tone={previewReport.authorityScore >= 70 ? "emerald" : previewReport.authorityScore >= 45 ? "amber" : "neutral"} />
              <SignalTile title="Coherence" value={`${previewReport.coherenceScore}%`} tone={previewReport.coherenceScore >= 70 ? "emerald" : previewReport.coherenceScore >= 45 ? "amber" : "neutral"} />
              <SignalTile title="Pressure" value={`${previewReport.pressureScore}%`} tone={previewReport.pressureScore >= 70 ? "amber" : "neutral"} />
              <SignalTile title="Friction" value={`${previewReport.frictionScore}%`} tone={previewReport.frictionScore >= 70 ? "amber" : "neutral"} />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center gap-2">
                {decision?.route === "STRATEGY" ? (
                  <Crown className="h-4 w-4 text-emerald-400" />
                ) : decision?.route === "DIAGNOSTIC" ? (
                  <Scale className="h-4 w-4 text-amber-400" />
                ) : decision?.route === "REJECT" ? (
                  <Lock className="h-4 w-4 text-white/45" />
                ) : (
                  <Eye className="h-4 w-4 text-white/45" />
                )}

                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/42">
                  Provisional route
                </span>
              </div>

              <div className="mt-3 text-base font-medium text-white">
                {decision ? routeInfo.title : "Signal still forming"}
              </div>

              <div className="mt-2 text-sm leading-relaxed text-white/52">
                {decision
                  ? routeInfo.description
                  : "Once the signal is strong enough, the system will classify posture, readiness, authority, and escalation fitness."}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-amber-400/70" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                What this layer actually gives you
              </span>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-relaxed text-white/58">
              <div className="flex items-start gap-3">
                <Gavel className="mt-0.5 h-4 w-4 text-emerald-400/75" />
                <span>
                  A constitutional route based on authority, coherence, consequence, and readiness.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Activity className="mt-0.5 h-4 w-4 text-amber-400/75" />
                <span>
                  A real micro-report that surfaces posture, failure load, readiness, and interventions.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Target className="mt-0.5 h-4 w-4 text-white/45" />
                <span>
                  A clearer sense of whether you need deeper diagnostics, executive interpretation, or mandate-level escalation.
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-500/16 bg-amber-500/[0.04] p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-300/74">
                Institutional posture
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/56">
                This gate is useful on its own. Other layers are optional and only explored on need-to basis.
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
                You have completed the intake. Reveal the constitutional verdict and the micro-report.
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
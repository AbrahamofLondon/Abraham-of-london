// components/assessments/ConstitutionalDiagnosticSuite.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import {
  evaluateConstitutionalRoute,
  type ConstitutionalDecision,
  type AuthorityType,
  type OrgPosture,
  type ReadinessTier,
} from "@/lib/constitution/rules";

type Likert = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type Answer = { resonance: Likert; certainty: Likert };

type Question = {
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

const QUESTIONS: readonly Question[] = [
  { id: "q1", text: "Strategy and actual resource allocation are aligned.", domain: "coherence" },
  { id: "q2", text: "Decision authority is explicit and consistently exercised.", domain: "authority" },
  { id: "q3", text: "The environment has changed faster than adaptation.", domain: "environment", reverse: true },
  { id: "q4", text: "There is visible strategic drift.", domain: "execution", reverse: true },
  { id: "q5", text: "Trust between leadership and execution is intact.", domain: "trust" },
  { id: "q6", text: "The organisation carries material operating friction.", domain: "friction", reverse: true },
  { id: "q7", text: "A decision-bearing sponsor exists.", domain: "authority" },
  { id: "q8", text: "The cost of error is material.", domain: "stakes" },
  { id: "q9", text: "Past attempts failed for structural reasons.", domain: "pattern", reverse: true },
  { id: "q10", text: "External pressure is actively forcing attention.", domain: "pressure" },
] as const;

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function pct(v: number) {
  return clamp(Math.round(v * 10), 0, 100);
}

function certaintyWeight(v: Likert) {
  return clamp(0.45 + v / 18, 0.45, 1);
}

function classifyAuthorityType(score: number): AuthorityType {
  if (score >= 70) return "DIRECT";
  if (score >= 45) return "PROXY";
  return "UNCLEAR";
}

function classifyPosture(coherence: number, friction: number, trust: number, governance: number): OrgPosture {
  const red = [coherence < 35, friction >= 70, trust < 35, governance < 35].filter(Boolean).length;
  if (red >= 3) return "DISORDERED";
  if (coherence < 45 || friction >= 60) return "MISALIGNED";
  if (coherence < 65 || governance < 60) return "DRIFTING";
  return "ORDERED";
}

function classifyReadiness(
  authority: number,
  coherence: number,
  trust: number,
  readiness: number,
  governance: number,
): ReadinessTier {
  const composite = (authority + coherence + trust + readiness + governance) / 5;
  if (composite < 35) return "FRAGILE";
  if (composite < 50) return "EMERGING";
  if (composite < 68) return "STABILIZING";
  if (composite < 85) return "EXECUTION_READY";
  return "SOVEREIGN";
}

function buildDecision(answers: Record<string, Answer>): {
  decision: ConstitutionalDecision | null;
  routeHref: string;
} {
  const buckets: Record<string, number[]> = {};

  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    if (!answer) continue;
    const base = q.reverse ? 10 - answer.resonance : answer.resonance;
    const scored = base * certaintyWeight(answer.certainty);
    (buckets[q.domain] ||= []).push(scored);
  }

  const avg = (items: number[]) =>
    items.length ? items.reduce((a, b) => a + b, 0) / items.length : 5;

  const authority = pct(avg(buckets.authority || []));
  const coherence = pct(avg(buckets.coherence || []));
  const trust = pct(avg(buckets.trust || []));
  const pressure = pct(avg([...(buckets.pressure || []), ...(buckets.stakes || []), ...(buckets.environment || [])]));
  const friction = pct(avg([...(buckets.friction || []), ...(buckets.execution || []), ...(buckets.pattern || [])]));

  const seriousness = clamp(Math.round((pressure + friction + authority) / 3), 0, 100);
  const governance = clamp(Math.round((coherence + trust + authority) / 3), 0, 100);
  const narrative = clamp(Math.round((coherence + trust + authority) / 3), 0, 100);
  const interventionReadiness = clamp(Math.round((authority + coherence + trust + (100 - friction)) / 4), 0, 100);

  let failureModeCount = 0;
  if (coherence < 50) failureModeCount++;
  if (authority < 50) failureModeCount++;
  if (trust < 50) failureModeCount++;
  if (friction >= 60) failureModeCount++;
  if (pressure >= 70) failureModeCount++;

  const severity = clamp(
    Math.round(((100 - coherence) / 10 + (100 - authority) / 10 + friction / 10 + pressure / 12) / 4),
    0,
    10,
  );

  const authorityType = classifyAuthorityType(authority);
  const posture = classifyPosture(coherence, friction, trust, governance);
  const readinessTier = classifyReadiness(
    authority,
    coherence,
    trust,
    interventionReadiness,
    governance,
  );

  const decision = evaluateConstitutionalRoute({
    clarityScore: coherence,
    authorityType,
    readinessTier,
    posture,
    failureModeCount,
    failureModeSeverity: severity,
    narrativeCoherence: narrative,
    interventionReadiness,
    seriousnessScore: seriousness,
    governanceDiscipline: governance,
    trustCondition: trust,
    mandateFit: seriousness >= 30,
    operatorKey: "public_constitutional_diagnostic",
    operatorOverrideRequested: false,
  });

  const routeHref =
    decision.route === "STRATEGY"
      ? "/consulting/strategy-room"
      : decision.route === "DIAGNOSTIC"
        ? "/diagnostics/executive-reporting"
        : "/diagnostics";

  return { decision, routeHref };
}

export default function ConstitutionalDiagnosticSuite() {
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, Answer>>({});
  const [show, setShow] = React.useState(false);

  const current = QUESTIONS[index]!;
  const currentAnswer = answers[current.id] || { resonance: 5 as Likert, certainty: 5 as Likert };
  const complete = Object.keys(answers).length === QUESTIONS.length;
  const progress = Math.round((Object.keys(answers).length / QUESTIONS.length) * 100);

  const { decision, routeHref } = React.useMemo(() => buildDecision(answers), [answers]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      {!show ? (
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
                  Constitutional diagnostic
                </span>
              </div>

              <h1 className="mt-6 font-serif text-4xl text-white sm:text-5xl">
                Serious first reading
              </h1>
              <p className="mt-4 max-w-3xl text-white/52">
                This is the city gate. It gives route, posture, and escalation fitness without pretending to replace deeper evidence layers.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">Progress</div>
                <div className="mt-2 font-serif text-2xl text-white">{progress}%</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">Answered</div>
                <div className="mt-2 font-serif text-2xl text-white">{Object.keys(answers).length}/10</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">Domain</div>
                <div className="mt-2 font-serif text-2xl text-white">{current.domain}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">Provisional route</div>
                <div className="mt-2 font-serif text-2xl text-white">{decision?.route || "…"}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                  Question {index + 1} of {QUESTIONS.length}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/40">
                  {current.domain}
                </span>
              </div>

              <p className="text-xl leading-relaxed text-white sm:text-2xl">
                {current.text}
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-[0.16em] text-white/40">How true is this?</span>
                    <span className="text-xs text-amber-300">{currentAnswer.resonance}/10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={currentAnswer.resonance}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [current.id]: { ...currentAnswer, resonance: Number(e.target.value) as Likert },
                      }))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-500"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-[0.16em] text-white/40">How certain are you?</span>
                    <span className="text-xs text-emerald-300">{currentAnswer.certainty}/10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={currentAnswer.certainty}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [current.id]: { ...currentAnswer, certainty: Number(e.target.value) as Likert },
                      }))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setIndex((v) => Math.max(0, v - 1))}
                  disabled={index === 0}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-sm font-medium transition",
                    index === 0
                      ? "cursor-not-allowed text-white/20"
                      : "border border-white/10 text-white/70 hover:bg-white/5",
                  )}
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (index < QUESTIONS.length - 1) {
                      setIndex((v) => v + 1);
                    } else if (complete) {
                      setShow(true);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-medium text-black transition hover:bg-amber-400"
                >
                  {index === QUESTIONS.length - 1 ? "Complete" : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                Live readout
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">Route</div>
                  <div className="mt-2 font-serif text-2xl text-white">{decision?.route || "Pending"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">Confidence</div>
                  <div className="mt-2 font-serif text-2xl text-white">{decision ? `${Math.round(decision.confidence * 100)}%` : "—"}</div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center gap-2">
                  {decision?.route === "STRATEGY" ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  ) : decision?.route === "DIAGNOSTIC" ? (
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-white/45" />
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/42">
                    Next layer
                  </span>
                </div>

                <div className="mt-3 text-base font-medium text-white">
                  {decision?.route === "STRATEGY"
                    ? "Strategy Room"
                    : decision?.route === "DIAGNOSTIC"
                      ? "Executive Reporting"
                      : "Foundational Diagnostics"}
                </div>
              </div>
            </div>

            {complete ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                  Ready for verdict
                </div>
                <button
                  onClick={() => setShow(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-medium text-black transition hover:bg-amber-400"
                >
                  Reveal verdict
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </aside>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
                Constitutional verdict
              </span>
            </div>

            <h1 className="mt-6 font-serif text-4xl text-white">Route: {decision?.route}</h1>
            <p className="mt-4 max-w-3xl text-white/58">
              This micro-report is self-sufficient as a first gate, but it is designed to hand signal forward into the next layer without rework.
            </p>

            <div className="mt-8 flex gap-4">
              <Link
                href={routeHref}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-medium text-black transition hover:bg-amber-400"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                onClick={() => setShow(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white/60 transition hover:bg-white/5"
              >
                Review answers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/**
 * pages/quick-check.tsx — Quick Decision Health Check
 *
 * Low-friction public product that converts uncertainty into route selection.
 * Returns: decision condition, key weakness, next admissible move, recommended route.
 *
 * Rules:
 *   - No AI-tool framing.
 *   - Does not overclaim.
 *   - Links forward into relevant corridor/product pages.
 *   - No engine internals exposed.
 */

import React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Route, Target, Zap } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Decision condition definitions ───────────────────────────────────────────

type DecisionCondition = {
  id: string;
  label: string;
  description: string;
  weakness: string;
  nextMove: string;
  recommendedRoute: string;
  recommendedLabel: string;
};

const CONDITIONS: DecisionCondition[] = [
  {
    id: "pressure",
    label: "Under pressure",
    description: "The decision has a deadline or consequence that creates urgency, but the path forward is not yet clear.",
    weakness: "Missing evidence or authority clarity under time constraint.",
    nextMove: "Run a fast pressure signal to identify the immediate gap.",
    recommendedRoute: "/decision-pressure",
    recommendedLabel: "Start free pressure signal",
  },
  {
    id: "evidence-gap",
    label: "Evidence gap",
    description: "The decision exists but the supporting evidence, data, or reasoning is incomplete or untested.",
    weakness: "The evidence base would not survive board, client, or regulatory challenge.",
    nextMove: "Run a structured diagnostic to surface evidence weaknesses.",
    recommendedRoute: "/diagnostics/fast",
    recommendedLabel: "Run Fast Diagnostic",
  },
  {
    id: "authority-unclear",
    label: "Authority unclear",
    description: "Who owns the decision, who can approve it, and who is accountable for the outcome is not resolved.",
    weakness: "No named authority holder means the decision cannot be executed, reversed, or audited.",
    nextMove: "Run a Constitutional Diagnostic to clarify authority and mandate.",
    recommendedRoute: "/diagnostics/constitutional-diagnostic",
    recommendedLabel: "Run Constitutional Diagnostic",
  },
  {
    id: "execution-risk",
    label: "Execution risk",
    description: "The decision has been made but ownership, blockers, checkpoints, or delivery conditions are not governed.",
    weakness: "Execution is vulnerable to drift, delay, or unmanaged blockers.",
    nextMove: "Move into the governed execution corridor.",
    recommendedRoute: "/products#paid-corridor",
    recommendedLabel: "View paid corridor",
  },
  {
    id: "organisational",
    label: "Organisational friction",
    description: "The issue is not one decision but misalignment across teams, authority, or governance structures.",
    weakness: "Local fixes will not hold while organisational friction remains unresolved.",
    nextMove: "Run an Enterprise Assessment to test where the organisation breaks.",
    recommendedRoute: "/enterprise",
    recommendedLabel: "View Enterprise pathway",
  },
];

// ─── Result type ──────────────────────────────────────────────────────────────

type CheckResult = {
  condition: DecisionCondition;
  healthSignal: "healthy" | "caution" | "critical";
  summary: string;
};

function evaluateCheck(answers: Record<string, string>): CheckResult {
  const hasDeadline = answers.urgency === "soon" || answers.urgency === "immediate";
  const hasEvidence = answers.evidence === "strong" || answers.evidence === "partial";
  const hasAuthority = answers.authority === "yes" || answers.authority === "partial";
  const isOrganisational = answers.scope === "team" || answers.scope === "enterprise";

  if (!hasAuthority && hasDeadline) {
    return {
      condition: CONDITIONS[2]!, // authority-unclear
      healthSignal: "critical",
      summary: "Authority is unclear and time pressure is active. This combination creates material decision risk.",
    };
  }

  if (!hasEvidence && hasDeadline) {
    return {
      condition: CONDITIONS[0]!, // pressure
      healthSignal: "caution",
      summary: "Time pressure is present and evidence is incomplete. A fast signal will clarify the immediate gap.",
    };
  }

  if (!hasEvidence) {
    return {
      condition: CONDITIONS[1]!, // evidence-gap
      healthSignal: "caution",
      summary: "The evidence base needs strengthening before this decision can proceed with confidence.",
    };
  }

  if (isOrganisational) {
    return {
      condition: CONDITIONS[4]!, // organisational
      healthSignal: "caution",
      summary: "The issue extends beyond a single decision. An organisational scan will identify where friction is concentrated.",
    };
  }

  if (hasEvidence && hasAuthority && !hasDeadline) {
    return {
      condition: CONDITIONS[3]!, // execution-risk
      healthSignal: "healthy",
      summary: "The decision has evidence and authority. The next question is whether execution is governed.",
    };
  }

  // Default: pressure
  return {
    condition: CONDITIONS[0]!,
    healthSignal: "caution",
    summary: "Start with a fast pressure signal to identify the primary condition.",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuickCheckPage() {
  const [started, setStarted] = React.useState(false);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<CheckResult | null>(null);

  const questions = [
    {
      id: "urgency",
      label: "How urgent is this decision?",
      options: [
        { value: "immediate", label: "Immediate — days, not weeks" },
        { value: "soon", label: "Soon — weeks, not months" },
        { value: "not-urgent", label: "Not urgent — no fixed deadline" },
      ],
    },
    {
      id: "evidence",
      label: "How strong is the evidence supporting this decision?",
      options: [
        { value: "strong", label: "Strong — data, analysis, and reasoning are in place" },
        { value: "partial", label: "Partial — some evidence exists but gaps remain" },
        { value: "weak", label: "Weak — the decision is based on assumption or incomplete information" },
      ],
    },
    {
      id: "authority",
      label: "Is the decision authority clear?",
      options: [
        { value: "yes", label: "Yes — a named person or body owns and can approve this" },
        { value: "partial", label: "Partially — ownership exists but scope or accountability is unclear" },
        { value: "no", label: "No — it is not clear who can make or approve this decision" },
      ],
    },
    {
      id: "scope",
      label: "Is this a single decision or an organisational issue?",
      options: [
        { value: "single", label: "Single decision — one choice, one owner, one path" },
        { value: "team", label: "Team-level — multiple people are involved or affected" },
        { value: "enterprise", label: "Organisational — the issue spans teams, authority, or governance" },
      ],
    },
  ];

  function handleAnswer(questionId: string, value: string) {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);

    if (Object.keys(next).length === questions.length) {
      setResult(evaluateCheck(next));
    }
  }

  function handleReset() {
    setStarted(false);
    setAnswers({});
    setResult(null);
  }

  const healthColor = result?.healthSignal === "critical" ? "rgba(252,165,165,0.80)"
    : result?.healthSignal === "caution" ? `${GOLD}BB`
    : "rgba(110,231,183,0.80)";

  return (
    <Layout
      title="Quick Decision Health Check | Abraham of London"
      description="A fast public check for decision condition, key weakness, and next admissible move. No account required."
      canonicalUrl="/quick-check"
      fullWidth
      headerTransparent
    >
      <div style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh" }}>
        <section className="px-6 pt-[120px] pb-16 lg:px-12 lg:pt-36">
          <div className="mx-auto max-w-3xl">
            <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}88` }}>
              Quick Decision Health Check
            </p>
            <h1
              className="mt-6 max-w-[48rem]"
              style={{ ...serif, color: "#F5F5F5", fontSize: "clamp(2.2rem, 6vw, 3.8rem)", lineHeight: 0.95, fontStyle: "italic" }}
            >
              Is this decision healthy enough to proceed?
            </h1>
            <p className="mt-6 max-w-[60ch] text-[15px] leading-[1.85] text-white/[0.60]">
              Four quick questions. Returns your decision condition, key weakness, next admissible move, and a recommended route. No account required.
            </p>

            {!started && !result && (
              <div className="mt-10">
                <button
                  type="button"
                  onClick={() => setStarted(true)}
                  className="group inline-flex items-center gap-2 border px-6 py-4 transition-all duration-150 hover:-translate-y-px"
                  style={{ ...mono, borderColor: `${GOLD}50`, backgroundColor: `${GOLD}12`, color: "#F5F5F5", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                >
                  Start health check
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
                <p className="mt-4 text-[13px] text-white/[0.40]" style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em" }}>
                  Free · No account required · 2 minutes
                </p>
              </div>
            )}

            {/* Questions */}
            {started && !result && (
              <div className="mt-10 space-y-8">
                {questions.map((q) => {
                  const answered = answers[q.id] !== undefined;
                  return (
                    <div key={q.id} className="border border-white/[0.06] bg-white/[0.012] p-5">
                      <p className="mb-4 text-[14px] leading-[1.6] text-white/[0.75]" style={{ ...serif, fontSize: "1.1rem", fontStyle: "italic" }}>
                        {q.label}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const selected = answers[q.id] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleAnswer(q.id, opt.value)}
                              className="flex w-full items-center gap-3 border px-4 py-3 text-left transition-all duration-100"
                              style={{
                                borderColor: selected ? `${GOLD}50` : "rgba(255,255,255,0.08)",
                                backgroundColor: selected ? `${GOLD}10` : "rgba(255,255,255,0.02)",
                                color: selected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)",
                              }}
                            >
                              <span
                                className="flex h-4 w-4 shrink-0 items-center justify-center border"
                                style={{
                                  borderColor: selected ? `${GOLD}60` : "rgba(255,255,255,0.15)",
                                  backgroundColor: selected ? `${GOLD}20` : "transparent",
                                }}
                              >
                                {selected && <span className="h-2 w-2" style={{ backgroundColor: GOLD }} />}
                              </span>
                              <span className="text-[13px] leading-[1.5]">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="mt-10">
                <div
                  className="border p-6 lg:p-8"
                  style={{ borderColor: `${healthColor}30`, backgroundColor: `${healthColor}08` }}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 border px-3 py-1.5"
                      style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", borderColor: `${healthColor}30`, color: healthColor, backgroundColor: `${healthColor}10` }}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {result.healthSignal === "critical" ? "Requires attention"
                        : result.healthSignal === "caution" ? "Proceed with care"
                        : "Ready to proceed"}
                    </span>
                    <span
                      className="inline-flex items-center border px-3 py-1.5"
                      style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", borderColor: `${GOLD}30`, color: `${GOLD}BB`, backgroundColor: `${GOLD}08` }}
                    >
                      {result.condition.label}
                    </span>
                  </div>

                  <p className="mt-5 text-[14px] leading-[1.75] text-white/[0.60]">
                    {result.summary}
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="border border-white/[0.06] bg-white/[0.015] p-4">
                      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}80` }}>
                        Key weakness
                      </p>
                      <p className="mt-2 text-[13px] leading-[1.65] text-white/[0.55]">
                        {result.condition.weakness}
                      </p>
                    </div>
                    <div className="border border-white/[0.06] bg-white/[0.015] p-4">
                      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}80` }}>
                        Next admissible move
                      </p>
                      <p className="mt-2 text-[13px] leading-[1.65] text-white/[0.55]">
                        {result.condition.nextMove}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={result.condition.recommendedRoute}
                      className="group inline-flex items-center gap-2 border px-5 py-3 transition-all duration-150 hover:-translate-y-px"
                      style={{ ...mono, borderColor: `${GOLD}50`, backgroundColor: `${GOLD}12`, color: "#F5F5F5", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                    >
                      {result.condition.recommendedLabel}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                      href="/products"
                      className="group inline-flex items-center gap-2 border border-white/[0.10] px-5 py-3 transition-all duration-150 hover:-translate-y-px hover:border-white/[0.18]"
                      style={{ ...mono, color: "rgba(255,255,255,0.50)", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                    >
                      View all products
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 border border-white/[0.08] px-4 py-2.5 text-white/[0.40] transition-colors hover:border-white/[0.14] hover:text-white/[0.60]"
                    style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}
                  >
                    Run again
                  </button>
                </div>
              </div>
            )}

            {/* Forward links */}
            <div className="mt-12 border-t border-white/[0.06] pt-8">
              <p className="mb-4 text-[13px] text-white/[0.40]" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Need more than a quick check?
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/decision-pressure"
                  className="group inline-flex items-center gap-2 border px-4 py-2.5 transition-all hover:-translate-y-px"
                  style={{ ...mono, borderColor: `${GOLD}35`, backgroundColor: `${GOLD}0D`, color: "rgba(255,255,255,0.72)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  <Zap className="h-3 w-3" />
                  Free pressure signal
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/boardroom-brief"
                  className="group inline-flex items-center gap-2 border border-white/[0.08] px-4 py-2.5 transition-all hover:-translate-y-px hover:border-white/[0.14]"
                  style={{ ...mono, color: "rgba(255,255,255,0.45)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  <Target className="h-3 w-3" />
                  Generate Boardroom Brief
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/diagnostics/fast"
                  className="group inline-flex items-center gap-2 border border-white/[0.08] px-4 py-2.5 transition-all hover:-translate-y-px hover:border-white/[0.14]"
                  style={{ ...mono, color: "rgba(255,255,255,0.45)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  <Route className="h-3 w-3" />
                  Run Fast Diagnostic
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

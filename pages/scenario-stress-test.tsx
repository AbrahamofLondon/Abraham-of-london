/**
 * pages/scenario-stress-test.tsx — Standalone Scenario Stress Test
 *
 * Public proof surface that tests decision quality under simulated pressure.
 * Uses known scenario definitions from lib/engine/scenario-stress-test.
 *
 * Returns: pressure finding, likely break point, weakness category,
 *          strengthening recommendation, recommended next route.
 *
 * Rules:
 *   - Uses known scenario definitions only.
 *   - Does not expose raw unsafe text.
 *   - Does not masquerade as enterprise assessment.
 *   - Clearly positioned as public proof surface.
 *   - No AI-tool framing.
 */

import React from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, ShieldCheck, Zap, Target, Route } from "lucide-react";
import Layout from "@/components/Layout";
import { SCENARIOS, type StressScenario, analyseScenarioResponse } from "@/lib/engine/scenario-stress-test";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Public scenarios (subset of full scenario bank) ──────────────────────────

const PUBLIC_SCENARIOS = SCENARIOS.filter(s =>
  s.assessmentType === "purpose" || s.assessmentType === "constitutional"
).slice(0, 3);

// ─── Result type ──────────────────────────────────────────────────────────────

type StressResult = {
  scenario: StressScenario;
  chosenOption: 0 | 1;
  insight: string;
  breakPoint: string;
  weaknessCategory: string;
  strengtheningRecommendation: string;
  recommendedRoute: string;
  recommendedLabel: string;
};

function computeResult(scenario: StressScenario, choice: 0 | 1): StressResult {
  const insight = scenario.reveals[choice];

  // Derive break point from the unchosen option's reveal
  const unchosenReveal = scenario.reveals[choice === 0 ? 1 : 0];
  const breakPoint = `The decision reveals a tension between "${insight.toLowerCase()}" and "${unchosenReveal.toLowerCase()}". The break point is whether the organisation can sustain both simultaneously.`;

  // Weakness category based on scenario domains
  const domainMap: Record<string, string> = {
    identity: "Mandate clarity",
    decision: "Decision structure",
    emotional_order: "Pressure resilience",
    environment: "Situational awareness",
    authority: "Authority clarity",
    governance: "Governance integrity",
    friction: "Conflict resolution",
    trust: "Trust and alignment",
    coherence: "Strategic coherence",
    execution: "Execution discipline",
    risk: "Risk management",
  };
  const categories = scenario.testsDomains.map(d => domainMap[d] || d);
  const weaknessCategory = categories.length > 0 ? categories.join(", ") : "Decision quality";

  // Strengthening recommendation
  const strengtheningRecommendation = choice === 0
    ? `Your choice prioritises ${insight.toLowerCase()}. Strengthen this by ensuring the supporting evidence, authority, and governance structure can sustain the conviction path.`
    : `Your choice prioritises ${insight.toLowerCase()}. Strengthen this by ensuring the adaptive path does not dilute accountability or delay critical execution.`;

  // Route recommendation
  const recommendedRoute = "/decision-pressure";
  const recommendedLabel = "Start free pressure signal";

  return {
    scenario,
    chosenOption: choice,
    insight,
    breakPoint,
    weaknessCategory,
    strengtheningRecommendation,
    recommendedRoute,
    recommendedLabel,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScenarioStressTestPage() {
  const [currentScenario, setCurrentScenario] = React.useState<number>(0);
  const [results, setResults] = React.useState<StressResult[]>([]);
  const [started, setStarted] = React.useState(false);
  const [finished, setFinished] = React.useState(false);

  const scenario = PUBLIC_SCENARIOS[currentScenario];
  const isLast = currentScenario >= PUBLIC_SCENARIOS.length - 1;

  function handleChoice(choice: 0 | 1) {
    if (!scenario) return;
    const result = computeResult(scenario, choice);
    const nextResults = [...results, result];
    setResults(nextResults);

    if (isLast) {
      setFinished(true);
    } else {
      setCurrentScenario(currentScenario + 1);
    }
  }

  function handleReset() {
    setCurrentScenario(0);
    setResults([]);
    setStarted(false);
    setFinished(false);
  }

  return (
    <Layout
      title="Scenario Stress Test | Abraham of London"
      description="A public proof surface that tests decision quality under simulated pressure. Free, no account required."
      canonicalUrl="/scenario-stress-test"
      fullWidth
      headerTransparent
    >
      <div style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh" }}>
        <section className="px-6 pt-[120px] pb-16 lg:px-12 lg:pt-36">
          <div className="mx-auto max-w-3xl">
            <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}88` }}>
              Scenario Stress Test
            </p>
            <h1
              className="mt-6 max-w-[48rem]"
              style={{ ...serif, color: "#F5F5F5", fontSize: "clamp(2.2rem, 6vw, 3.8rem)", lineHeight: 0.95, fontStyle: "italic" }}
            >
              How does your decision behave under pressure?
            </h1>
            <p className="mt-6 max-w-[60ch] text-[15px] leading-[1.85] text-white/[0.60]">
              A public proof surface that tests decision quality under simulated pressure. Each scenario presents a forced choice under time constraint and stakes. Free, no account required.
            </p>

            {!started && !finished && (
              <div className="mt-10">
                <button
                  type="button"
                  onClick={() => setStarted(true)}
                  className="group inline-flex items-center gap-2 border px-6 py-4 transition-all duration-150 hover:-translate-y-px"
                  style={{ ...mono, borderColor: `${GOLD}50`, backgroundColor: `${GOLD}12`, color: "#F5F5F5", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                >
                  Start scenario test
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
                <p className="mt-4 text-[13px] text-white/[0.40]" style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em" }}>
                  Free · No account required · 3 scenarios · 3 minutes
                </p>
                <div className="mt-6 border border-white/[0.06] bg-white/[0.012] p-4">
                  <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}80` }}>
                    What this tests
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.65] text-white/[0.50]">
                    This is a public proof surface — not a full enterprise assessment. It reveals how you respond under simulated pressure. Deeper governance is available inside the paid corridor.
                  </p>
                </div>
              </div>
            )}

            {/* Scenario questions */}
            {started && !finished && scenario && (
              <div className="mt-10">
                <div className="mb-6 flex items-center gap-3">
                  <span
                    className="inline-flex items-center border px-2.5 py-1"
                    style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", borderColor: `${GOLD}30`, color: `${GOLD}BB`, backgroundColor: `${GOLD}08` }}
                  >
                    Scenario {currentScenario + 1} of {PUBLIC_SCENARIOS.length}
                  </span>
                  <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.35)" }}>
                    {scenario.timeConstraint} · {scenario.stakes}
                  </span>
                </div>

                <div className="border border-white/[0.06] bg-white/[0.015] p-6 lg:p-8">
                  <p className="text-[16px] leading-[1.7] text-white/[0.75]" style={{ ...serif, fontSize: "1.2rem", fontStyle: "italic" }}>
                    {scenario.situation}
                  </p>

                  <div className="mt-6 space-y-3">
                    <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}80` }}>
                      Choose your response
                    </p>
                    {([0, 1] as const).map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleChoice(idx)}
                        className="flex w-full items-center gap-3 border px-5 py-4 text-left transition-all duration-100 hover:border-white/[0.15] hover:bg-white/[0.02]"
                        style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)" }}
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center border"
                          style={{ borderColor: `${GOLD}40`, backgroundColor: `${GOLD}08` }}
                        >
                          <span className="text-[9px]" style={{ color: GOLD }}>{idx === 0 ? "A" : "B"}</span>
                        </span>
                        <span className="text-[14px] leading-[1.6] text-white/[0.65]">
                          {scenario.options[idx]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {finished && results.length > 0 && (
              <div className="mt-10 space-y-8">
                <div className="border border-white/[0.06] bg-white/[0.012] p-6 lg:p-8">
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}80` }}>
                    Stress test results
                  </p>
                  <p className="mt-3 text-[13px] leading-[1.65] text-white/[0.50]">
                    Based on {results.length} scenario response{results.length > 1 ? "s" : ""}. This is a public proof surface — deeper governance is available inside the paid corridor.
                  </p>
                </div>

                {results.map((r, i) => (
                  <div key={i} className="border border-white/[0.06] bg-white/[0.012] p-5 lg:p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="inline-flex items-center border px-2.5 py-1"
                        style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", borderColor: `${GOLD}30`, color: `${GOLD}BB`, backgroundColor: `${GOLD}08` }}
                      >
                        Scenario {i + 1}
                      </span>
                      <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.35)" }}>
                        {r.scenario.timeConstraint}
                      </span>
                    </div>

                    <p className="mt-4 text-[14px] leading-[1.7] text-white/[0.55]">
                      {r.scenario.situation}
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="border border-white/[0.05] bg-white/[0.008] p-3.5">
                        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}75` }}>
                          Pressure finding
                        </p>
                        <p className="mt-1.5 text-[12px] leading-[1.6] text-white/[0.55]">
                          {r.insight}
                        </p>
                      </div>
                      <div className="border border-white/[0.05] bg-white/[0.008] p-3.5">
                        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}75` }}>
                          Likely break point
                        </p>
                        <p className="mt-1.5 text-[12px] leading-[1.6] text-white/[0.55]">
                          {r.breakPoint}
                        </p>
                      </div>
                      <div className="border border-white/[0.05] bg-white/[0.008] p-3.5">
                        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}75` }}>
                          Weakness category
                        </p>
                        <p className="mt-1.5 text-[12px] leading-[1.6] text-white/[0.55]">
                          {r.weaknessCategory}
                        </p>
                      </div>
                      <div className="border border-white/[0.05] bg-white/[0.008] p-3.5">
                        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}75` }}>
                          Strengthening recommendation
                        </p>
                        <p className="mt-1.5 text-[12px] leading-[1.6] text-white/[0.55]">
                          {r.strengtheningRecommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/decision-pressure"
                    className="group inline-flex items-center gap-2 border px-5 py-3 transition-all duration-150 hover:-translate-y-px"
                    style={{ ...mono, borderColor: `${GOLD}50`, backgroundColor: `${GOLD}12`, color: "#F5F5F5", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Start free pressure signal
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/products#paid-corridor"
                    className="group inline-flex items-center gap-2 border border-white/[0.10] px-5 py-3 transition-all duration-150 hover:-translate-y-px hover:border-white/[0.18]"
                    style={{ ...mono, color: "rgba(255,255,255,0.50)", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    View paid corridor
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <div className="mt-4">
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
                Need deeper governance?
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/quick-check"
                  className="group inline-flex items-center gap-2 border px-4 py-2.5 transition-all hover:-translate-y-px"
                  style={{ ...mono, borderColor: `${GOLD}35`, backgroundColor: `${GOLD}0D`, color: "rgba(255,255,255,0.72)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  <Target className="h-3 w-3" />
                  Quick Decision Health Check
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/boardroom-brief"
                  className="group inline-flex items-center gap-2 border border-white/[0.08] px-4 py-2.5 transition-all hover:-translate-y-px hover:border-white/[0.14]"
                  style={{ ...mono, color: "rgba(255,255,255,0.45)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  <Route className="h-3 w-3" />
                  Generate Boardroom Brief
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/enterprise"
                  className="group inline-flex items-center gap-2 border border-white/[0.08] px-4 py-2.5 transition-all hover:-translate-y-px hover:border-white/[0.14]"
                  style={{ ...mono, color: "rgba(255,255,255,0.45)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  <ShieldCheck className="h-3 w-3" />
                  Enterprise pathway
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

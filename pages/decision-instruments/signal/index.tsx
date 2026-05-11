/**
 * Decision Signal — free governed first reading.
 *
 * Not a lead magnet. A real first measurement with a clear boundary.
 *
 * Free output:
 *   1. Decision pressure band
 *   2. One named signal
 *   3. One consequence warning
 *   4. One immediate correction question
 *   5. One next admissible move
 *   6. Boundary statement explaining what paid assessment adds
 *
 * Excluded from free version:
 *   - Dossier
 *   - Memory write
 *   - Checkpoint
 *   - Report
 *   - Intervention path
 *   - Escalation payload
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const EMERALD = "#6EE7B7";
const VOID = "rgb(3 3 5)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type SignalInput = {
  decisionStatement: string;
  delayCostBand: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidenceLevel: number;
  consequenceIfWrong: "REVERSIBLE" | "COSTLY" | "STRUCTURAL" | "IRREVERSIBLE";
  urgencyBand: "LOW" | "MODERATE" | "HIGH" | "IMMEDIATE";
};

type SignalResult = {
  pressureBand: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  namedSignal: string;
  consequenceWarning: string;
  correctionQuestion: string;
  nextAdmissibleMove: string;
  evidencePosture: string;
};

function computeSignal(input: SignalInput): SignalResult {
  const costScore = { LOW: 1, MODERATE: 3, HIGH: 6, CRITICAL: 9 }[input.delayCostBand];
  const consequenceScore = { REVERSIBLE: 1, COSTLY: 3, STRUCTURAL: 6, IRREVERSIBLE: 9 }[input.consequenceIfWrong];
  const urgencyScore = { LOW: 1, MODERATE: 3, HIGH: 6, IMMEDIATE: 9 }[input.urgencyBand];
  const invertedConfidence = 10 - input.confidenceLevel;
  const composite = Math.round((costScore * 0.3 + consequenceScore * 0.3 + urgencyScore * 0.2 + invertedConfidence * 0.2) * 10);

  const pressureBand: SignalResult["pressureBand"] =
    composite >= 70 ? "CRITICAL" : composite >= 50 ? "HIGH" : composite >= 30 ? "MODERATE" : "LOW";

  const signalMap: Record<SignalResult["pressureBand"], string> = {
    LOW: "Low pressure — the decision is not yet urgent but may become relevant",
    MODERATE: "Moderate pressure — delay is measurable but not yet structural",
    HIGH: "High pressure — the decision is approaching a threshold where cost compounds non-linearly",
    CRITICAL: "Critical pressure — the decision appears overdue and delay is likely compounding daily",
  };

  const consequenceMap: Record<SignalResult["pressureBand"], string> = {
    LOW: "At current levels, the primary risk is distraction rather than damage",
    MODERATE: "If unresolved for 30 more days, the cost will be materially higher than it is today",
    HIGH: "The consequence of delay is now entering structural territory — it will affect more than the original decision",
    CRITICAL: "The consequence window is closing. What is at stake may no longer be recoverable if delayed further",
  };

  const correctionMap: Record<SignalResult["pressureBand"], string> = {
    LOW: "What would need to change for this decision to become urgent?",
    MODERATE: "What is the single constraint that, if removed, would allow this decision to resolve?",
    HIGH: "Who else needs to be involved before this becomes more expensive than the decision itself?",
    CRITICAL: "What has prevented action so far — and is that reason still valid today?",
  };

  const nextMoveMap: Record<SignalResult["pressureBand"], string> = {
    LOW: "Monitor. No formal instrument is warranted by this signal alone.",
    MODERATE: "Run the Decision Exposure Instrument to price the full consequence before it compounds.",
    HIGH: "Run the Escalation Readiness Scorecard. This decision may need executive-level attention.",
    CRITICAL: "Immediate Executive Reporting recommended. The delay cost is likely compounding daily.",
  };

  return {
    pressureBand,
    namedSignal: signalMap[pressureBand],
    consequenceWarning: consequenceMap[pressureBand],
    correctionQuestion: correctionMap[pressureBand],
    nextAdmissibleMove: nextMoveMap[pressureBand],
    evidencePosture: "USER_REPORTED — this is a first signal, not a full diagnosis",
  };
}

const DecisionSignalPage: NextPage = () => {
  const [input, setInput] = React.useState<SignalInput>({
    decisionStatement: "",
    delayCostBand: "MODERATE",
    confidenceLevel: 5,
    consequenceIfWrong: "COSTLY",
    urgencyBand: "MODERATE",
  });
  const [result, setResult] = React.useState<SignalResult | null>(null);

  function handleSubmit() {
    if (!input.decisionStatement.trim()) return;
    const r = computeSignal(input);
    setResult(r);
    track("decision_signal_completed", { pressureBand: r.pressureBand });
  }

  const bandColor = result?.pressureBand === "CRITICAL" ? "rgba(252,165,165,0.70)" : result?.pressureBand === "HIGH" ? "rgba(253,186,116,0.70)" : result?.pressureBand === "MODERATE" ? `${GOLD}CC` : "rgba(110,231,183,0.60)";

  return (
    <Layout title="Decision Signal | Abraham of London" description="Free governed first reading — detect whether a decision condition exists. Classifies pressure, names one signal, identifies next action.">
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-16" style={{ backgroundColor: VOID }}>
        <div className="mx-auto max-w-xl">
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>
            Decision Signal · Free · 2 minutes
          </span>
          <h1 className="mt-4" style={{ ...serif, fontSize: "2.2rem", color: "white", lineHeight: 1.2 }}>
            Detect whether a decision condition exists.
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/50">
            This is a first signal, not a full diagnosis. It classifies pressure, names one signal, and identifies the next admissible action. No account required.
          </p>

          {!result ? (
            <div className="mt-8 space-y-6">
              <div>
                <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>What decision is being delayed or avoided?</label>
                <textarea
                  value={input.decisionStatement}
                  onChange={(e) => setInput((p) => ({ ...p, decisionStatement: e.target.value }))}
                  placeholder="Describe the decision in one or two sentences..."
                  rows={3}
                  className="mt-2 w-full resize-none rounded-none border border-white/10 bg-white/5 p-3 text-sm text-white/70 placeholder:text-white/20 focus:border-amber-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Estimated cost of delay</label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {(["LOW", "MODERATE", "HIGH", "CRITICAL"] as const).map((band) => (
                    <button key={band} onClick={() => setInput((p) => ({ ...p, delayCostBand: band }))} style={{ padding: "8px", border: `1px solid ${input.delayCostBand === band ? `${GOLD}60` : "rgba(255,255,255,0.08)"}`, backgroundColor: input.delayCostBand === band ? `${GOLD}10` : "transparent", color: input.delayCostBand === band ? `${GOLD}CC` : "rgba(255,255,255,0.35)", ...mono, fontSize: "8px", letterSpacing: "0.12em", cursor: "pointer" }}>
                      {band}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Confidence in current path</label>
                  <span style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.50)" }}>{input.confidenceLevel}/10</span>
                </div>
                <input type="range" min={0} max={10} step={1} value={input.confidenceLevel} onChange={(e) => setInput((p) => ({ ...p, confidenceLevel: parseInt(e.target.value) }))} className="w-full" style={{ accentColor: GOLD }} />
              </div>

              <div>
                <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Consequence if the decision is wrong</label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {(["REVERSIBLE", "COSTLY", "STRUCTURAL", "IRREVERSIBLE"] as const).map((c) => (
                    <button key={c} onClick={() => setInput((p) => ({ ...p, consequenceIfWrong: c }))} style={{ padding: "8px", border: `1px solid ${input.consequenceIfWrong === c ? `${GOLD}60` : "rgba(255,255,255,0.08)"}`, backgroundColor: input.consequenceIfWrong === c ? `${GOLD}10` : "transparent", color: input.consequenceIfWrong === c ? `${GOLD}CC` : "rgba(255,255,255,0.35)", ...mono, fontSize: "7px", letterSpacing: "0.10em", cursor: "pointer" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Urgency</label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {(["LOW", "MODERATE", "HIGH", "IMMEDIATE"] as const).map((u) => (
                    <button key={u} onClick={() => setInput((p) => ({ ...p, urgencyBand: u }))} style={{ padding: "8px", border: `1px solid ${input.urgencyBand === u ? `${GOLD}60` : "rgba(255,255,255,0.08)"}`, backgroundColor: input.urgencyBand === u ? `${GOLD}10` : "transparent", color: input.urgencyBand === u ? `${GOLD}CC` : "rgba(255,255,255,0.35)", ...mono, fontSize: "8px", letterSpacing: "0.12em", cursor: "pointer" }}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!input.decisionStatement.trim()}
                style={{ width: "100%", padding: "16px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: input.decisionStatement.trim() ? "pointer" : "not-allowed", opacity: input.decisionStatement.trim() ? 1 : 0.4 }}
              >
                Generate signal
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {/* 1. Pressure band */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Decision pressure band</span>
                  <div style={{ ...serif, fontSize: "2.5rem", color: bandColor }}>{result.pressureBand}</div>
                </div>
              </div>

              {/* 2. Named signal */}
              <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Named signal</span>
                <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.70)", marginTop: "0.5rem" }}>{result.namedSignal}</p>
              </div>

              {/* 3. Consequence warning */}
              <div style={{ border: `1px solid ${AMBER}20`, backgroundColor: `${AMBER}04`, padding: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${AMBER}77` }}>Consequence warning</span>
                <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>{result.consequenceWarning}</p>
              </div>

              {/* 4. Correction question */}
              <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Immediate correction question</span>
                <p style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.6, color: "rgba(255,255,255,0.65)", marginTop: "0.25rem" }}>{result.correctionQuestion}</p>
              </div>

              {/* 5. Next admissible move */}
              <div style={{ border: `1px solid ${EMERALD}20`, backgroundColor: `${EMERALD}04`, padding: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${EMERALD}77` }}>Next admissible move</span>
                <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>{result.nextAdmissibleMove}</p>
              </div>

              {/* 6. Boundary statement — what this free signal does NOT include */}
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>What this signal does not include</span>
                <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>
                  This is a first signal, not a full diagnosis. It classifies pressure, names one signal, and identifies the next admissible action. It does not produce a full dossier, write to governed memory, create a checkpoint, or generate a full intervention path. The paid assessment adds full domain analysis, contradiction mapping, pattern identification, obligation conflict map, execution integrity implication, personal decision constitution, dossier, memory, and escalation bridge where justified.
                </p>
              </div>

              {/* Paid continuation path — routes to relevant instrument */}
              <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Lock style={{ width: 12, height: 12, color: GOLD }} />
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}88` }}>
                    Paid continuation
                  </span>
                </div>
                <p className="text-sm leading-7 text-white/50">
                  This signal is a first reading. To go deeper, use the appropriate instrument for your pressure level.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={result.pressureBand === "CRITICAL" ? "/diagnostics/executive-reporting" : result.pressureBand === "HIGH" ? "/decision-instruments/escalation-readiness-scorecard" : result.pressureBand === "MODERATE" ? "/decision-instruments/decision-exposure-instrument" : "/diagnostics/purpose-alignment"}
                    className="inline-flex items-center gap-1"
                    style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, textDecoration: "underline", textUnderlineOffset: 3 }}
                  >
                    {result.pressureBand === "CRITICAL" ? "Executive Reporting (£295)" : result.pressureBand === "HIGH" ? "Escalation Readiness Scorecard (£19)" : result.pressureBand === "MODERATE" ? "Decision Exposure Instrument (£29)" : "Purpose Alignment (free / £49)"}
                    <ArrowRight style={{ width: 9, height: 9 }} />
                  </Link>
                </div>
              </div>

              {/* Caveat */}
              <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.12)", textAlign: "center" }}>
                {result.evidencePosture}
              </p>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default DecisionSignalPage;
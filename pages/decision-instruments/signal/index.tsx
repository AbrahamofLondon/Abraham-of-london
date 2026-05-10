/**
 * Decision Signal — free governed first reading.
 *
 * Not a lead magnet. A real first measurement.
 * Inputs: decision statement, delay cost band, confidence, consequence, urgency.
 * Output: exposure band, contradiction prompt, next action, earned escalation condition.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type SignalInput = {
  decisionStatement: string;
  delayCostBand: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidenceLevel: number; // 0-10
  consequenceIfWrong: "REVERSIBLE" | "COSTLY" | "STRUCTURAL" | "IRREVERSIBLE";
  urgencyBand: "LOW" | "MODERATE" | "HIGH" | "IMMEDIATE";
};

type SignalResult = {
  exposureBand: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  contradictionPrompt: string;
  nextAction: string;
  earnedEscalation: string;
  evidencePosture: string;
};

function computeSignal(input: SignalInput): SignalResult {
  const costScore = { LOW: 1, MODERATE: 3, HIGH: 6, CRITICAL: 9 }[input.delayCostBand];
  const consequenceScore = { REVERSIBLE: 1, COSTLY: 3, STRUCTURAL: 6, IRREVERSIBLE: 9 }[input.consequenceIfWrong];
  const urgencyScore = { LOW: 1, MODERATE: 3, HIGH: 6, IMMEDIATE: 9 }[input.urgencyBand];
  const invertedConfidence = 10 - input.confidenceLevel;

  const composite = Math.round((costScore * 0.3 + consequenceScore * 0.3 + urgencyScore * 0.2 + invertedConfidence * 0.2) * 10);

  const exposureBand: SignalResult["exposureBand"] =
    composite >= 70 ? "CRITICAL" : composite >= 50 ? "HIGH" : composite >= 30 ? "MODERATE" : "LOW";

  const contradictionPrompts: Record<SignalResult["exposureBand"], string> = {
    LOW: "If the cost is low and the consequence is reversible, what makes this decision worth formal attention?",
    MODERATE: "You report moderate pressure but measurable confidence. What would change if you waited another 30 days?",
    HIGH: "High consequence with uncertainty. Who else needs to be involved before this becomes more expensive?",
    CRITICAL: "This signal suggests the decision is already overdue. What has prevented action so far?",
  };

  const nextActions: Record<SignalResult["exposureBand"], string> = {
    LOW: "Monitor. No formal instrument is warranted by this signal alone.",
    MODERATE: "Run the Decision Exposure Instrument to price the full consequence before it compounds.",
    HIGH: "Run the Escalation Readiness Scorecard. This decision may need executive-level attention.",
    CRITICAL: "Immediate Executive Reporting recommended. The delay cost is likely compounding daily.",
  };

  const escalations: Record<SignalResult["exposureBand"], string> = {
    LOW: "No escalation is earned by this signal. Additional evidence required.",
    MODERATE: "Decision Exposure Instrument is the next admissible step.",
    HIGH: "Escalation Readiness Scorecard or Executive Reporting is now admissible.",
    CRITICAL: "Executive Reporting and Strategy Room entry are both admissible at this exposure level.",
  };

  return {
    exposureBand,
    contradictionPrompt: contradictionPrompts[exposureBand],
    nextAction: nextActions[exposureBand],
    earnedEscalation: escalations[exposureBand],
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
  const [saved, setSaved] = React.useState(false);

  function handleSubmit() {
    if (!input.decisionStatement.trim()) return;
    const r = computeSignal(input);
    setResult(r);
    track("decision_signal_completed", { exposureBand: r.exposureBand });
  }

  async function handleSave() {
    try {
      await fetch("/api/decision-instruments/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instrumentSlug: "decision-signal",
          version: "1.0",
          scores: { delayCost: input.delayCostBand, confidence: input.confidenceLevel, consequence: input.consequenceIfWrong, urgency: input.urgencyBand },
          result: { ...result, decisionStatement: input.decisionStatement },
        }),
      });
      setSaved(true);
    } catch { /* degrade */ }
  }

  const bandColor = result?.exposureBand === "CRITICAL" ? "rgba(252,165,165,0.70)" : result?.exposureBand === "HIGH" ? "rgba(253,186,116,0.70)" : result?.exposureBand === "MODERATE" ? `${GOLD}CC` : "rgba(110,231,183,0.60)";

  return (
    <Layout title="Decision Signal | Abraham of London" description="Free governed first reading — detect whether a decision condition exists.">
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-16" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-xl">
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>
            Decision Signal · Free
          </span>
          <h1 className="mt-4" style={{ ...serif, fontSize: "2.2rem", color: "white", lineHeight: 1.2 }}>
            Detect whether a decision condition exists.
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/50">
            This is a first signal, not a full diagnosis. It classifies exposure, prompts one contradiction, and identifies the next admissible action.
          </p>

          {!result ? (
            <div className="mt-8 space-y-6">
              {/* Decision statement */}
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

              {/* Delay cost band */}
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

              {/* Confidence */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Confidence in current path</label>
                  <span style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.50)" }}>{input.confidenceLevel}/10</span>
                </div>
                <input type="range" min={0} max={10} step={1} value={input.confidenceLevel} onChange={(e) => setInput((p) => ({ ...p, confidenceLevel: parseInt(e.target.value) }))} className="w-full" style={{ accentColor: GOLD }} />
              </div>

              {/* Consequence if wrong */}
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

              {/* Urgency */}
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
              {/* Exposure band */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Exposure Signal</span>
                  <div style={{ ...serif, fontSize: "2.5rem", color: bandColor }}>{result.exposureBand}</div>
                </div>
              </div>

              {/* Contradiction prompt */}
              <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Contradiction prompt</span>
                <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.70)", marginTop: "0.5rem" }}>{result.contradictionPrompt}</p>
              </div>

              {/* Next action */}
              <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Next admissible action</span>
                <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>{result.nextAction}</p>
              </div>

              {/* Earned escalation */}
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>Earned escalation</span>
                <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>{result.earnedEscalation}</p>
              </div>

              {/* Save + next steps */}
              <div className="space-y-3">
                {!saved && (
                  <button onClick={handleSave} style={{ width: "100%", padding: "12px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.50)", ...mono, fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
                    Save to decision memory
                  </button>
                )}
                {saved && <p style={{ ...mono, fontSize: "7px", color: "rgba(110,231,183,0.50)", textAlign: "center" }}>Saved to decision record.</p>}

                {result.exposureBand !== "LOW" && (
                  <Link href={result.exposureBand === "CRITICAL" ? "/diagnostics/executive-reporting" : "/decision-instruments/decision-exposure-instrument"} className="flex items-center justify-between w-full" style={{ padding: "14px 18px", border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
                    {result.exposureBand === "CRITICAL" ? "Enter Executive Reporting" : "Run Decision Exposure Instrument"}
                    <ArrowRight style={{ width: 11, height: 11 }} />
                  </Link>
                )}

                <Link href="/diagnostics/fast" className="flex items-center justify-between w-full" style={{ padding: "10px 18px", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
                  Run full diagnostic instead
                  <ArrowRight style={{ width: 10, height: 10 }} />
                </Link>
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

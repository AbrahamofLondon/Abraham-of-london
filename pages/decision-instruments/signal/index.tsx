/**
 * Decision Signal — free governed first reading (flagship-entry instrument).
 *
 * A real, input-sensitive first measurement with a clear boundary. Computation lives in
 * lib/decision-instruments/decision-signal-engine (deterministic + tested). Two explicit
 * modes (§5): "Try the instrument" (your input → real computed result) and "View an
 * example" (a clearly-labelled synthetic scenario). The result shows the corridor: what
 * the system sees, the next admissible move AND what is not yet admissible + why (§9).
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";
import {
  runDecisionSignal,
  type SignalInput,
  type SignalResult,
} from "@/lib/decision-instruments/decision-signal-engine";
import { DECISION_SIGNAL_SAMPLES, SAMPLE_LABEL } from "@/lib/decision-instruments/decision-signal-samples";

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const EMERALD = "#6EE7B7";
const ROSE = "#FCA5A5";
const VOID = "rgb(3 3 5)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const DEFAULT_INPUT: SignalInput = { decisionStatement: "", delayCostBand: "MODERATE", confidenceLevel: 5, consequenceIfWrong: "COSTLY", urgencyBand: "MODERATE" };

const DecisionSignalPage: NextPage = () => {
  const [mode, setMode] = React.useState<"try" | "example">("try");
  const [input, setInput] = React.useState<SignalInput>(DEFAULT_INPUT);
  const [result, setResult] = React.useState<SignalResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isExample, setIsExample] = React.useState(false);
  const startedRef = React.useRef(false);

  React.useEffect(() => { track("decision_signal_landing_viewed", {}); }, []);

  function markStarted() {
    if (!startedRef.current) { startedRef.current = true; track("decision_signal_started", {}); }
  }

  function handleSubmit() {
    const outcome = runDecisionSignal(input);
    if (!outcome.ok) { setError(outcome.message); setResult(null); return; }
    setError(null);
    setIsExample(false);
    setResult(outcome.result);
    track("decision_signal_completed", { pressureBand: outcome.result.pressureBand, mode: "try" });
    track("decision_signal_result_viewed", { pressureBand: outcome.result.pressureBand });
  }

  function loadExample(sampleId: string) {
    const sample = DECISION_SIGNAL_SAMPLES.find((s) => s.id === sampleId);
    if (!sample) return;
    const outcome = runDecisionSignal(sample.input);
    if (!outcome.ok) return;
    setInput(sample.input);
    setResult(outcome.result);
    setIsExample(true);
    setError(null);
    track("decision_signal_example_viewed", { sampleId, pressureBand: outcome.result.pressureBand });
  }

  function reset() { setResult(null); setError(null); setIsExample(false); setInput(DEFAULT_INPUT); startedRef.current = false; }

  const band = result?.pressureBand;
  const bandColor = band === "CRITICAL" ? "rgba(252,165,165,0.75)" : band === "HIGH" ? "rgba(253,186,116,0.75)" : band === "MODERATE" ? `${GOLD}CC` : "rgba(110,231,183,0.65)";

  return (
    <Layout title="Decision Signal | Abraham of London" description="Free governed first reading — detect whether a decision condition exists. Classifies pressure, names one signal, surfaces contradictions, and identifies the next admissible move.">
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
            A first signal, not a full diagnosis. It classifies pressure, names one signal, surfaces any contradiction in what you told us, and identifies the next admissible action. No account required.
          </p>

          {/* Mode toggle (§5) */}
          {!result && (
            <div className="mt-6 flex gap-2">
              {(["try", "example"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(null); }} style={{ padding: "8px 14px", border: `1px solid ${mode === m ? `${GOLD}60` : "rgba(255,255,255,0.10)"}`, backgroundColor: mode === m ? `${GOLD}10` : "transparent", color: mode === m ? `${GOLD}CC` : "rgba(255,255,255,0.4)", ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}>
                  {m === "try" ? "Try the instrument" : "View an example"}
                </button>
              ))}
            </div>
          )}

          {/* Example picker */}
          {!result && mode === "example" && (
            <div className="mt-6 space-y-2">
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: `${AMBER}88` }}>{SAMPLE_LABEL}</p>
              {DECISION_SIGNAL_SAMPLES.map((s) => (
                <button key={s.id} onClick={() => loadExample(s.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "0.85rem" }}>
                  {s.title} <ArrowRight style={{ width: 10, height: 10, display: "inline" }} />
                </button>
              ))}
            </div>
          )}

          {!result && mode === "try" ? (
            <div className="mt-8 space-y-6">
              <div>
                <label style={labelStyle}>What decision is being delayed or avoided?</label>
                <textarea
                  value={input.decisionStatement}
                  onFocus={markStarted}
                  onChange={(e) => setInput((p) => ({ ...p, decisionStatement: e.target.value }))}
                  placeholder="Describe the decision in one or two sentences..."
                  rows={3}
                  className="mt-2 w-full resize-none rounded-none border border-white/10 bg-white/5 p-3 text-sm text-white/70 placeholder:text-white/20 focus:border-amber-500/40 focus:outline-none"
                />
              </div>

              <BandPicker label="Estimated cost of delay" options={["LOW", "MODERATE", "HIGH", "CRITICAL"]} value={input.delayCostBand} onPick={(v) => { markStarted(); setInput((p) => ({ ...p, delayCostBand: v as SignalInput["delayCostBand"] })); }} />

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <label style={labelStyle}>Confidence in current path</label>
                  <span style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.50)" }}>{input.confidenceLevel}/10</span>
                </div>
                <input type="range" min={0} max={10} step={1} value={input.confidenceLevel} onChange={(e) => { markStarted(); setInput((p) => ({ ...p, confidenceLevel: parseInt(e.target.value) })); }} className="w-full" style={{ accentColor: GOLD }} />
              </div>

              <BandPicker label="Consequence if the decision is wrong" options={["REVERSIBLE", "COSTLY", "STRUCTURAL", "IRREVERSIBLE"]} value={input.consequenceIfWrong} onPick={(v) => { markStarted(); setInput((p) => ({ ...p, consequenceIfWrong: v as SignalInput["consequenceIfWrong"] })); }} small />

              <BandPicker label="Urgency" options={["LOW", "MODERATE", "HIGH", "IMMEDIATE"]} value={input.urgencyBand} onPick={(v) => { markStarted(); setInput((p) => ({ ...p, urgencyBand: v as SignalInput["urgencyBand"] })); }} />

              {error && <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.05em", color: ROSE, lineHeight: 1.6 }}>{error}</p>}

              <button onClick={handleSubmit} style={{ width: "100%", padding: "16px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
                Generate signal
              </button>
            </div>
          ) : result ? (
            <div className="mt-8 space-y-6">
              {isExample && (
                <div style={{ border: `1px solid ${AMBER}40`, backgroundColor: `${AMBER}08`, padding: "0.75rem" }}>
                  <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${AMBER}` }}>{SAMPLE_LABEL}</span>
                </div>
              )}

              <div className="flex items-baseline justify-between">
                <div>
                  <span style={captionStyle}>Decision pressure band</span>
                  <div style={{ ...serif, fontSize: "2.5rem", color: bandColor }}>{result.pressureBand}</div>
                </div>
                <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.3)" }}>score {result.compositeScore} · {result.evidenceConfidence} confidence</span>
              </div>

              <ResultCard caption="Named signal" body={result.namedSignal} borderColor="rgba(255,255,255,0.08)" />
              <ResultCard caption="Consequence warning" body={result.consequenceWarning} borderColor={`${AMBER}20`} bg={`${AMBER}04`} captionColor={`${AMBER}77`} />

              {result.contradictions.length > 0 && (
                <div style={{ border: `1px solid ${ROSE}30`, backgroundColor: `${ROSE}06`, padding: "1rem" }}>
                  <span style={{ ...captionStyle, color: ROSE }}>Contradiction detected</span>
                  {result.contradictions.map((c) => (
                    <p key={c.key} style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "rgba(255,255,255,0.62)", marginTop: "0.4rem" }}>{c.detail}</p>
                  ))}
                </div>
              )}

              <ResultCard caption="Evidence gap" body={result.evidenceGap} borderColor="rgba(255,255,255,0.08)" />
              <ResultCard caption="Immediate correction question" body={result.correctionQuestion} borderColor={`${GOLD}20`} bg={`${GOLD}04`} captionColor={`${GOLD}55`} serifBody />

              {/* Next admissible move + WHY (§9) */}
              <div style={{ border: `1px solid ${EMERALD}20`, backgroundColor: `${EMERALD}04`, padding: "1rem" }}>
                <span style={{ ...captionStyle, color: `${EMERALD}88` }}>Next admissible move</span>
                <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.66)", marginTop: "0.35rem" }}>{result.nextAdmissibleMove.move}</p>
                <p style={{ fontSize: "0.8rem", lineHeight: 1.6, color: "rgba(255,255,255,0.42)", marginTop: "0.5rem" }}>
                  <strong style={{ color: `${EMERALD}88` }}>Why this is admissible:</strong> {result.nextAdmissibleMove.whyAdmissible}
                </p>
                {!isExample && result.nextAdmissibleMove.targetRoute !== "/decision-instruments/signal" && (
                  <div className="mt-3">
                    <Link href={result.nextAdmissibleMove.targetRoute} onClick={() => track("decision_signal_next_move_clicked", { pressureBand: result.pressureBand, target: result.nextAdmissibleMove.targetRoute })} className="inline-flex items-center gap-1" style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, textDecoration: "underline", textUnderlineOffset: 3 }}>
                      {result.nextAdmissibleMove.targetLabel} <ArrowRight style={{ width: 9, height: 9 }} />
                    </Link>
                  </div>
                )}
              </div>

              {/* What is NOT yet admissible (§9 — willingness not to up-sell) */}
              {result.notYetAdmissible && (
                <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
                  <span style={captionStyle}>Not yet appropriate</span>
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.5)", marginTop: "0.35rem" }}>
                    <strong style={{ color: "rgba(255,255,255,0.62)" }}>{result.notYetAdmissible.move}</strong> — {result.notYetAdmissible.whyNotYet}
                  </p>
                </div>
              )}

              {/* Governed continuation to Operator Pilot for material live decisions */}
              <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Lock style={{ width: 12, height: 12, color: GOLD }} />
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}88` }}>For a live, material decision</span>
                </div>
                <p className="text-sm leading-7 text-white/50">
                  This signal is a first reading held in your browser only — nothing is written to a customer record. For a live decision with real stakeholders and checkpoints, the controlled path is the Operator Pilot.
                </p>
                <div className="mt-3">
                  <Link href="/engagements/operator-pilot" onClick={() => track("decision_signal_pilot_clicked", { pressureBand: result.pressureBand })} className="inline-flex items-center gap-1" style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, textDecoration: "underline", textUnderlineOffset: 3 }}>
                    Operator Pilot — controlled qualification <ArrowRight style={{ width: 9, height: 9 }} />
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={reset} style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}>← Run another signal</button>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.18)" }}>{result.evidencePosture}</span>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </Layout>
  );
};

const labelStyle: React.CSSProperties = { ...mono, fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" };
const captionStyle: React.CSSProperties = { ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" };

function BandPicker({ label, options, value, onPick, small }: { label: string; options: readonly string[]; value: string; onPick: (v: string) => void; small?: boolean }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onPick(o)} style={{ padding: "8px", border: `1px solid ${value === o ? `${GOLD}60` : "rgba(255,255,255,0.08)"}`, backgroundColor: value === o ? `${GOLD}10` : "transparent", color: value === o ? `${GOLD}CC` : "rgba(255,255,255,0.35)", ...mono, fontSize: small ? "7px" : "8px", letterSpacing: small ? "0.10em" : "0.12em", cursor: "pointer" }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ caption, body, borderColor, bg, captionColor, serifBody }: { caption: string; body: string; borderColor: string; bg?: string; captionColor?: string; serifBody?: boolean }) {
  return (
    <div style={{ border: `1px solid ${borderColor}`, backgroundColor: bg ?? "rgba(255,255,255,0.02)", padding: "1rem" }}>
      <span style={{ ...captionStyle, color: captionColor ?? "rgba(255,255,255,0.25)" }}>{caption}</span>
      <p style={{ ...(serifBody ? serif : {}), fontSize: serifBody ? "1.05rem" : "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.62)", marginTop: "0.3rem" }}>{body}</p>
    </div>
  );
}

export default DecisionSignalPage;

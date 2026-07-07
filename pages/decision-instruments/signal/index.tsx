/**
 * Decision Signal — free governed FIRST DIAGNOSIS (flagship-entry instrument).
 *
 * Enterprise-grade presentation of a real, input-sensitive governed reading. Computation
 * lives in lib/decision-instruments/decision-signal-engine (deterministic + tested). Two
 * honest modes: "Try the instrument" and a clearly-labelled "Example". The result reads
 * as a governed diagnosis: pressure verdict, the reading, any contradiction, the evidence
 * gap, and the corridor — the next admissible move AND what is deliberately not yet
 * appropriate. Design tokens: lib/demo/journey-design.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";
import {
  runDecisionSignal,
  SIGNAL_ENGINE_VERSION,
  type SignalInput,
  type SignalResult,
} from "@/lib/decision-instruments/decision-signal-engine";
import { DECISION_SIGNAL_SAMPLES, SAMPLE_LABEL } from "@/lib/decision-instruments/decision-signal-samples";
import { COLORS, FONTS, BAND, eyebrow, caption, display, bodyText, bodyTextSm, card, primaryButton, ghostButton, field, hexA } from "@/lib/demo/journey-design";

const DEFAULT_INPUT: SignalInput = { decisionStatement: "", delayCostBand: "MODERATE", confidenceLevel: 5, consequenceIfWrong: "COSTLY", urgencyBand: "MODERATE" };

const VERDICT: Record<SignalResult["pressureBand"], string> = {
  LOW: "A decision condition exists, but the evidence does not yet justify intervention.",
  MODERATE: "A real decision is forming. Acting deliberately now is cheaper than reacting later.",
  HIGH: "This decision is approaching a threshold where the cost of delay compounds.",
  CRITICAL: "This decision appears overdue. Delay is likely compounding and should be treated as active risk.",
};

const DecisionSignalPage: NextPage = () => {
  const [mode, setMode] = React.useState<"try" | "example">("try");
  const [input, setInput] = React.useState<SignalInput>(DEFAULT_INPUT);
  const [result, setResult] = React.useState<SignalResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isExample, setIsExample] = React.useState(false);
  const started = React.useRef(false);

  React.useEffect(() => { track("decision_signal_landing_viewed", {}); }, []);
  function markStarted() { if (!started.current) { started.current = true; track("decision_signal_started", {}); } }

  function submit() {
    const outcome = runDecisionSignal(input);
    if (!outcome.ok) { setError(outcome.message); setResult(null); return; }
    setError(null); setIsExample(false); setResult(outcome.result);
    track("decision_signal_completed", { pressureBand: outcome.result.pressureBand });
    track("decision_signal_result_viewed", { pressureBand: outcome.result.pressureBand });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function loadExample(id: string) {
    const s = DECISION_SIGNAL_SAMPLES.find((x) => x.id === id); if (!s) return;
    const outcome = runDecisionSignal(s.input); if (!outcome.ok) return;
    setInput(s.input); setResult(outcome.result); setIsExample(true); setError(null);
    track("decision_signal_example_viewed", { sampleId: id, pressureBand: outcome.result.pressureBand });
  }
  function reset() { setResult(null); setError(null); setIsExample(false); setInput(DEFAULT_INPUT); started.current = false; }

  const band = result ? BAND[result.pressureBand] : null;

  return (
    <Layout title="Decision Signal — governed first diagnosis | Abraham of London" description="A free, governed first diagnosis of a decision under pressure. Classifies pressure, surfaces contradictions in your own inputs, names the evidence gap, and shows the next admissible move.">
      <Head><meta name="robots" content="index,follow" /></Head>
      <main style={{ background: COLORS.canvas, minHeight: "100vh", padding: "72px 24px 120px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* ── Masthead ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldCheck style={{ width: 15, height: 15, color: COLORS.gold }} />
            <span style={eyebrow()}>Decision Signal · Governed diagnosis · Free · 2 min</span>
          </div>
          <h1 style={{ ...display, fontSize: "clamp(2.2rem, 5vw, 3.1rem)", marginTop: 18 }}>
            A first diagnosis of the decision<br />you are carrying.
          </h1>
          <p style={{ ...bodyText, marginTop: 16, maxWidth: 560 }}>
            Not a lead form and not a generic AI answer. A governed reading that classifies decision pressure,
            surfaces contradictions implied by your own inputs, names the single most material evidence gap, and
            shows the next admissible move — including what is <em>not</em> yet worth doing. No account required.
          </p>

          {!result && (
            <div style={{ display: "flex", gap: 8, marginTop: 28 }}>
              {(["try", "example"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(null); }}
                  style={{ ...ghostButton(), borderColor: mode === m ? COLORS.gold : COLORS.hairStrong, color: mode === m ? COLORS.gold : COLORS.body, background: mode === m ? hexA(COLORS.gold, 0.08) : "transparent" }}>
                  {m === "try" ? "Try the instrument" : "View an example"}
                </button>
              ))}
            </div>
          )}

          {/* ── Example picker ── */}
          {!result && mode === "example" && (
            <div style={{ marginTop: 24 }}>
              <div style={{ ...eyebrow(hexA(COLORS.amber, 0.9)), display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <AlertTriangle style={{ width: 12, height: 12 }} /> {SAMPLE_LABEL}
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {DECISION_SIGNAL_SAMPLES.map((s) => (
                  <button key={s.id} onClick={() => loadExample(s.id)} style={{ ...card(), textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", ...bodyTextSm, color: COLORS.body }}>
                    <span>{s.title}</span><ArrowRight style={{ width: 14, height: 14, color: COLORS.gold }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input form ── */}
          {!result && mode === "try" && (
            <div style={{ marginTop: 32, display: "grid", gap: 26 }}>
              <Field label="What decision is being delayed or avoided?">
                <textarea value={input.decisionStatement} onFocus={markStarted}
                  onChange={(e) => setInput((p) => ({ ...p, decisionStatement: e.target.value }))}
                  placeholder="Describe the decision in one or two sentences — the more specific, the sharper the reading."
                  rows={3} style={{ ...field(), resize: "none" }} />
              </Field>
              <Segmented label="Estimated cost of delay" options={["LOW", "MODERATE", "HIGH", "CRITICAL"]} value={input.delayCostBand}
                onPick={(v) => { markStarted(); setInput((p) => ({ ...p, delayCostBand: v as SignalInput["delayCostBand"] })); }} />
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label style={caption(COLORS.muted)}>Confidence in the current path</label>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 14, color: COLORS.gold }}>{input.confidenceLevel}/10</span>
                </div>
                <input type="range" min={0} max={10} value={input.confidenceLevel}
                  onChange={(e) => { markStarted(); setInput((p) => ({ ...p, confidenceLevel: parseInt(e.target.value) })); }}
                  style={{ width: "100%", marginTop: 12, accentColor: COLORS.gold }} />
              </div>
              <Segmented label="Consequence if the decision is wrong" options={["REVERSIBLE", "COSTLY", "STRUCTURAL", "IRREVERSIBLE"]} value={input.consequenceIfWrong}
                onPick={(v) => { markStarted(); setInput((p) => ({ ...p, consequenceIfWrong: v as SignalInput["consequenceIfWrong"] })); }} small />
              <Segmented label="Urgency" options={["LOW", "MODERATE", "HIGH", "IMMEDIATE"]} value={input.urgencyBand}
                onPick={(v) => { markStarted(); setInput((p) => ({ ...p, urgencyBand: v as SignalInput["urgencyBand"] })); }} />
              {error && <p style={{ fontFamily: FONTS.sans, fontSize: 13.5, lineHeight: 1.6, color: COLORS.rose }}>{error}</p>}
              <button onClick={submit} style={{ ...primaryButton(), width: "100%" }}>Generate governed diagnosis</button>
            </div>
          )}

          {/* ── Result: the governed diagnosis ── */}
          {result && band && (
            <div style={{ marginTop: 40, display: "grid", gap: 22 }}>
              {isExample && (
                <div style={{ ...card(COLORS.amber), padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle style={{ width: 13, height: 13, color: COLORS.amber }} />
                  <span style={{ ...eyebrow(COLORS.amber), fontSize: 10.5 }}>{SAMPLE_LABEL}</span>
                </div>
              )}

              {/* Diagnosis masthead */}
              <div style={{ borderBottom: `1px solid ${COLORS.hair}`, paddingBottom: 24 }}>
                <span style={caption()}>Decision pressure — governed reading</span>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
                  <div style={{ ...display, fontSize: "clamp(2.6rem, 7vw, 4rem)", color: band.color }}>{band.label}</div>
                  <div style={{ textAlign: "right", fontFamily: FONTS.mono, fontSize: 11, color: COLORS.faint, lineHeight: 1.8 }}>
                    <div>PRESSURE INDEX &nbsp;<span style={{ color: COLORS.body }}>{result.compositeScore}</span></div>
                    <div>EVIDENCE &nbsp;<span style={{ color: COLORS.body }}>{result.evidenceConfidence}</span></div>
                    <div>ENGINE v{SIGNAL_ENGINE_VERSION}</div>
                  </div>
                </div>
                <p style={{ ...display, fontSize: "1.5rem", color: COLORS.ink, marginTop: 16, lineHeight: 1.4 }}>{VERDICT[result.pressureBand]}</p>
              </div>

              {/* The reading */}
              <section>
                <span style={caption()}>The reading</span>
                <p style={{ ...bodyText, marginTop: 8 }}>{result.namedSignal}</p>
                <p style={{ ...bodyText, marginTop: 10, color: COLORS.muted }}>{result.consequenceWarning}</p>
              </section>

              {/* Contradiction — the differentiator */}
              {result.contradictions.length > 0 && (
                <div style={card(COLORS.rose)}>
                  <div style={{ ...caption(COLORS.rose), display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle style={{ width: 13, height: 13 }} /> Contradiction in your own inputs
                  </div>
                  {result.contradictions.map((c) => (
                    <p key={c.key} style={{ ...bodyText, marginTop: 10 }}>{c.detail}</p>
                  ))}
                </div>
              )}

              {/* Evidence gap + correction */}
              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr" }}>
                <div style={card()}>
                  <span style={caption()}>Evidence gap</span>
                  <p style={{ ...bodyTextSm, marginTop: 8, color: COLORS.body }}>{result.evidenceGap}</p>
                </div>
                <div style={card(COLORS.gold)}>
                  <span style={caption(COLORS.goldSoft)}>The question to resolve first</span>
                  <p style={{ ...display, fontSize: "1.25rem", color: COLORS.ink, marginTop: 8, lineHeight: 1.45 }}>{result.correctionQuestion}</p>
                </div>
              </div>

              {/* Corridor — next admissible move + not yet */}
              <div style={{ ...card(COLORS.emerald) }}>
                <span style={caption(hexA(COLORS.emerald, 0.9))}>Next admissible move</span>
                <p style={{ ...bodyText, marginTop: 8, color: COLORS.ink }}>{result.nextAdmissibleMove.move}</p>
                <p style={{ ...bodyTextSm, marginTop: 10 }}><strong style={{ color: hexA(COLORS.emerald, 0.95) }}>Why this is admissible — </strong>{result.nextAdmissibleMove.whyAdmissible}</p>
                {!isExample && result.nextAdmissibleMove.targetRoute !== "/decision-instruments/signal" && (
                  <Link href={result.nextAdmissibleMove.targetRoute} onClick={() => track("decision_signal_next_move_clicked", { pressureBand: result.pressureBand, target: result.nextAdmissibleMove.targetRoute })}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.emerald, textDecoration: "none" }}>
                    {result.nextAdmissibleMove.targetLabel} <ArrowRight style={{ width: 12, height: 12 }} />
                  </Link>
                )}
              </div>

              {result.notYetAdmissible && (
                <div style={card()}>
                  <span style={caption()}>Deliberately not yet appropriate</span>
                  <p style={{ ...bodyTextSm, marginTop: 8 }}><strong style={{ color: COLORS.body }}>{result.notYetAdmissible.move}.</strong> {result.notYetAdmissible.whyNotYet}</p>
                </div>
              )}

              {/* Operator Pilot continuation */}
              <div style={{ ...card(COLORS.gold), display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={eyebrow()}>For a live, material decision</span>
                <p style={bodyTextSm}>
                  This diagnosis is held in your browser only — nothing is written to a customer record. For a live decision
                  with real stakeholders and checkpoints, the controlled path is the Operator Pilot: a governed engagement,
                  qualified by a human before anything is accepted.
                </p>
                <Link href="/engagements/operator-pilot" onClick={() => track("decision_signal_pilot_clicked", { pressureBand: result.pressureBand })}
                  style={{ ...primaryButton(), textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
                  Enter the Operator Pilot <ArrowRight style={{ width: 13, height: 13 }} />
                </Link>
              </div>

              {/* Governance footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${COLORS.hair}`, paddingTop: 16, flexWrap: "wrap", gap: 12 }}>
                <button onClick={reset} style={{ ...ghostButton(), padding: "10px 16px" }}>← Run another diagnosis</button>
                <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.faint, letterSpacing: "0.08em" }}>{result.evidencePosture}</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label style={caption(COLORS.muted)}>{label}</label>{children}</div>);
}

function Segmented({ label, options, value, onPick, small }: { label: string; options: readonly string[]; value: string; onPick: (v: string) => void; small?: boolean }) {
  return (
    <div>
      <label style={caption(COLORS.muted)}>{label}</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 12 }}>
        {options.map((o) => {
          const active = value === o;
          return (
            <button key={o} onClick={() => onPick(o)}
              style={{ padding: "11px 6px", border: `1px solid ${active ? COLORS.gold : COLORS.hair}`, background: active ? hexA(COLORS.gold, 0.1) : "transparent", color: active ? COLORS.gold : COLORS.muted, fontFamily: FONTS.mono, fontSize: small ? 9.5 : 10.5, letterSpacing: "0.08em", cursor: "pointer", borderRadius: 4 }}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DecisionSignalPage;

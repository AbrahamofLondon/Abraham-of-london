/**
 * Fast Diagnostic — 3-minute decision interrogation.
 *
 * Not a survey. Decision confrontation.
 *
 * FLOW: ENTRY → Q1 → Q2 → Q3 → (CONTRADICTION INTERRUPT) → Q4 → Q5 → Q6 → RESULT
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";
import { composeResult, type DiagnosticResult } from "@/lib/diagnostics/output-composer";
import { selectScenario } from "@/lib/diagnostics/scenario-selector";
import { evaluateBehaviour } from "@/lib/diagnostics/behaviour-map";
import type { ScenarioDefinition } from "@/lib/diagnostics/scenarios";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type Stage = "entry" | "q1" | "q2" | "q3" | "interrupt" | "q4" | "q5" | "q6" | "result" | "scenario" | "final";

const FastDiagnosticPage: NextPage = () => {
  const [stage, setStage] = React.useState<Stage>("entry");
  const [decisionText, setDecisionText] = React.useState("");
  const [urgency, setUrgency] = React.useState(0);
  const [ownership, setOwnership] = React.useState(0);
  const [decisionState, setDecisionState] = React.useState(0);
  const [clarity, setClarity] = React.useState(0);
  const [accountability, setAccountability] = React.useState(0);
  const [scenarioChoice, setScenarioChoice] = React.useState("");
  const startTime = React.useRef(0);

  React.useEffect(() => {
    track("fast_diagnostic_page_view");
  }, []);

  // Keyboard navigation
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const key = e.key;
      if (["1", "2", "3", "4"].includes(key)) {
        const val = Number(key);
        if (stage === "q2") { setUrgency(val); setTimeout(() => advance("q2", val), 300); }
        if (stage === "q3") { setOwnership(val); setTimeout(() => advance("q3", val), 300); }
        if (stage === "q4") { setDecisionState(val); setTimeout(() => advance("q4", val), 300); }
        if (stage === "q5") { setClarity(val); setTimeout(() => advance("q5", val), 300); }
        if (stage === "q6") { setAccountability(val); setTimeout(() => advance("q6", val), 300); }
      }
      if (key === "Enter") {
        if (stage === "entry") startDiagnostic();
        if (stage === "q1" && decisionText.length >= 10) setStage("q2");
        if (stage === "interrupt") setStage("q4");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  function startDiagnostic() {
    startTime.current = Date.now();
    track("fast_diagnostic_started");
    setStage("q1");
  }

  function advance(from: Stage, value?: number) {
    if (from === "q2") {
      setStage("q3");
    } else if (from === "q3") {
      // Check contradiction interrupt
      const urg = urgency || 0;
      const own = value ?? ownership;
      if (urg >= 3 && own >= 3) {
        setStage("interrupt");
      } else {
        setStage("q4");
      }
    } else if (from === "q4") {
      setStage("q5");
    } else if (from === "q5") {
      setStage("q6");
    } else if (from === "q6") {
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      track("fast_diagnostic_completed", { elapsed_seconds: elapsed });
      setStage("result");
    }
  }

  // ─── COMPOSED RESULT (deterministic, from signal dictionary) ───
  const composedResult: DiagnosticResult | null = React.useMemo(() => {
    if (stage !== "result" && stage !== "scenario" && stage !== "final") return null;
    return composeResult({
      urgency,
      ownershipScore: ownership,
      stateScore: decisionState,
      clarityScore: clarity,
      accountabilityScore: accountability,
    });
  }, [urgency, ownership, decisionState, clarity, accountability, stage]);

  const activeScenario: ScenarioDefinition | null = React.useMemo(() => {
    if (!composedResult) return null;
    return selectScenario(composedResult.signal.key);
  }, [composedResult]);

  // All language now comes from the signal dictionary — no inline strings
  const sig = composedResult?.signal;

  const urgencyLabel = ["", "No immediate consequence", "Minor disruption", "Noticeable impact", "Material consequence"][urgency] ?? "";
  const ownershipLabel = ["", "Clearly defined", "Likely known", "Unclear", "No one"][ownership] ?? "";
  const stateLabel = ["", "Actively progressed", "Being discussed", "Deferred repeatedly", "Avoided"][decisionState] ?? "";
  const clarityLabel = ["", "Fully defined", "Mostly clear", "Partially defined", "Unclear"][clarity] ?? "";
  const accountabilityLabel = ["", "Explicitly defined", "Likely known", "Shared", "No one"][accountability] ?? "";

  // ─── OPTION BUTTON ───
  function OptionButton({ label, value, selected, onSelect }: { label: string; value: number; selected: boolean; onSelect: () => void }) {
    return (
      <button
        type="button"
        onClick={onSelect}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "14px 18px",
          border: `1px solid ${selected ? `${GOLD}60` : "rgba(255,255,255,0.08)"}`,
          backgroundColor: selected ? `${GOLD}10` : "transparent",
          color: selected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.50)",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "0.92rem",
          lineHeight: 1.6,
          cursor: "pointer",
          transition: "all 150ms",
        }}
      >
        <span style={{ ...mono, fontSize: "8px", color: `${GOLD}80`, marginRight: "0.75rem" }}>{value}</span>
        {label}
      </button>
    );
  }

  // ─── ENTRY ───
  if (stage === "entry") {
    return (
      <Layout title="Decision Check" description="3-minute decision interrogation.">
        <Head><meta name="robots" content="noindex" /></Head>
        <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <div className="max-w-lg text-center">
            <h1 style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 400, color: "rgba(255,255,255,0.88)", lineHeight: 1.3 }}>
              When the decision cannot wait.
            </h1>
            <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.75, color: "rgba(255,255,255,0.40)", marginTop: "1.25rem", maxWidth: "42ch", marginLeft: "auto", marginRight: "auto" }}>
              This takes 3 minutes. It will identify the contradiction in how this decision is being handled, and show what happens if nothing changes.
            </p>
            <button
              type="button"
              onClick={startDiagnostic}
              style={{ marginTop: "2rem", padding: "14px 28px", border: `1px solid ${GOLD}60`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Start decision check <ArrowRight style={{ width: 11, height: 11, display: "inline", marginLeft: "0.5rem", verticalAlign: "middle" }} />
            </button>
          </div>
        </main>
      </Layout>
    );
  }

  // ─── Q1: DECISION ANCHOR ───
  if (stage === "q1") {
    return (
      <Shell progress={1}>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.80)" }}>
          What decision are you currently delaying or unable to resolve?
        </p>
        <textarea
          value={decisionText}
          onChange={(e) => setDecisionText(e.target.value.slice(0, 200))}
          placeholder="One sentence. Be specific."
          rows={3}
          style={{ width: "100%", marginTop: "1.25rem", padding: "14px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.80)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.6, resize: "none", outline: "none" }}
          autoFocus
        />
        <div className="flex items-center justify-between mt-2">
          <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.15)" }}>{decisionText.length}/200</span>
          <button
            type="button"
            onClick={() => { if (decisionText.length >= 10) setStage("q2"); }}
            disabled={decisionText.length < 10}
            style={{ padding: "10px 20px", border: `1px solid ${decisionText.length >= 10 ? `${GOLD}60` : "rgba(255,255,255,0.06)"}`, backgroundColor: decisionText.length >= 10 ? `${GOLD}10` : "transparent", color: decisionText.length >= 10 ? `${GOLD}CC` : "rgba(255,255,255,0.15)", ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: decisionText.length >= 10 ? "pointer" : "default" }}
          >
            Next
          </button>
        </div>
      </Shell>
    );
  }

  // ─── Q2: URGENCY ───
  if (stage === "q2") {
    return (
      <Shell progress={2}>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.80)" }}>
          If this decision remains unresolved for 7 days, what happens?
        </p>
        <div className="mt-5 space-y-2">
          {["No immediate consequence", "Minor disruption", "Noticeable impact", "Material consequence"].map((label, i) => (
            <OptionButton key={i} label={label} value={i + 1} selected={urgency === i + 1} onSelect={() => { setUrgency(i + 1); setTimeout(() => advance("q2", i + 1), 300); }} />
          ))}
        </div>
      </Shell>
    );
  }

  // ─── Q3: OWNERSHIP ───
  if (stage === "q3") {
    return (
      <Shell progress={3}>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.80)" }}>
          Who can make this decision without further permission?
        </p>
        <div className="mt-5 space-y-2">
          {["Clearly defined", "Likely known", "Unclear", "No one"].map((label, i) => (
            <OptionButton key={i} label={label} value={i + 1} selected={ownership === i + 1} onSelect={() => { setOwnership(i + 1); setTimeout(() => advance("q3", i + 1), 300); }} />
          ))}
        </div>
      </Shell>
    );
  }

  // ─── CONTRADICTION INTERRUPT ───
  if (stage === "interrupt") {
    return (
      <Shell progress={3} hideProgress>
        <div style={{ border: "1px solid rgba(252,165,165,0.25)", backgroundColor: "rgba(252,165,165,0.04)", padding: "1.5rem" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(252,165,165,0.65)" }}>
            Your answers conflict
          </span>
          <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1rem", lineHeight: 1.75, color: "rgba(255,255,255,0.70)", marginTop: "0.75rem", maxWidth: "48ch" }}>
            High urgency with unclear ownership means the decision is likely to be made by whoever acts first — not by design.
          </p>
          <button
            type="button"
            onClick={() => setStage("q4")}
            style={{ marginTop: "1.25rem", padding: "10px 20px", border: `1px solid rgba(252,165,165,0.35)`, backgroundColor: "rgba(252,165,165,0.06)", color: "rgba(252,165,165,0.70)", ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Continue
          </button>
        </div>
      </Shell>
    );
  }

  // ─── Q4: DECISION STATE ───
  if (stage === "q4") {
    return (
      <Shell progress={4}>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.80)" }}>
          What is actually happening with this decision right now?
        </p>
        <div className="mt-5 space-y-2">
          {["Actively being progressed", "Being discussed", "Deferred repeatedly", "Avoided"].map((label, i) => (
            <OptionButton key={i} label={label} value={i + 1} selected={decisionState === i + 1} onSelect={() => { setDecisionState(i + 1); setTimeout(() => advance("q4", i + 1), 300); }} />
          ))}
        </div>
      </Shell>
    );
  }

  // ─── Q5: CLARITY ───
  if (stage === "q5") {
    return (
      <Shell progress={5}>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.80)" }}>
          How clearly defined is the decision outcome?
        </p>
        <div className="mt-5 space-y-2">
          {["Fully defined", "Mostly clear", "Partially defined", "Unclear"].map((label, i) => (
            <OptionButton key={i} label={label} value={i + 1} selected={clarity === i + 1} onSelect={() => { setClarity(i + 1); setTimeout(() => advance("q5", i + 1), 300); }} />
          ))}
        </div>
      </Shell>
    );
  }

  // ─── Q6: ACCOUNTABILITY ───
  if (stage === "q6") {
    return (
      <Shell progress={6}>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.80)" }}>
          If this decision fails, who is accountable?
        </p>
        <div className="mt-5 space-y-2">
          {["Explicitly defined", "Likely known", "Shared", "No one"].map((label, i) => (
            <OptionButton key={i} label={label} value={i + 1} selected={accountability === i + 1} onSelect={() => { setAccountability(i + 1); setTimeout(() => advance("q6", i + 1), 300); }} />
          ))}
        </div>
      </Shell>
    );
  }

  // ─── RESULT ───
  const elapsed = startTime.current ? Math.round((Date.now() - startTime.current) / 1000) : 0;

  return (
    <Layout title="Decision Check — Result" description="Decision signal identified.">
      <Head><meta name="robots" content="noindex" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-xl">
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
            Decision check · {elapsed}s
          </span>

          {sig && (
            <>
              {/* 1. PRIMARY SIGNAL */}
              <div style={{ marginTop: "1.5rem" }}>
                <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}70` }}>Primary signal</span>
                <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.15rem", lineHeight: 1.55, color: "rgba(255,255,255,0.85)", marginTop: "0.35rem", maxWidth: "48ch" }}>{sig.primaryStatement}</p>
              </div>

              {/* 2. EVIDENCE */}
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem", marginTop: "1.25rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>You indicated</span>
                <div className="mt-2 space-y-1">
                  {[
                    { label: "Decision", value: decisionText },
                    { label: "Urgency", value: urgencyLabel },
                    { label: "Ownership", value: ownershipLabel },
                    { label: "State", value: stateLabel },
                    { label: "Clarity", value: clarityLabel },
                    { label: "Accountability", value: accountabilityLabel },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-3">
                      <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.20)", minWidth: "80px" }}>{item.label}</span>
                      <span style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. CONTRADICTION */}
              {composedResult?.contradiction && (
                <div style={{ border: "1px solid rgba(252,165,165,0.15)", backgroundColor: "rgba(252,165,165,0.03)", padding: "1rem", marginTop: "1rem" }}>
                  <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)" }}>Contradiction</span>
                  <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.2rem", maxWidth: "48ch" }}>{composedResult.contradiction}</p>
                </div>
              )}

              {/* 4. DECISION */}
              <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem", marginTop: "1rem" }}>
                <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}70` }}>The decision this surfaces</span>
                <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.75)", marginTop: "0.25rem", maxWidth: "48ch" }}>{sig.decisionStatement}</p>
              </div>

              {/* 5. ONE MOVE */}
              <div style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}03`, padding: "1rem", marginTop: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>One move — within 24 hours</span>
                <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.78)", marginTop: "0.2rem", maxWidth: "48ch" }}>{sig.moveStatement}</p>
              </div>

              {/* 6. IF UNCHANGED */}
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(252,165,165,0.40)", marginTop: "1rem", fontStyle: "italic", maxWidth: "48ch" }}>{sig.consequenceStatement}</p>

              {/* SCENARIO STRESS-TEST */}
              {activeScenario && stage === "result" && (
                <div style={{ border: "1px solid rgba(255,255,255,0.10)", padding: "1.25rem", marginTop: "1.5rem" }}>
                  <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Under pressure</span>
                  <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.70)", marginTop: "0.5rem", maxWidth: "48ch" }}>{activeScenario.prompt}</p>
                  <div className="mt-4 space-y-2">
                    {activeScenario.options.map((opt) => (
                      <button key={opt.id} type="button" onClick={() => { setScenarioChoice(opt.behaviourTag); setStage("final"); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "transparent", color: "rgba(255,255,255,0.55)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.6, cursor: "pointer" }}>
                        <span style={{ ...mono, fontSize: "8px", color: `${GOLD}80`, marginRight: "0.75rem" }}>{opt.id}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FINAL — after scenario */}
              {stage === "final" && scenarioChoice && (
                <div style={{ border: "1px solid rgba(253,186,116,0.18)", backgroundColor: "rgba(253,186,116,0.03)", padding: "1rem", marginTop: "1rem" }}>
                  <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.50)" }}>What this reveals</span>
                  <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", marginTop: "0.2rem", maxWidth: "48ch" }}>
                    {evaluateBehaviour(sig.key, scenarioChoice).message}
                  </p>
                </div>
              )}

              {/* 7. VALIDITY */}
              <p style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.15)", marginTop: "1rem" }}>{sig.boundaryStatement}</p>

              {/* 8. ESCALATION — only after scenario is complete or if no scenario */}
              {(stage === "final" || !activeScenario) && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem", marginTop: "1.5rem" }}>
                  <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.40)", maxWidth: "48ch" }}>
                    You have enough to act at a basic level. Escalation is only required if the consequence must be priced, defended, or enforced.
                  </p>
                  <Link href="/diagnostics/executive-reporting" className="inline-flex items-center gap-2 mt-4" style={{ padding: "12px 24px", border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
                    Escalate decision <ArrowRight style={{ width: 10, height: 10 }} />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

// ─── SHELL ───
function Shell({ children, progress, hideProgress }: { children: React.ReactNode; progress: number; hideProgress?: boolean }) {
  return (
    <Layout title="Decision Check" description="3-minute decision interrogation.">
      <Head><meta name="robots" content="noindex" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-xl">
          {!hideProgress && (
            <>
              <div className="flex items-center justify-between mb-4">
                <span style={{ ...{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase" as const, color: `${GOLD}70` }}>
                  Decision check
                </span>
                <span style={{ ...{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }, fontSize: "8px", color: "rgba(255,255,255,0.25)" }}>
                  {progress} / 6
                </span>
              </div>
              <div className="flex gap-1 mb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ flex: 1, height: "2px", backgroundColor: i <= progress ? `${GOLD}80` : "rgba(255,255,255,0.06)" }} />
                ))}
              </div>
            </>
          )}
          {children}
        </div>
      </main>
    </Layout>
  );
}

export default FastDiagnosticPage;

/**
 * Fast Diagnostic — Decision Pressure Design.
 *
 * Not a form. Not a quiz. Not a lead magnet.
 * A controlled demonstration that exposes one real decision failure
 * in under 2 minutes.
 *
 * Entry interrupt → 6 high-pressure questions → C3 gate (visible) →
 * contradiction interrupt (overlay) → result surface → conversion CTAs →
 * micro-conversion feedback.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Loader2, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";
import { createCaseObject, classifyCondition, inferContradiction } from "@/lib/decision/case-object";
import { scoreC3 } from "@/lib/decision/c3-fidelity-scorer";
import { synthesise, buildDeterministicOutput, type GovernedSynthesis, type SynthesisResult } from "@/lib/decision/synthesis-engine";
import { forecastDefaultPath, controlShiftSummary } from "@/lib/decision/default-path-forecast";
import { createSpine, type IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import { saveSpineToSession, persistSpineToDB } from "@/lib/decision/spine-persistence";
import { registerPressureLoopFromSpine } from "@/lib/follow-up/register-loop-client";

const GOLD = "#C9A96E";
const RED = "rgba(252,165,165,";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" };

type Stage = "entry" | "entry_response" | "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "pre_commitment" | "contradiction_interrupt" | "synthesising" | "recovery" | "result" | "feedback";

const QUESTIONS: Array<{ id: string; question: string; helper: string }> = [
  { id: "decision", question: "What decision are you unable to make right now?", helper: "Name the decision. Not the topic." },
  { id: "priorAttempt", question: "What have you already tried — and why did it fail?", helper: "If it worked, the decision would not still be open." },
  { id: "costOfDelay", question: "What becomes more expensive every week this stays unresolved?", helper: "If nothing is becoming expensive, this is not a real decision." },
  { id: "claimedOwner", question: "Who actually decides this? Do they know they own it?", helper: "Name the person or role. If no one owns it, say that." },
  { id: "blocker", question: "What is stopping this from being decided?", helper: "Not symptoms. The blocker." },
  { id: "forcedAction", question: "If you had to decide in 24 hours — what would you do?", helper: "No hedging. State the move." },
];

const FastDiagnosticPage: NextPage = () => {
  const [stage, setStage] = React.useState<Stage>("entry");
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = React.useState(0);
  const [synthesis, setSynthesis] = React.useState<GovernedSynthesis | null>(null);
  const [synthesisSource, setSynthesisSource] = React.useState<"llm" | "deterministic" | "recovery">("deterministic");
  const [recoveryQuestion, setRecoveryQuestion] = React.useState<string | null>(null);
  const [spine, setSpine] = React.useState<IntelligenceSpine | null>(null);
  const [arbiterMessage, setArbiterMessage] = React.useState<string | null>(null);
  const [entryDecision, setEntryDecision] = React.useState("");
  const [entryClassification, setEntryClassification] = React.useState("");
  const [contradictionText, setContradictionText] = React.useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = React.useState<"yes" | "partial" | "no" | null>(null);
  const [committed, setCommitted] = React.useState(false);
  const startTime = React.useRef(0);

  React.useEffect(() => { track("fast_diagnostic_page_view"); }, []);

  // ─── ENTRY INTERRUPT — single-field strike ───
  function handleEntrySubmit() {
    if (entryDecision.trim().length < 10) return;
    startTime.current = Date.now();
    track("fast_diagnostic_started", { entry_length: entryDecision.length });

    // Classify immediately
    const tempCase = createCaseObject({ id: "temp", decision: entryDecision });
    const condition = classifyCondition(tempCase);
    const labels: Record<string, string> = {
      authority: "an authority problem — who decides is unclear",
      definition: "a definition problem — what is being decided is unclear",
      execution: "an execution problem — the decision is known but avoided",
      instability: "an instability condition — untested under real pressure",
    };
    setEntryClassification(labels[condition] ?? "a decision condition");
    setAnswers((prev) => ({ ...prev, decision: entryDecision }));
    setStage("entry_response");
  }

  function advanceFromEntry() {
    setCurrentQ(1); // Skip Q1 — already answered in entry
    setStage("q2");
  }

  function handleAnswer(value: string) {
    const q = QUESTIONS[currentQ]!;
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  }

  async function advance() {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((q) => q + 1);
      setStage(`q${currentQ + 2}` as Stage);
    } else {
      // Pre-commitment gate before results
      setStage("pre_commitment");
    }
  }

  async function proceedAfterCommitment() {
      // Check for contradiction before synthesis
      const contradiction = inferContradiction(
        createCaseObject({
          id: "temp",
          decision: answers.decision ?? "",
          blocker: answers.blocker,
          forcedAction: answers.forcedAction,
        }),
      );
      if (contradiction && answers.blocker && answers.forcedAction) {
        setContradictionText(contradiction);
        setStage("contradiction_interrupt");
        return;
      }
      await runSynthesis();
  }

  async function runSynthesis() {
    setStage("synthesising");
    const elapsed = Math.round((Date.now() - startTime.current) / 1000);
    track("fast_diagnostic_completed", { elapsed_seconds: elapsed });

    const caseObj = createCaseObject({
      id: `fast_${Date.now()}`,
      decision: answers.decision ?? "",
      priorAttempt: answers.priorAttempt,
      costOfDelay: answers.costOfDelay,
      claimedOwner: answers.claimedOwner,
      blocker: answers.blocker,
      forcedAction: answers.forcedAction,
    });

    const buildAndPersistSpine = (result: SynthesisResult) => {
      const c3 = scoreC3(caseObj);
      const deterministic = buildDeterministicOutput(caseObj);
      const forecast = forecastDefaultPath(caseObj);
      const newSpine = createSpine({
        caseObj,
        c3: { ...c3, tier: c3.tier, confidenceBand: c3.confidenceBand },
        deterministic,
        synthesis: result.synthesis,
        forecast,
      });
      setSpine(newSpine);
      saveSpineToSession(newSpine);
      void persistSpineToDB(newSpine);

      // Schedule behavioural pressure loop (48h / 7d / 14d follow-up)
      registerPressureLoopFromSpine(newSpine);
      setSynthesis(result.synthesis);
      setSynthesisSource(result.source);
      if (result.arbiterMismatchMessage) setArbiterMessage(result.arbiterMismatchMessage);
    };

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "fast_diagnostic", canonicalResult: caseObj, userInputs: answers, synthesisMode: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.synthesis) {
          const result = await synthesise(caseObj, async () => JSON.stringify(data.synthesis));
          buildAndPersistSpine(result);
          if (result.source === "recovery" && result.recoveryQuestion) { setRecoveryQuestion(result.recoveryQuestion); setStage("recovery"); return; }
          setStage("result");
          return;
        }
      }
    } catch { /* fall through */ }

    const result = await synthesise(caseObj);
    buildAndPersistSpine(result);
    if (result.source === "recovery" && result.recoveryQuestion) { setRecoveryQuestion(result.recoveryQuestion); setStage("recovery"); return; }
    setStage("result");
  }

  const currentAnswer = answers[QUESTIONS[currentQ]?.id ?? ""] ?? "";
  const canAdvance = currentAnswer.trim().length >= 10;

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTRY INTERRUPT — single field, immediate classification
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage === "entry") {
    return (
      <Layout title="Decision Check" description="Expose the real blocker in under 2 minutes.">
        <Head><meta name="robots" content="noindex" /></Head>
        <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <div className="max-w-lg w-full">
            <h1 style={{ ...serif, fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 400, color: "rgba(255,255,255,0.90)", lineHeight: 1.2, textAlign: "center" }}>
              The decision is not stuck.<br />
              <span style={{ color: `${GOLD}CC` }}>Something is being avoided.</span>
            </h1>
            <p style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.38)", marginTop: "1rem", textAlign: "center", maxWidth: "40ch", marginLeft: "auto", marginRight: "auto" }}>
              Describe the decision. The system will expose the real blocker and force the next move — using your own words.
            </p>
            <div style={{ marginTop: "2rem" }}>
              <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "0.5rem" }}>
                In one sentence: what decision is currently stuck?
              </label>
              <textarea
                value={entryDecision}
                onChange={(e) => setEntryDecision(e.target.value)}
                placeholder="e.g. Whether to replace the VP who is underperforming but is protected by the CEO"
                rows={2}
                style={{ width: "100%", padding: "14px", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)", ...serif, fontSize: "0.95rem", lineHeight: 1.6, resize: "none", outline: "none" }}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && entryDecision.trim().length >= 10) { e.preventDefault(); handleEntrySubmit(); } }}
              />
              <button
                type="button"
                onClick={handleEntrySubmit}
                disabled={entryDecision.trim().length < 10}
                style={{ marginTop: "0.75rem", width: "100%", padding: "14px", border: `1px solid ${entryDecision.trim().length >= 10 ? `${GOLD}60` : "rgba(255,255,255,0.06)"}`, backgroundColor: entryDecision.trim().length >= 10 ? `${GOLD}10` : "transparent", color: entryDecision.trim().length >= 10 ? `${GOLD}CC` : "rgba(255,255,255,0.12)", ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: entryDecision.trim().length >= 10 ? "pointer" : "default" }}
              >
                Start with the decision <ArrowRight style={{ width: 11, height: 11, display: "inline", marginLeft: "0.5rem", verticalAlign: "middle" }} />
              </button>
            </div>
            <p style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.10)", marginTop: "1.5rem", textAlign: "center" }}>
              If nothing important is currently stuck, this will not be useful.
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTRY RESPONSE — immediate classification, then auto-advance
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage === "entry_response") {
    return (
      <Layout title="Decision Check" description="Decision classified.">
        <Head><meta name="robots" content="noindex" /></Head>
        <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <div className="max-w-lg text-center">
            <p style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(255,255,255,0.70)" }}>
              You described {entryClassification}.
            </p>
            <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>
              The system will now test whether this is an authority, definition, execution, or instability problem.
            </p>
            <button type="button" onClick={advanceFromEntry} style={{ marginTop: "1.5rem", padding: "14px 28px", border: `1px solid ${GOLD}60`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
              Continue <ArrowRight style={{ width: 11, height: 11, display: "inline", marginLeft: "0.5rem", verticalAlign: "middle" }} />
            </button>
          </div>
        </main>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRE-COMMITMENT GATE — filters spectators before result
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage === "pre_commitment") {
    return (
      <Shell progress={6} hideProgress>
        <div style={{ maxWidth: "460px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.80)", fontWeight: 500 }}>
            If the system identifies the real blocker, are you willing to act on it within 48 hours?
          </p>
          <div className="flex gap-3 mt-6 justify-center">
            <button
              type="button"
              onClick={() => {
                setCommitted(true);
                track("fast_precommit_yes");
                void proceedAfterCommitment();
              }}
              style={{ padding: "14px 32px", border: `1px solid ${GOLD}60`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Yes — show me
            </button>
            <button
              type="button"
              onClick={() => {
                setCommitted(false);
                track("fast_precommit_no");
                void proceedAfterCommitment();
              }}
              style={{ padding: "14px 32px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "transparent", color: "rgba(255,255,255,0.35)", ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Not yet
            </button>
          </div>
          <p style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.12)", marginTop: "1.5rem" }}>
            Both options proceed. The system records your intent.
          </p>
        </div>
      </Shell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRADICTION INTERRUPT — overlay before synthesis
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage === "contradiction_interrupt" && contradictionText) {
    // Extract blocker and forced action for display
    const blockerShort = (answers.blocker ?? "").slice(0, 80);
    const forcedShort = (answers.forcedAction ?? "").slice(0, 80);
    return (
      <Shell progress={6} hideProgress>
        <div style={{ border: `1px solid ${RED}0.30)`, backgroundColor: `${RED}0.04)`, padding: "1.75rem" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle style={{ width: 14, height: 14, color: `${RED}0.70)` }} />
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${RED}0.60)` }}>
              Contradiction detected
            </span>
          </div>
          <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.75)", marginTop: "0.5rem" }}>
            You said the blocker is: <span style={{ color: `${RED}0.80)` }}>&ldquo;{blockerShort}&rdquo;</span>
          </p>
          <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.75)", marginTop: "0.5rem" }}>
            But your forced answer bypasses it: <span style={{ color: `${GOLD}CC` }}>&ldquo;{forcedShort}&rdquo;</span>
          </p>
          <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)", marginTop: "1rem", fontWeight: 500 }}>
            That means the blocker is not preventing the decision. It is justifying the avoidance.
          </p>
          <button type="button" onClick={() => void runSynthesis()} style={{ marginTop: "1.5rem", padding: "12px 24px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
            Continue <ArrowRight style={{ width: 10, height: 10, display: "inline", marginLeft: "0.5rem", verticalAlign: "middle" }} />
          </button>
        </div>
      </Shell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNTHESISING
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage === "synthesising") {
    return (
      <Shell progress={6} hideProgress>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 style={{ width: 20, height: 20, color: `${GOLD}60`, animation: "spin 1.2s linear infinite" }} />
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}50`, marginTop: "0.75rem" }}>
            Analysing your case material
          </p>
        </div>
      </Shell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRECISION RECOVERY — visible C3 gate
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage === "recovery" && recoveryQuestion) {
    return (
      <Shell progress={6} hideProgress>
        <div style={{ border: `1px solid ${RED}0.25)`, backgroundColor: `${RED}0.04)`, padding: "1.5rem" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${RED}0.55)` }}>
            Too vague to diagnose
          </span>
          <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.70)", marginTop: "0.75rem", maxWidth: "48ch" }}>
            {recoveryQuestion}
          </p>
          <textarea
            value={answers.recovery ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, recovery: e.target.value }))}
            placeholder="Be specific. Name the person, the deadline, or the cost."
            rows={3}
            style={{ width: "100%", marginTop: "1rem", padding: "12px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.80)", ...serif, fontSize: "0.92rem", lineHeight: 1.6, resize: "none", outline: "none" }}
          />
          <button type="button" onClick={() => setStage("result")} style={{ marginTop: "1rem", padding: "10px 20px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
            Continue with current input
          </button>
        </div>
      </Shell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUESTIONS (Q2-Q6) — Q1 handled by entry interrupt
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage.startsWith("q")) {
    const q = QUESTIONS[currentQ]!;
    return (
      <Shell progress={currentQ + 1}>
        <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.5, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
          {q.question}
        </p>
        <p style={{ ...serif, fontSize: "0.78rem", color: "rgba(255,255,255,0.28)", marginTop: "0.35rem" }}>
          {q.helper}
        </p>
        <textarea
          value={currentAnswer}
          onChange={(e) => handleAnswer(e.target.value)}
          rows={3}
          style={{ width: "100%", marginTop: "1rem", padding: "14px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.80)", ...serif, fontSize: "0.95rem", lineHeight: 1.6, resize: "none", outline: "none" }}
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && canAdvance) { e.preventDefault(); advance(); } }}
        />
        <div className="flex items-center justify-between mt-3">
          <span style={{ ...mono, fontSize: "7px", color: canAdvance ? "rgba(110,231,183,0.40)" : "rgba(255,255,255,0.10)" }}>
            {canAdvance ? "Ready" : "More detail needed"}
          </span>
          <button type="button" onClick={advance} disabled={!canAdvance} style={{ padding: "10px 20px", border: `1px solid ${canAdvance ? `${GOLD}60` : "rgba(255,255,255,0.06)"}`, backgroundColor: canAdvance ? `${GOLD}10` : "transparent", color: canAdvance ? `${GOLD}CC` : "rgba(255,255,255,0.12)", ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: canAdvance ? "pointer" : "default" }}>
            {currentQ === QUESTIONS.length - 1 ? "Analyse" : "Next"}
          </button>
        </div>
      </Shell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULT SURFACE — demo format, not report
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage === "result" && synthesis && spine) {
    const elapsed = startTime.current ? Math.round((Date.now() - startTime.current) / 1000) : 0;
    const forecast = spine.forecast;

    return (
      <Layout title="Decision Check — Result" description="Your decision, analysed.">
        <Head><meta name="robots" content="noindex" /></Head>
        <main className="min-h-screen px-6 py-16" style={{ backgroundColor: "rgb(3,3,5)" }}>
          <div className="mx-auto max-w-xl">
            {/* Header */}
            <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>
              {elapsed}s · {spine.deterministic.conditionClass} · {spine.c3.confidenceBand} confidence
            </span>
            <h2 style={{ ...serif, fontSize: "1.3rem", fontWeight: 500, color: "rgba(255,255,255,0.85)", marginTop: "1rem", lineHeight: 1.3 }}>
              This is what is actually happening.
            </h2>

            {/* Arbiter mismatch warning */}
            {arbiterMessage && (
              <div style={{ border: "1px solid rgba(255,165,0,0.3)", backgroundColor: "rgba(255,165,0,0.05)", padding: "1rem", marginTop: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,165,0,0.55)" }}>System integrity check</span>
                <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,165,0,0.70)", marginTop: "0.2rem" }}>{arbiterMessage}</p>
              </div>
            )}

            {/* 1. VERDICT */}
            <div style={{ marginTop: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>Verdict</span>
              <p style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.65, color: "rgba(255,255,255,0.85)", marginTop: "0.3rem" }}>
                {synthesis.verdict}
              </p>
            </div>

            {/* 2. PRIMARY CONTRADICTION */}
            {synthesis.primaryContradiction && spine.c3.confidenceBand !== "low" && (
              <div style={{ border: `1px solid ${RED}0.20)`, backgroundColor: `${RED}0.04)`, padding: "1rem", marginTop: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${RED}0.50)` }}>The contradiction</span>
                <p style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.65)", marginTop: "0.2rem" }}>
                  {synthesis.primaryContradiction}
                </p>
              </div>
            )}

            {/* 3. WHAT YOU ARE AVOIDING */}
            {synthesis.avoidedDecision && (
              <div style={{ border: "1px solid rgba(253,186,116,0.15)", backgroundColor: "rgba(253,186,116,0.03)", padding: "1rem", marginTop: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.50)" }}>What you are avoiding</span>
                <p style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.2rem", fontWeight: 500 }}>
                  {synthesis.avoidedDecision}
                </p>
              </div>
            )}

            {/* 4. WHY PRIOR ATTEMPTS FAILED */}
            {synthesis.whyPriorAttemptsFailed && (
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem", marginTop: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Why prior attempts failed</span>
                <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "0.2rem" }}>
                  {synthesis.whyPriorAttemptsFailed}
                </p>
              </div>
            )}

            {/* 5. YOUR MOVE — non-negotiable format */}
            <div style={{ border: `1px solid ${GOLD}25`, backgroundColor: `${GOLD}06`, padding: "1rem", marginTop: "1rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}65` }}>Your move — within 48 hours</span>
              <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.80)", marginTop: "0.2rem", fontWeight: 500 }}>
                {synthesis.concreteMove}
              </p>
            </div>

            {/* 6. DEFAULT PATH — pressure engine */}
            <div style={{ border: `1px solid ${RED}0.12)`, padding: "1rem", marginTop: "1rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${RED}0.40)` }}>If nothing changes</span>
              <div className="mt-2 space-y-2">
                {[
                  { label: "7 days", text: forecast.sevenDays },
                  { label: "30 days", text: forecast.thirtyDays },
                  { label: "90 days", text: forecast.ninetyDays },
                ].map((c) => (
                  <div key={c.label} className="flex gap-3">
                    <span style={{ ...mono, fontSize: "7px", color: `${RED}0.30)`, minWidth: "50px" }}>{c.label}</span>
                    <span style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>{c.text}</span>
                  </div>
                ))}
              </div>
              <p style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.15)", marginTop: "0.75rem" }}>
                {controlShiftSummary(forecast)}
              </p>
            </div>

            {/* 7. CERTAINTY BOUNDARY */}
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: spine.c3.confidenceBand === "high" ? "rgba(110,231,183,0.60)" : spine.c3.confidenceBand === "medium" ? `${GOLD}BB` : "rgba(255,255,255,0.30)" }} />
              <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.20)" }}>
                Confidence: {spine.c3.confidenceBand} · {synthesis.certaintyBoundary}
              </span>
            </div>

            {/* ═══ CONVERSION SECTION ═══ */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem", marginTop: "1.5rem" }}>
              <p style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.6, color: "rgba(255,255,255,0.50)", fontWeight: 500 }}>
                This is a surface read. The structural problem may be deeper.
              </p>

              {/* CTA 1 — Structural escalation */}
              <Link href="/diagnostics/constitutional-diagnostic" className="group flex items-center justify-between mt-4" style={{ padding: "14px 18px", border: `1px solid ${GOLD}35`, backgroundColor: `${GOLD}08` }}>
                <div>
                  <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}CC` }}>
                    Test the structure behind this decision
                  </span>
                  <p style={{ ...serif, fontSize: "0.75rem", color: "rgba(255,255,255,0.30)", marginTop: "0.15rem" }}>
                    Run the Constitutional Diagnostic to see if this is embedded in how your organisation actually works.
                  </p>
                </div>
                <ArrowRight style={{ width: 12, height: 12, color: `${GOLD}80`, flexShrink: 0, marginLeft: "1rem" }} />
              </Link>

              {/* CTA 2 — Consequence */}
              <Link href="/diagnostics/executive-reporting" className="group flex items-center justify-between mt-2" style={{ padding: "14px 18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                    See the cost you are already paying
                  </span>
                  <p style={{ ...serif, fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", marginTop: "0.15rem" }}>
                    Executive Reporting converts this into exposure and priority.
                  </p>
                </div>
                <ArrowRight style={{ width: 12, height: 12, color: "rgba(255,255,255,0.25)", flexShrink: 0, marginLeft: "1rem" }} />
              </Link>

              {/* CTA 3 — Execution */}
              <Link href="/strategy-room" className="group flex items-center justify-between mt-2" style={{ padding: "14px 18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                    Enforce the decision
                  </span>
                  <p style={{ ...serif, fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", marginTop: "0.15rem" }}>
                    Strategy Room turns this into action and tracks whether it holds.
                  </p>
                </div>
                <ArrowRight style={{ width: 12, height: 12, color: "rgba(255,255,255,0.25)", flexShrink: 0, marginLeft: "1rem" }} />
              </Link>
            </div>

            {/* ═══ MICRO-CONVERSION FEEDBACK ═══ */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem", marginTop: "1.5rem" }}>
              {!feedbackGiven ? (
                <>
                  <p style={{ ...serif, fontSize: "0.88rem", color: "rgba(255,255,255,0.45)" }}>Was this accurate?</p>
                  <div className="flex gap-2 mt-2">
                    <FeedbackButton icon={<CheckCircle2 style={{ width: 12, height: 12 }} />} label="Yes — exactly it" color="rgba(110,231,183," onClick={() => { setFeedbackGiven("yes"); track("fast_feedback", { value: "yes" }); }} />
                    <FeedbackButton icon={<MinusCircle style={{ width: 12, height: 12 }} />} label="Partially" color="rgba(253,186,116," onClick={() => { setFeedbackGiven("partial"); track("fast_feedback", { value: "partial" }); }} />
                    <FeedbackButton icon={<XCircle style={{ width: 12, height: 12 }} />} label="No — missed" color={RED} onClick={() => { setFeedbackGiven("no"); track("fast_feedback", { value: "no" }); }} />
                  </div>
                </>
              ) : (
                <p style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.20)", letterSpacing: "0.15em" }}>
                  {feedbackGiven === "yes" ? (
                    <>
                      Then you already know this is real. Don&rsquo;t leave it unpriced.
                      <Link href="/diagnostics/executive-reporting" className="mt-2 inline-flex items-center gap-2" style={{ display: "block", color: `${GOLD}CC`, fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                        See what this is already costing <ArrowRight style={{ width: 10, height: 10, display: "inline" }} />
                      </Link>
                    </>
                  ) : feedbackGiven === "partial" ? "Noted. The Constitutional Diagnostic will sharpen this." : "Noted. A different framing may be needed — try the Constitutional Diagnostic."}
                </p>
              )}
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  return null;
};

// ─── SUB-COMPONENTS ───

function Shell({ children, progress, hideProgress }: { children: React.ReactNode; progress: number; hideProgress?: boolean }) {
  return (
    <Layout title="Decision Check" description="Operational decision intelligence.">
      <Head><meta name="robots" content="noindex" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-xl">
          {!hideProgress && (
            <>
              <div className="flex items-center justify-between mb-4">
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "#C9A96E70" }}>Decision check</span>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", color: "rgba(255,255,255,0.25)" }}>{progress} / 6</span>
              </div>
              <div className="flex gap-1 mb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ flex: 1, height: "2px", backgroundColor: i <= progress ? "#C9A96E80" : "rgba(255,255,255,0.06)" }} />
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

function FeedbackButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "8px 6px", border: `1px solid ${color}0.20)`, backgroundColor: `${color}0.04)`, color: `${color}0.60)`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.1em", cursor: "pointer" }}>
      {icon} {label}
    </button>
  );
}

export default FastDiagnosticPage;

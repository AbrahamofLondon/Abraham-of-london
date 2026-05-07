import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";
import { trackHesitation, trackScrollDepth } from "@/lib/analytics/hesitation";
import type { FastDiagnosticResult } from "@/lib/diagnostics/fast-diagnostic-dto";
import ExecutiveDecisionAuthorityBlock from "@/components/diagnostics/results/ExecutiveDecisionAuthorityBlock";
import DecisionChallengeCard from "@/components/diagnostics/DecisionChallengeCard";
import ResultEmailCapture from "@/components/diagnostics/ResultEmailCapture";
import type { ChallengeResult } from "@/lib/server/decision/challenge-engine.server";
import {
  clearVersionedAssessmentState,
  loadVersionedAssessmentState,
  saveVersionedAssessmentState,
} from "@/lib/client/assessment-state";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type ViewStage = "hero" | "decision" | "authority" | "consequence" | "commitment" | "commitment_declined" | "loading" | "recovery" | "result";
type FastDraftSnapshot = {
  answers: Record<string, string>;
  stepIndex: number;
  startedAt: number;
};
const STORAGE_KEY = "aol-fast-assessment-state";
const STORAGE_VERSION = "2026-04-standardized";

const STEPS: Array<{
  id: string;
  headline: string;
  placeholder: string;
  microcopy: string;
  challengeStage: string;
}> = [
  {
    id: "decision",
    headline: "What decision has been sitting unresolved longer than it should?",
    placeholder: "Describe the decision \u2014 not the outcome you want.",
    microcopy: "If you can\u2019t name it clearly, that\u2019s already a signal.",
    challengeStage: "decision_input",
  },
  {
    id: "claimedOwner",
    headline: "Who can actually make this decision binding?",
    placeholder: "Name the person or role with final authority.",
    microcopy: "\u201CEveryone\u201D is not an answer.",
    challengeStage: "ownership",
  },
  {
    id: "consequence",
    headline: "What becomes more expensive if this stays unresolved?",
    placeholder: "Be specific \u2014 time, money, risk, or opportunity.",
    microcopy: "If nothing changes, something worsens. Name it.",
    challengeStage: "pre_result",
  },
];

const FastDiagnosticPage: NextPage = () => {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [stepIndex, setStepIndex] = React.useState(0);
  const [stage, setStage] = React.useState<ViewStage>("hero");
  const [committed, setCommitted] = React.useState(false);
  const [result, setResult] = React.useState<FastDiagnosticResult | null>(null);
  const [error, setError] = React.useState("");
  const startedAt = React.useRef<number>(Date.now());
  const [challenge, setChallenge] = React.useState<ChallengeResult | null>(null);
  const [challengeLoading, setChallengeLoading] = React.useState(false);
  const [liveHint, setLiveHint] = React.useState("");
  const [showResume, setShowResume] = React.useState(false);
  const [draftSnapshot, setDraftSnapshot] = React.useState<FastDraftSnapshot | null>(null);

  React.useEffect(() => {
    const saved = loadVersionedAssessmentState<FastDraftSnapshot>(
      STORAGE_KEY,
      STORAGE_VERSION,
    );
    if (!saved || !saved.answers || Object.keys(saved.answers).length === 0) return;
    setDraftSnapshot(saved);
    setShowResume(true);
  }, []);

  React.useEffect(() => {
    if (stage === "hero" || stage === "result" || stage === "loading") return;
    const timer = setTimeout(() => {
      saveVersionedAssessmentState(STORAGE_KEY, STORAGE_VERSION, {
        answers,
        stepIndex,
        startedAt: startedAt.current,
        timestamp: new Date().toISOString(),
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [answers, stepIndex, stage]);

  function resumeDraft() {
    if (draftSnapshot) {
      setAnswers(draftSnapshot.answers);
      setStepIndex(draftSnapshot.stepIndex);
      setStage(draftSnapshot.stepIndex === 0 ? "decision" : draftSnapshot.stepIndex === 1 ? "authority" : "consequence");
      startedAt.current = draftSnapshot.startedAt;
    }
    setShowResume(false);
  }

  function startFresh() {
    setShowResume(false);
    clearVersionedAssessmentState(STORAGE_KEY);
    setDraftSnapshot(null);
  }

  async function runChallenge(challengeStage: string): Promise<ChallengeResult | null> {
    setChallengeLoading(true);
    setChallenge(null);
    try {
      const response = await fetch("/api/diagnostics/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentType: "fast", stage: challengeStage, answers }),
      });
      if (!response.ok) return null;
      const json = (await response.json()) as { ok: boolean } & ChallengeResult;
      if (json.ok && json.severity !== "none") {
        setChallenge(json);
        return json;
      }
      return null;
    } catch {
      return null;
    } finally {
      setChallengeLoading(false);
    }
  }

  React.useEffect(() => {
    track("fast_diagnostic_page_view");
    const cleanScroll = trackScrollDepth("fast_diagnostic", [50, 80]);
    const cleanHesitation = trackHesitation({ page: "fast_diagnostic", idleTimeout: 5000 });
    try {
      const raw = sessionStorage.getItem("aol_fast_result");
      if (!raw) return;
      const stored = JSON.parse(raw) as FastDiagnosticResult;
      if (stored?.caseRef) { setResult(stored); setStage("result"); }
    } catch { /* ignore */ }
    return () => { cleanScroll(); cleanHesitation(); };
  }, []);

  // Live hint logic — reacts while typing
  const currentStep = STEPS[stepIndex];
  const currentValue = currentStep ? (answers[currentStep.id] ?? "") : "";
  const canAdvance = currentValue.trim().length >= 8;

  React.useEffect(() => {
    if (stage !== "decision" && stage !== "authority" && stage !== "consequence") { setLiveHint(""); return; }
    const text = currentValue.trim();
    if (text.length < 5) { setLiveHint(""); return; }

    const timer = setTimeout(() => {
      if (stepIndex === 0) {
        // Decision input live hints
        if (/^(grow|improve|fix|increase|be more|make things|sort out|deal with)/i.test(text)) {
          setLiveHint("This does not yet read as a decision.");
        } else if (/want to|hope to|would like/i.test(text)) {
          setLiveHint("This sounds like an outcome, not a decision.");
        } else if (text.length < 20) {
          setLiveHint("This is broad \u2014 what specifically must be decided?");
        } else {
          setLiveHint("");
        }
      } else if (stepIndex === 1) {
        // Authority live hints
        if (/^(everyone|the team|shared|we all|committee|leadership|no one|unclear)/i.test(text)) {
          setLiveHint("Shared ownership usually explains delay.");
        } else if (text.length >= 3 && text.length < 15) {
          setLiveHint("If this person says no, does the decision still happen?");
        } else {
          setLiveHint("");
        }
      } else if (stepIndex === 2) {
        // Consequence live hints
        if (/^(things will|it will be|problems|nothing|more of the same)/i.test(text)) {
          setLiveHint("That consequence is too abstract.");
        } else if (text.length < 25) {
          setLiveHint("If this continues for 90 days, what actually breaks?");
        } else {
          setLiveHint("");
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [currentValue, stepIndex, stage]);

  function updateAnswer(value: string) {
    if (!currentStep) return;
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
  }

  function moveToNextStep() {
    setChallenge(null);
    setLiveHint("");
    if (stepIndex < STEPS.length - 1) {
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      setStage(nextIndex === 1 ? "authority" : "consequence");
    } else {
      setStage("commitment");
    }
  }

  async function advanceStep() {
    if (!canAdvance || !currentStep) return;

    const hit = await runChallenge(currentStep.challengeStage);

    // No challenge — advance immediately
    if (!hit) {
      moveToNextStep();
      return;
    }

    // Challenge fired — card is now visible.
    // If blocked (canProceed=false): user MUST revise. Do not advance.
    // If can proceed (canProceed=true): user sees card, clicks Accept to advance.
    // In both cases, we stop here. The card handles the next move.
  }

  async function submitFastDiagnostic(commitmentOverride?: boolean) {
    setStage("loading");
    setError("");
    const commitmentValue = commitmentOverride ?? committed;
    try {
      const response = await fetch("/api/diagnostics/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, committed: commitmentValue, elapsedMs: Date.now() - startedAt.current }),
      });
      const json = (await response.json()) as FastDiagnosticResult | { ok?: false; error?: string };
      if (!response.ok || "caseRef" in json === false) {
        throw new Error("error" in json && json.error ? json.error : "Unable to complete analysis.");
      }
      const publicResult = json as FastDiagnosticResult;
      setResult(publicResult);
      clearVersionedAssessmentState(STORAGE_KEY);
      try { sessionStorage.setItem("aol_fast_result", JSON.stringify(publicResult)); } catch { /* ignore */ }
      track("fast_diagnostic_completed", { committed: commitmentValue, elapsed_seconds: Math.round((Date.now() - startedAt.current) / 1000) });
      if (publicResult.recoveryQuestion) { setStage("recovery"); return; }
      setStage("result");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to complete analysis.");
      setStage("decision");
    }
  }

  function resetDiagnostic() {
    setAnswers({}); setStepIndex(0); setStage("hero");
    setCommitted(false); setResult(null); setError(""); setChallenge(null); setLiveHint("");
    startedAt.current = Date.now();
    try { sessionStorage.removeItem("aol_fast_result"); } catch { /* ignore */ }
    clearVersionedAssessmentState(STORAGE_KEY);
  }

  const an = result?.anchorNarrative;

  return (
    <Layout title="Decision Check" description="A governed fast diagnostic for live decision exposure.">
      <Head><meta name="robots" content="noindex" /></Head>
      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HERO — ABOVE THE FOLD                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {stage === "hero" && (
          <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            <h1 style={{ ...serif, fontSize: "clamp(2rem, 5vw, 3.8rem)", lineHeight: 1.05, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.94)", maxWidth: "18ch" }}>
              You don&rsquo;t have an execution problem.
            </h1>
            <p style={{ ...serif, fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)", lineHeight: 1.1, color: "rgba(255,255,255,0.45)", marginTop: "0.5rem", maxWidth: "22ch" }}>
              You have a decision structure problem.
            </p>
            <p style={{ marginTop: "2.5rem", maxWidth: "36ch", fontSize: "0.95rem", lineHeight: 1.75, color: "rgba(255,255,255,0.48)" }}>
              Most decisions don&rsquo;t fail because they&rsquo;re wrong. They fail because no one actually owns them &mdash; or the structure can&rsquo;t carry them.
            </p>
            <p style={{ marginTop: "0.5rem", maxWidth: "36ch", fontSize: "0.95rem", lineHeight: 1.75, color: "rgba(255,255,255,0.48)" }}>
              This will show you where yours is breaking. Takes 2 minutes.
            </p>
            {showResume ? (
              <div style={{ marginTop: "2.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <button type="button" onClick={() => { resumeDraft(); startedAt.current = Date.now(); }} style={{ padding: "16px 36px", border: `1px solid ${GOLD}55`, backgroundColor: `${GOLD}12`, color: GOLD, ...mono, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
                  Continue your session
                </button>
                <button type="button" onClick={() => { startFresh(); setStage("decision"); startedAt.current = Date.now(); track("fast_diagnostic_started"); }} style={{ padding: "16px 36px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "transparent", color: "rgba(255,255,255,0.45)", ...mono, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
                  Start fresh
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => { setStage("decision"); startedAt.current = Date.now(); track("fast_diagnostic_started"); }} style={{ marginTop: "2.5rem", padding: "16px 36px", border: `1px solid ${GOLD}55`, backgroundColor: `${GOLD}12`, color: GOLD, ...mono, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
                Find the break
              </button>
            )}
            <p style={{ marginTop: "1.25rem", ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
              No signup. No theory. You will either recognise it &mdash; or you won&rsquo;t.
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* INTERROGATION SCREENS (Decision / Authority / Consequence)         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {(stage === "decision" || stage === "authority" || stage === "consequence") && currentStep && (
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <div style={{ width: "100%", maxWidth: "640px" }}>
              <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "2rem" }}>
                Step {stepIndex + 1} of {STEPS.length}
              </div>
              <h2 style={{ ...serif, fontSize: "clamp(1.4rem, 3vw, 2rem)", lineHeight: 1.2, color: "rgba(255,255,255,0.92)", maxWidth: "28ch" }}>
                {currentStep.headline}
              </h2>
              <textarea
                value={currentValue}
                onChange={(e) => updateAnswer(e.target.value)}
                rows={4}
                placeholder={currentStep.placeholder}
                autoFocus
                style={{ width: "100%", marginTop: "1.5rem", padding: "16px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.35)", color: "rgba(255,255,255,0.88)", fontSize: "1rem", lineHeight: 1.65, resize: "none", outline: "none" }}
              />
              <p style={{ marginTop: "0.6rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.30)" }}>
                {currentStep.microcopy}
              </p>

              {/* Live hint — reacts while typing */}
              {liveHint && (
                <p style={{ marginTop: "0.75rem", fontSize: "0.88rem", color: `${GOLD}BB`, transition: "opacity 300ms" }}>
                  {liveHint}
                </p>
              )}

              {/* Challenge card */}
              {challenge && (
                <div style={{ marginTop: "1rem" }}>
                  <DecisionChallengeCard
                    challenge={challenge}
                    onRevise={() => setChallenge(null)}
                    onAccept={moveToNextStep}
                  />
                </div>
              )}

              {challengeLoading && (
                <p style={{ marginTop: "0.75rem", color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>Evaluating decision quality...</p>
              )}

              {error && (
                <p style={{ marginTop: "0.75rem", color: "rgba(252,165,165,0.82)", fontSize: "0.88rem" }}>{error}</p>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={advanceStep}
                  disabled={!canAdvance}
                  style={{ padding: "14px 28px", border: `1px solid ${canAdvance ? `${GOLD}50` : "rgba(255,255,255,0.08)"}`, backgroundColor: canAdvance ? `${GOLD}12` : "transparent", color: canAdvance ? `${GOLD}CC` : "rgba(255,255,255,0.15)", ...mono, fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", cursor: canAdvance ? "pointer" : "default" }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COMMITMENT SCREEN                                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {stage === "commitment" && (
          <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            <h2 style={{ ...serif, fontSize: "clamp(1.3rem, 3vw, 1.8rem)", lineHeight: 1.3, color: "rgba(255,255,255,0.88)", maxWidth: "26ch" }}>
              If this identifies the real blocker, will you act on it within 48 hours?
            </h2>
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => { setCommitted(true); void submitFastDiagnostic(true); }}
                style={{ padding: "14px 28px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", cursor: "pointer" }}
              >
                Yes &mdash; if it&rsquo;s clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommitted(false);
                  setStage("commitment_declined");
                }}
                style={{ padding: "14px 28px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "transparent", color: "rgba(255,255,255,0.45)", ...mono, fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", cursor: "pointer" }}
              >
                No &mdash; I&rsquo;m not ready to act
              </button>
            </div>
            <p style={{ marginTop: "1.5rem", ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              This only works if the decision is real.
            </p>
          </div>
        )}

        {/* Commitment declined — not yet a decision */}
        {stage === "commitment_declined" && (
          <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            <p style={{ ...serif, fontSize: "clamp(1.3rem, 3vw, 1.8rem)", lineHeight: 1.3, color: "rgba(255,255,255,0.88)", maxWidth: "28ch" }}>
              Then this is not yet a decision.
            </p>
            <p style={{ marginTop: "1rem", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.48)", maxWidth: "36ch" }}>
              You can still view the analysis, but the system will treat this as unresolved.
            </p>
            <button
              type="button"
              onClick={() => void submitFastDiagnostic(false)}
              style={{ marginTop: "2rem", padding: "14px 28px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", cursor: "pointer" }}
            >
              View analysis anyway
            </button>
          </div>
        )}

        {/* Loading */}
        {stage === "loading" && (
          <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "1.5rem" }}>Resolution</div>
            <LoadingLine />
            <div style={{ marginTop: "2rem", width: "200px", height: "3px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ width: "50%", height: "100%", borderRadius: "2px", backgroundColor: GOLD, animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          </div>
        )}

        {/* Recovery */}
        {stage === "recovery" && result && (
          <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80` }}>More detail required</div>
            <p style={{ marginTop: "1rem", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.74)", maxWidth: "40ch" }}>{result.recoveryQuestion}</p>
            <button type="button" onClick={resetDiagnostic} style={{ marginTop: "1.5rem", padding: "14px 24px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", cursor: "pointer" }}>
              Restart with more detail
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* RESULT SCREEN — £10K FEEL                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {stage === "result" && result && (
          <div className="px-6 py-20">
            <div className="mx-auto max-w-2xl" style={{ display: "grid", gap: "1.5rem" }}>

              {/* OPENING */}
              <div style={{ paddingBottom: "1.5rem", borderBottom: `1px solid ${GOLD}18` }}>
                <p style={{ ...serif, fontSize: "clamp(1.3rem, 3vw, 1.8rem)", lineHeight: 1.25, color: "rgba(255,255,255,0.94)" }}>
                  {an ? an.opening : "You are not stuck because this is complex. You are stuck because the decision structure is broken."}
                </p>
              </div>

              {/* CONDITION */}
              <ResultBlock label="Condition">
                {an ? an.condition : "The decision exists, but it does not have clean authority. It cannot move in its current form."}
              </ResultBlock>

              {/* PERSONAL MIRROR LINE */}
              <div style={{ padding: "1.25rem 0", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.5, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>
                  You already know this. You&rsquo;ve been circling it.
                </p>
              </div>

              {/* ── Email capture — above fold after verdict ─── */}
              <ResultEmailCapture source="fast_diagnostic" resultRef={result.caseRef} />

              {/* WHY IT EXISTS */}
              <ResultBlock label="Why it exists">
                {an ? an.whyItExists : result.synthesis?.whyPriorAttemptsFailed ?? "The stated decision conflicts with the current ownership structure. As long as authority remains distributed, progress will continue to stall."}
              </ResultBlock>

              {/* PATTERN */}
              <ResultBlock label="Pattern">
                {an ? an.pattern : "This pattern appears when decisions are discussed, but not actually assigned. Agreement replaces ownership. Movement stops."}
              </ResultBlock>

              {/* COST OF INACTION */}
              <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem 1.5rem" }}>
                <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80` }}>Cost of inaction</div>
                <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.65rem" }}>
                  <CostLine label="30 days" text={an?.costOfInaction.thirtyDays ?? result.costOfInaction?.horizon30 ?? "Delay becomes normalised. Workarounds emerge."} />
                  <CostLine label="60 days" text={an?.costOfInaction.sixtyDays ?? result.costOfInaction?.horizon60 ?? "Resources are spent without forward movement."} />
                  <CostLine label="90 days" text={an?.costOfInaction.ninetyDays ?? result.costOfInaction?.horizon90 ?? "The cost of reversing direction exceeds the cost of deciding now."} />
                </div>
              </div>

              {/* BOARD / EXTERNAL VIEW */}
              <ResultBlock label="External view">
                {an?.perspective ?? "From the outside, this does not appear as complexity. It appears as hesitation. That is how it will be interpreted."}
              </ResultBlock>

              {/* REQUIRED MOVE */}
              <div style={{ border: `1px solid ${GOLD}25`, backgroundColor: `${GOLD}06`, padding: "1.25rem 1.5rem" }}>
                <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90` }}>Required move</div>
                <p style={{ marginTop: "0.6rem", ...serif, fontSize: "1.05rem", lineHeight: 1.65, color: "rgba(255,255,255,0.85)" }}>
                  {an?.requiredMove ?? "Assign one accountable owner. Remove competing authority. Force a decision window. Anything less will preserve the current outcome."}
                </p>
              </div>

              {/* Executive Decision Authority Block */}
              <ExecutiveDecisionAuthorityBlock authorityIndex={result.authorityIndex} costOfInaction={result.costOfInaction} executionFailure={result.executionFailure} />

              {result.reviewMessage && <ResultBlock label="System integrity note">{result.reviewMessage}</ResultBlock>}

              <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", padding: "0.5rem 0" }}>
                Governed analysis · {result.signalStrength} reading strength
                {!committed && " · readiness: unresolved"}
              </div>

              {/* ── ESCALATION: Fast → Purpose ─── */}
              <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}05`, padding: "1.25rem 1.5rem" }}>
                <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80` }}>Next unknown</div>
                <p style={{ marginTop: "0.5rem", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.82)" }}>
                  This appears to be a decision structure issue. What is not yet clear is whether this is personal or systemic.
                </p>
                <Link href="/purpose-alignment" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "0.85rem", padding: "12px 22px", border: `1px solid ${GOLD}42`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
                  Continue to Purpose Alignment <ArrowRight style={{ width: 11, height: 11 }} />
                </Link>
              </div>

              <details style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem 1.5rem" }}>
                <summary style={{ cursor: "pointer", ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                  How this was determined
                </summary>
                <div style={{ marginTop: "1rem", display: "grid", gap: "0.9rem" }}>
                  <p style={{ ...serif, fontSize: "0.96rem", lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>
                    You indicated: {answers.decision || "an unresolved decision"}, under authority held by {answers.claimedOwner || "an unclear owner"}, with consequence described as {answers.consequence || "increasing cost"}.
                  </p>
                  <p style={{ ...serif, fontSize: "0.96rem", lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>
                    This combination typically produces decision drift because the structure carrying the decision is weaker than the urgency surrounding it.
                  </p>
                </div>
              </details>

              <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.30)", fontStyle: "italic", padding: "0.75rem 0" }}>
                This pattern is commonly seen before structural correction. This reading can be tracked over time. Re-evaluate in 14 days to see whether the pattern improves or repeats.
              </p>

              <div style={{ padding: "1.5rem 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.35)", marginBottom: "1rem" }}>
                  {an?.cta ?? "This is now structural, not situational."}
                </p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <Link href="/diagnostics/executive-reporting" style={{ padding: "12px 20px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none" }}>
                    Move this into a controlled decision environment <ArrowRight style={{ width: 10, height: 10, display: "inline", marginLeft: 4 }} />
                  </Link>
                  <button type="button" onClick={resetDiagnostic} style={{ padding: "12px 20px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "transparent", color: "rgba(255,255,255,0.40)", ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}>
                    Start again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
};

function ResultBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem 1.5rem" }}>
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
        {label}
      </div>
      <p style={{ marginTop: "0.5rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.97rem", lineHeight: 1.72, color: "rgba(255,255,255,0.72)" }}>
        {children}
      </p>
    </div>
  );
}

const LOADING_LINES = [
  "Reading your decision pattern\u2026",
  "Checking structural consistency\u2026",
  "Preparing governed analysis\u2026",
];

function LoadingLine() {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % LOADING_LINES.length), 1400);
    return () => clearInterval(timer);
  }, []);
  return (
    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.2rem, 3vw, 1.6rem)", lineHeight: 1.3, color: "rgba(255,255,255,0.70)", transition: "opacity 300ms" }}>
      {LOADING_LINES[index]}
    </p>
  );
}

function CostLine({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginRight: "0.75rem" }}>{label}:</span>
      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.68)" }}>{text}</span>
    </div>
  );
}

export default FastDiagnosticPage;

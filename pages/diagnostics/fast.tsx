import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { recommendNextInstrument } from "@/lib/commercial/recommendation-engine";
import { ProductRecommendationCard } from "@/components/commercial/ProductRecommendationCard";
import { ArbiterBadge } from "@/components/trust/ArbiterBadge";
import ClientIntelligenceStack from "@/components/Intelligence/user/ClientIntelligenceStack";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";
import { trackHesitation, trackScrollDepth } from "@/lib/analytics/hesitation";
import { trackLaunch } from "@/lib/analytics/client-launch-events";
import type { FastDiagnosticResult } from "@/lib/diagnostics/fast-diagnostic-dto";
import type { DecisionVelocitySummary } from "@/lib/analytics/decision-velocity";
import { defaultIntelligenceMeta } from "@/lib/product/intelligence-contract";
import ExecutiveDecisionAuthorityBlock from "@/components/diagnostics/results/ExecutiveDecisionAuthorityBlock";
import DecisionChallengeCard from "@/components/diagnostics/DecisionChallengeCard";
import ResultEmailCapture from "@/components/diagnostics/ResultEmailCapture";
import SaveCaseConversionPanel from "@/components/product/SaveCaseConversionPanel";
import GovernanceDisclosure from "@/components/trust/GovernanceDisclosure";
import DiagnosticStandardPanel from "@/components/trust/DiagnosticStandardPanel";
import IntelligenceGainPanel from "@/components/living/IntelligenceGainPanel";
import EvidenceStrengthMeter from "@/components/living/EvidenceStrengthMeter";
import NextLayerUnlockedPanel from "@/components/living/NextLayerUnlockedPanel";
import DecisionAdvantageSummary from "@/components/living/DecisionAdvantageSummary";
import GovernedActionPanel from "@/components/living/GovernedActionPanel";
import HumanReviewPrompt from "@/components/living/HumanReviewPrompt";
import OutcomeMemoryPreview from "@/components/living/OutcomeMemoryPreview";
import BoardSummaryPreview from "@/components/diagnostics/BoardSummaryPreview";
import { buildBoardSummaryFromFastDiagnostic } from "@/lib/diagnostics/board-summary";
import type { ChallengeResult } from "@/lib/server/decision/challenge-engine.server";
import { buildFastDiagnosticCarryForwardPayload } from "@/lib/product/session-case-continuity";
import {
  clearVersionedAssessmentState,
  loadVersionedAssessmentState,
  saveVersionedAssessmentState,
} from "@/lib/client/assessment-state";
import AssessmentResultSurface from "@/components/diagnostics/AssessmentResultSurface";
import { mapFastDiagnosticToAssessmentResult } from "@/lib/diagnostics/assessment-result-mappers";
import { generateCaseReference } from "@/lib/product/case-reference";
import { evidenceStateFromAssessmentResult } from "@/lib/product/result-pathway-state";

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
  const [source, setSource] = React.useState<string | null>(null);
  const startedAt = React.useRef<number>(Date.now());
  const [challenge, setChallenge] = React.useState<ChallengeResult | null>(null);
  const [challengeLoading, setChallengeLoading] = React.useState(false);
  const [liveHint, setLiveHint] = React.useState("");
  const [showResume, setShowResume] = React.useState(false);
  const [draftSnapshot, setDraftSnapshot] = React.useState<FastDraftSnapshot | null>(null);

  // Optional evidence strengthener fields
  const [strengthEvidence, setStrengthEvidence] = React.useState("");
  const [strengthAuthority, setStrengthAuthority] = React.useState("");
  const [strengthConsequence, setStrengthConsequence] = React.useState("");
  const [strengthExpanded, setStrengthExpanded] = React.useState(false);

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
    // Detect source context from URL query params
    try {
      const params = new URLSearchParams(window.location.search);
      const src = params.get("source");
      if (src === "operator-pilot") setSource("operator-pilot");
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
        body: JSON.stringify({
          answers,
          committed: commitmentValue,
          elapsedMs: Date.now() - startedAt.current,
          ...((() => {
            const opt: Record<string, string> = {};
            if (strengthEvidence.trim()) opt.failureEvidence = strengthEvidence.trim();
            if (strengthAuthority.trim()) opt.changeAuthority = strengthAuthority.trim();
            if (strengthConsequence.trim()) opt.thirtyDayConsequence = strengthConsequence.trim();
            return Object.keys(opt).length > 0 ? { optionalEvidence: { ...opt, sourceLabel: "USER_REPORTED" } } : {};
          })()),
        }),
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
      trackLaunch("fast_completed", "fast_diagnostic", { caseId: publicResult.caseRef });
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
    setStrengthEvidence(""); setStrengthAuthority(""); setStrengthConsequence(""); setStrengthExpanded(false);
    startedAt.current = Date.now();
    try { sessionStorage.removeItem("aol_fast_result"); } catch { /* ignore */ }
    clearVersionedAssessmentState(STORAGE_KEY);
  }

  const an = result?.anchorNarrative;
  const mappedFastAssessmentResult = React.useMemo(
    () => (result ? mapFastDiagnosticToAssessmentResult(result, answers.decision) : null),
    [answers.decision, result],
  );
  const fallbackVelocitySummary: DecisionVelocitySummary | null = React.useMemo(() => {
    if (!result) return null;
    return {
      status: committed && result.checkpointId ? "FIRST_CHECKPOINT_CREATED" : "NO_DATA",
      averageTimeToFirstResponseDays: null,
      previousAverageTimeToFirstResponseDays: null,
      trendDeltaDays: null,
      openCheckpointCount: committed && result.checkpointId ? 1 : 0,
      overdueCheckpointCount: 0,
      completedCheckpointCount: 0,
      blockedCheckpointCount: 0,
      decisionVelocityBand: committed && result.checkpointId ? "INSUFFICIENT_DATA" : "INSUFFICIENT_DATA",
      sourceLabel: committed && result.checkpointId ? "Fast Diagnostic checkpoint" : "Fast Diagnostic baseline",
      evidencePosture: committed && result.checkpointId ? "PARTIAL" : "INSUFFICIENT",
      summary: committed && result.checkpointId
        ? "A checkpoint has been scheduled. The next governed response will establish your decision velocity."
        : "No durable checkpoint exists yet, so decision velocity cannot be measured.",
      caution: committed && result.checkpointId
        ? "External benchmark unavailable. This is based only on your record."
        : "No decision velocity has been measured yet.",
      meta: defaultIntelligenceMeta({
        scope: {
          caseId: result.caseRef ?? null,
          sourceSurface: "FAST_DIAGNOSTIC",
          scopeLabel: "Fast Diagnostic case",
          scopeType: "CASE",
        },
        sourceLabel: committed && result.checkpointId ? "Fast Diagnostic checkpoint" : "Fast Diagnostic baseline",
        capturedAt: new Date().toISOString(),
        evidencePosture: committed && result.checkpointId ? "INSUFFICIENT_DATA" : "INSUFFICIENT_DATA",
        confidenceLabel: "UNAVAILABLE",
        dataQuality: committed && result.checkpointId ? "THIN" : "EMPTY",
        evidenceBasis: committed && result.checkpointId ? "Checkpoint created but not yet answered." : "No recorded checkpoint response yet.",
        meaning: "Velocity becomes meaningful once a governed response is recorded.",
        limitation: "Not a benchmark.",
        nextAction: committed && result.checkpointId ? "Wait for the checkpoint and record the outcome." : "Create a checkpoint by committing to act.",
        emptyState: !committed || !result.checkpointId ? {
          reason: "No decision velocity has been measured yet.",
          nextAction: "Commit to a checkpoint to begin measurement.",
        } : undefined,
      }),
    };
  }, [committed, result]);

  return (
    <Layout title="Decision Check" description="A governed fast diagnostic for live decision exposure.">
      <Head><meta name="robots" content="noindex" /></Head>
      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HERO — ABOVE THE FOLD                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {stage === "hero" && (
          <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            {source === "operator-pilot" && (
              <div style={{ width: "100%", maxWidth: "640px", marginBottom: "2rem", border: `1px solid ${GOLD}24`, backgroundColor: `${GOLD}04`, padding: "1.25rem", textAlign: "left" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                  Operator Pilot Intake
                </p>
                <p style={{ marginTop: "0.5rem", fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>
                  This is the evidence gate for the Selective Operator Pilot. The diagnostic will determine whether your decision meets the threshold for a governed pilot review — testing evidence, authority, consequence, and execution reality.
                </p>
                <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>
                  After completion, you will receive a finding and a recommendation. If the case qualifies, you will be directed to the pilot pathway. If not, you will receive a specific explanation of what is required to proceed.
                </p>
              </div>
            )}
            <h1 style={{ ...serif, fontSize: "clamp(2rem, 5vw, 3.8rem)", lineHeight: 1.05, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.94)", maxWidth: "18ch" }}>
              Bring one stuck decision. Leave with the governance move.
            </h1>
            <p style={{ marginTop: "1.5rem", maxWidth: "44ch", fontSize: "0.95rem", lineHeight: 1.75, color: "rgba(255,255,255,0.52)" }}>
              The system reads the decision state, evidence posture, authority pressure, cost exposure, and next admissible move.
            </p>
            <p style={{ marginTop: "0.5rem", maxWidth: "36ch", fontSize: "0.95rem", lineHeight: 1.75, color: "rgba(255,255,255,0.52)" }}>
              Takes 2 minutes. No account required to receive the first reading.
            </p>
            <div style={{ width: "100%", maxWidth: "640px", marginTop: "2rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem", textAlign: "left" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}AA`, marginBottom: "0.9rem" }}>
                What this creates
              </p>
              <div style={{ display: "grid", gap: "0.8rem" }}>
                <div style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "12px" }}>
                  <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}99` }}>
                    Diagnostic record
                  </p>
                  <p style={{ marginTop: "0.25rem", fontSize: "0.86rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)" }}>
                    The finding, condition, authority index, comparison posture, and governance move.
                  </p>
                </div>
                <div style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "12px" }}>
                  <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}99` }}>
                    Governed case
                  </p>
                  <p style={{ marginTop: "0.25rem", fontSize: "0.86rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)" }}>
                    Created when you save or continue into Decision Centre.
                  </p>
                </div>
                <div style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "12px" }}>
                  <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}99` }}>
                    Checkpoint
                  </p>
                  <p style={{ marginTop: "0.25rem", fontSize: "0.86rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)" }}>
                    Created only if you accept a commitment or review trigger.
                  </p>
                </div>
              </div>
            </div>
            {showResume ? (
              <div style={{ marginTop: "2.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <button type="button" onClick={() => { resumeDraft(); startedAt.current = Date.now(); }} style={{ padding: "16px 36px", border: `1px solid ${GOLD}55`, backgroundColor: `${GOLD}12`, color: GOLD, ...mono, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
                  Continue your session
                </button>
                <button type="button" onClick={() => { startFresh(); setStage("decision"); startedAt.current = Date.now(); track("fast_diagnostic_started"); trackLaunch("fast_started", "fast_diagnostic"); }} style={{ padding: "16px 36px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "transparent", color: "rgba(255,255,255,0.45)", ...mono, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
                  Start fresh
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => { setStage("decision"); startedAt.current = Date.now(); track("fast_diagnostic_started"); trackLaunch("fast_started", "fast_diagnostic"); }} style={{ marginTop: "2.5rem", padding: "16px 36px", border: `1px solid ${GOLD}55`, backgroundColor: `${GOLD}12`, color: GOLD, ...mono, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
                Begin Fast Diagnostic
              </button>
            )}
            <p style={{ marginTop: "1.25rem", ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
              Entry surface only. The governed case begins when the reading is saved.
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* INTERROGATION SCREENS (Decision / Authority / Consequence)         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {(stage === "decision" || stage === "authority" || stage === "consequence") && currentStep && (
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <div style={{ width: "100%", maxWidth: "640px" }}>
              <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.30em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "2rem" }}>
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

              {/* Optional evidence strengthener — last step only */}
              {stepIndex === STEPS.length - 1 && (
                <div style={{ marginTop: "1.5rem", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)" }}>
                  <button
                    type="button"
                    onClick={() => setStrengthExpanded((prev) => !prev)}
                    style={{ width: "100%", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div>
                      <div style={{ ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                        Strengthen the evidence
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.22)", marginTop: "0.25rem" }}>
                        Optional. Additional context produces a more precise finding.
                      </div>
                    </div>
                    <span style={{ ...mono, fontSize: "12px", color: "rgba(255,255,255,0.25)", transform: strengthExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }}>
                      ▼
                    </span>
                  </button>
                  {strengthExpanded && (
                    <div style={{ padding: "0 1.25rem 1.25rem", display: "grid", gap: "1rem" }}>
                      <div>
                        <label style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", display: "block", marginBottom: "0.4rem" }}>
                          What evidence would prove this decision is already failing?
                        </label>
                        <textarea
                          value={strengthEvidence}
                          onChange={(e) => setStrengthEvidence(e.target.value)}
                          rows={3}
                          placeholder="Missed deadlines, lost clients, repeated escalation — name what already happened."
                          style={{ width: "100%", padding: "16px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.35)", color: "rgba(255,255,255,0.88)", fontSize: "1rem", lineHeight: 1.65, resize: "none", outline: "none" }}
                        />
                      </div>
                      <div>
                        <label style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", display: "block", marginBottom: "0.4rem" }}>
                          Who has authority to change the outcome?
                        </label>
                        <textarea
                          value={strengthAuthority}
                          onChange={(e) => setStrengthAuthority(e.target.value)}
                          rows={3}
                          placeholder="Name the person or role whose decision would actually change the trajectory."
                          style={{ width: "100%", padding: "16px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.35)", color: "rgba(255,255,255,0.88)", fontSize: "1rem", lineHeight: 1.65, resize: "none", outline: "none" }}
                        />
                      </div>
                      <div>
                        <label style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", display: "block", marginBottom: "0.4rem" }}>
                          What happens if no decision is made within 30 days?
                        </label>
                        <textarea
                          value={strengthConsequence}
                          onChange={(e) => setStrengthConsequence(e.target.value)}
                          rows={3}
                          placeholder="Describe the specific cost, loss, or irreversible change that occurs."
                          style={{ width: "100%", padding: "16px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.35)", color: "rgba(255,255,255,0.88)", fontSize: "1rem", lineHeight: 1.65, resize: "none", outline: "none" }}
                        />
                      </div>
                      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
                        Source: user-reported. These fields do not change the core scoring model.
                      </p>
                    </div>
                  )}
                </div>
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
              The system is designed for decisions ready to move.
            </p>
            <p style={{ marginTop: "1rem", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.48)", maxWidth: "42ch" }}>
              You can still view the analysis. The system will classify this as unresolved and track whether the pattern repeats.
            </p>
            <p style={{ marginTop: "0.75rem", fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.30)", maxWidth: "38ch" }}>
              Return when the decision has a named consequence and an owner prepared to act.
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
            <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "1.5rem" }}>Resolution</div>
            <LoadingLine />
            <div style={{ marginTop: "2rem", width: "200px", height: "3px", borderRadius: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ width: "50%", height: "100%", borderRadius: "2px", backgroundColor: GOLD, animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          </div>
        )}

        {/* Recovery */}
        {stage === "recovery" && result && (
          <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80` }}>More detail required</div>
            <p style={{ marginTop: "1rem", fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.74)", maxWidth: "40ch" }}>{result.recoveryQuestion}</p>
            <button type="button" onClick={resetDiagnostic} style={{ marginTop: "1.5rem", padding: "14px 24px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}12`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.20em", textTransform: "uppercase", cursor: "pointer" }}>
              Restart with more detail
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* RESULT SCREEN — Shared Assessment Result Surface                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {stage === "result" && result && (
          <div className="px-6 py-20">
            <div className="mx-auto max-w-2xl" style={{ display: "grid", gap: "1.5rem" }}>

              {/* ── What this reads ──────────────────────────────────────── */}
              <div style={{ borderLeft: `2px solid ${GOLD}30`, padding: "0.75rem 1.25rem", backgroundColor: `${GOLD}04` }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.4rem" }}>
                  What this reads
                </p>
                <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.60)" }}>
                  Your decision description, claimed authority, stated consequence, and optional evidence strengthener fields. It reads what you say — not what the system assumes.
                </p>
              </div>

              {/* ── What this detects ────────────────────────────────────── */}
              <div style={{ borderLeft: `2px solid ${GOLD}30`, padding: "0.75rem 1.25rem", backgroundColor: `${GOLD}04` }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.4rem" }}>
                  What this detects
                </p>
                <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.60)" }}>
                  Decision condition classification, authority posture, structural contradiction, cost-of-inaction projection, and institutional signal detection.
                </p>
              </div>

              {/* ── Shared AssessmentResultSurface ───────────────────────── */}
              <AssessmentResultSurface
                result={mappedFastAssessmentResult!}
                canSave={true}
                showConversionPanel={false}
                sendToSelfSlot={
                  <SendToSelfFastDiagnostic
                    condition={result.conditionLabel || result.condition}
                    requiredMove={result.authorityIndex?.nextGovernanceMove ?? result.synthesis?.concreteMove ?? ""}
                    caseRef={result.caseRef}
                  />
                }
              />

              {/* ── Record boundary ──────────────────────────────────────── */}
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.85rem 1.25rem", backgroundColor: "rgba(255,255,255,0.015)" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.3rem" }}>
                  Record boundary
                </p>
                <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>
                  This creates a session result until saved. Saving creates an account-bound governed case in Decision Centre with a case ID, governance implication, and next earned action.
                </p>
              </div>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* BESPOKE CONTENT BELOW — preserved for backward compatibility */}
              {/* ══════════════════════════════════════════════════════════ */}

              {/* SECTION 1: THE FINDING — one sentence */}
              <div style={{ paddingBottom: "1.5rem", borderBottom: `1px solid ${GOLD}18` }}>
                <p style={{ ...serif, fontSize: "clamp(1.3rem, 3vw, 1.8rem)", lineHeight: 1.25, color: "rgba(255,255,255,0.94)" }}>
                  {an ? an.opening : `This is ${result.conditionLabel || "a decision condition"}.`}
                </p>
                <p style={{ marginTop: "0.75rem", ...serif, fontSize: "1rem", lineHeight: 1.5, color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
                  You already know this. You&rsquo;ve been circling it.
                </p>
                {/* Evidence strengthened badge — shown only when ≥2 optional fields were completed */}
                {[strengthEvidence, strengthAuthority, strengthConsequence].filter((v) => v.trim().length > 0).length >= 2 && (
                  <span style={{ display: "inline-flex", alignItems: "center", marginTop: "0.75rem", padding: "4px 10px", border: "1px solid rgba(16,185,129,0.30)", backgroundColor: "rgba(16,185,129,0.06)", ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(16,185,129,0.70)" }}>
                    Evidence strength: Strengthened
                  </span>
                )}
              </div>

              {/* SECTION 1a: OPERATING HANDOFF — the first readable case posture */}
              <div style={{ border: `1px solid ${GOLD}30`, backgroundColor: `${GOLD}06`, padding: "1.35rem 1.5rem" }}>
                <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}AA`, marginBottom: "1rem" }}>
                  Operating handoff
                </p>
                <div style={{ display: "grid", gap: "0.9rem" }}>
                  <div>
                    <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>
                      Governance move
                    </p>
                    <p style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.65, color: "rgba(255,255,255,0.88)" }}>
                      {result.authorityIndex?.nextGovernanceMove ?? an?.requiredMove ?? result.synthesis?.concreteMove ?? "Name one accountable owner and set the next admissible move."}
                    </p>
                  </div>
                  <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                    <OperatingHandoffField
                      label="Decision state / condition"
                      value={result.conditionLabel || result.condition || "Condition not yet established"}
                    />
                    <OperatingHandoffField
                      label="Authority index"
                      value={result.authorityIndex ? `${result.authorityIndex.band} — ${result.authorityIndex.label}` : "Not yet established"}
                    />
                    <OperatingHandoffField
                      label="Comparison band"
                      value={result.comparisonBand || "Not yet available — more evidence required"}
                    />
                    <OperatingHandoffField
                      label="Cost of inaction"
                      value={result.costOfInaction
                        ? `${result.costOfInaction.exposureBand} exposure — ${result.costOfInaction.horizon30}`
                        : "Scenario exposure not yet established"}
                    />
                    <OperatingHandoffField
                      label="Record status"
                      value={committed && result.checkpointId
                        ? "Diagnostic record created · checkpoint created · governed case begins on save"
                        : "Diagnostic record created · governed case begins on save"}
                    />
                    <OperatingHandoffField
                      label="Next earned layer"
                      value="Save this as a governed case in Decision Centre."
                    />
                  </div>
                </div>
              </div>

              <SaveCaseConversionPanel
                payload={buildFastDiagnosticCarryForwardPayload({
                  result,
                  decisionLabel: answers.decision,
                })}
                surface="fast_diagnostic"
                evidenceState={mappedFastAssessmentResult ? evidenceStateFromAssessmentResult(mappedFastAssessmentResult) : "basic"}
                earnedRoute={mappedFastAssessmentResult?.earnedRoute}
              />

              {/* SECTION 1b: BOARD SUMMARY PREVIEW */}
              <BoardSummaryPreview data={buildBoardSummaryFromFastDiagnostic(result, answers)} />

              {/* SECTION 1c: CONTRADICTION MIRROR — your own words */}
              {result.synthesis?.primaryContradiction && (
                <div style={{ borderLeft: `2px solid ${GOLD}30`, padding: "0.75rem 1.25rem", backgroundColor: `${GOLD}04` }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.5rem" }}>The contradiction</p>
                  <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.80)" }}>
                    {result.synthesis.primaryContradiction}
                  </p>
                </div>
              )}
              {answers.decision && answers.consequence && (
                <div style={{ padding: "0.5rem 0" }}>
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>
                    You said the decision is: <span style={{ color: "rgba(255,255,255,0.60)" }}>&ldquo;{answers.decision.slice(0, 120)}&rdquo;</span>
                  </p>
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", marginTop: "0.25rem" }}>
                    You said the cost is: <span style={{ color: "rgba(255,255,255,0.60)" }}>&ldquo;{answers.consequence.slice(0, 120)}&rdquo;</span>
                  </p>
                  {answers.claimedOwner && (
                    <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", marginTop: "0.25rem" }}>
                      You said the owner is: <span style={{ color: "rgba(255,255,255,0.60)" }}>&ldquo;{answers.claimedOwner.slice(0, 80)}&rdquo;</span>
                    </p>
                  )}
                </div>
              )}

              {/* SECTION 1d: NAMED SIGNAL — SIGNAL SUPREMACY institutional intelligence layer */}
              {result.detectedSignals && result.detectedSignals.length > 0 && (() => {
                const primary = result.detectedSignals[0]!;
                const severityColors: Record<string, string> = {
                  CRITICAL: "rgba(239,68,68,0.75)",
                  ALERT: "rgba(249,115,22,0.72)",
                  CONCERN: "rgba(251,191,36,0.70)",
                  WATCH: "rgba(110,231,183,0.60)",
                };
                const severityBg: Record<string, string> = {
                  CRITICAL: "rgba(239,68,68,0.05)",
                  ALERT: "rgba(249,115,22,0.04)",
                  CONCERN: "rgba(251,191,36,0.03)",
                  WATCH: "rgba(110,231,183,0.03)",
                };
                const sc = severityColors[primary.severityBand] ?? `${GOLD}80`;
                const sb = severityBg[primary.severityBand] ?? `${GOLD}04`;
                return (
                  <div style={{ border: `1px solid ${sc}30`, backgroundColor: sb, padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: sc, flexShrink: 0 }}>
                        {primary.severityBand}
                      </span>
                      <span style={{ height: "1px", flex: 1, backgroundColor: `${sc}25` }} />
                      <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                        {primary.prevalenceLabel.split("—")[0]?.trim()}
                      </span>
                    </div>
                    <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.3, color: "rgba(255,255,255,0.92)", marginBottom: "0.5rem" }}>
                      {primary.signalName}
                    </p>
                    <p style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "rgba(255,255,255,0.42)", fontStyle: "italic" }}>
                      {primary.patternTag}
                    </p>
                    {result.detectedSignals.length > 1 && (
                      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginTop: "0.75rem" }}>
                        {result.detectedSignals.length - 1} further signal{result.detectedSignals.length > 2 ? "s" : ""} detected
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* SECTION 2: THE PATTERN */}
              <ResultBlock label="What the system found">
                {an?.whyItExists ?? result.synthesis?.whyPriorAttemptsFailed ?? result.synthesis?.primaryContradiction ?? "The decision exists, but it does not have clean authority. It cannot move in its current form."}
              </ResultBlock>

              {/* SECTION 3: THE REQUIRED MOVE — promoted above secondary intelligence */}
              <div style={{ border: `1px solid ${GOLD}25`, backgroundColor: `${GOLD}06`, padding: "1.25rem 1.5rem" }}>
                <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90` }}>Required move</div>
                <p style={{ marginTop: "0.6rem", ...serif, fontSize: "1.05rem", lineHeight: 1.65, color: "rgba(255,255,255,0.85)" }}>
                  {an?.requiredMove ?? result.synthesis?.concreteMove ?? "Assign one accountable owner. Remove competing authority. Force a decision window. Anything less will preserve the current outcome."}
                </p>
              </div>

              {/* SECTION 3b: GOVERNANCE MOVE — elevated from collapsible, shown when authorityIndex present */}
              {result.authorityIndex && (
                <div style={{ border: `1px solid ${GOLD}35`, backgroundColor: `${GOLD}07`, padding: "1.5rem" }}>
                  <div style={{ ...mono, fontSize: "9px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}AA`, marginBottom: "0.75rem" }}>
                    Governance move
                  </div>

                  {/* Next governance move — primary field */}
                  <p style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.7, color: "rgba(255,255,255,0.88)" }}>
                    {result.authorityIndex.nextGovernanceMove}
                  </p>

                  {/* Authority band + label */}
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: `1px solid ${GOLD}18`, display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
                    <div>
                      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.25rem" }}>Authority band</p>
                      <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.10em", color: `${GOLD}CC` }}>{result.authorityIndex.band}</p>
                    </div>
                    <div>
                      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.25rem" }}>Classification</p>
                      <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.58)" }}>{result.authorityIndex.label}</p>
                    </div>
                    {result.comparisonBand && (
                      <div>
                        <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.25rem" }}>
                          Comparison band{result.comparisonMaturityLevel != null ? ` — maturity ${result.comparisonMaturityLevel}/5` : ""}
                        </p>
                        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.52)" }}>{result.comparisonBand}</p>
                      </div>
                    )}
                  </div>

                  {/* Repeated conditions — structural memory signal */}
                  {result.memoryTrend && result.memoryTrend.repeatedConditions.length > 0 && (
                    <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: `1px solid ${GOLD}18` }}>
                      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.4rem" }}>
                        Repeated conditions — structural memory
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {result.memoryTrend.repeatedConditions.map((c, i) => (
                          <span key={i} style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(252,165,165,0.65)", backgroundColor: "rgba(252,165,165,0.04)", border: "1px solid rgba(252,165,165,0.12)", padding: "0.2rem 0.55rem" }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Board meaning — if present */}
                  {result.authorityIndex.boardMeaning && (
                    <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: `1px solid ${GOLD}18` }}>
                      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.35rem" }}>Board implication</p>
                      <p style={{ fontSize: "0.84rem", lineHeight: 1.65, color: "rgba(255,255,255,0.50)" }}>{result.authorityIndex.boardMeaning}</p>
                    </div>
                  )}

                </div>
              )}

              {/* SECTION 4: COST OF INACTION */}
              <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem 1.5rem" }}>
                <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80` }}>Cost of inaction — if unresolved</div>
                <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.65rem" }}>
                  <CostLine label="30 days" text={an?.costOfInaction.thirtyDays ?? result.costOfInaction?.horizon30 ?? "Delay becomes normalised. Workarounds emerge."} />
                  <CostLine label="60 days" text={an?.costOfInaction.sixtyDays ?? result.costOfInaction?.horizon60 ?? "Resources are spent without forward movement."} />
                  <CostLine label="90 days" text={an?.costOfInaction.ninetyDays ?? result.costOfInaction?.horizon90 ?? "The cost of reversing direction exceeds the cost of deciding now."} />
                </div>
                <p style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.20)", marginTop: "0.75rem" }}>
                  Based on your stated decision context and declared consequence. Scenario only — not a financial forecast.
                </p>
              </div>

              {/* SECTION 5: YOUR COMMITMENT */}
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem 1.25rem" }}>
                <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: committed ? "rgba(110,231,183,0.55)" : "rgba(255,255,255,0.25)" }}>
                  {committed ? "Commitment accepted — 48-hour window active" : "No commitment recorded — readiness unresolved"}
                </div>
                <p style={{ marginTop: "0.35rem", fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.40)" }}>
                  {committed
                    ? "You committed to act within 48 hours if the system identified the real blocker. The system will track whether this happens."
                    : "Without a commitment window, the reading remains diagnostic. Return when you are prepared to act."}
                </p>
              </div>

              {/* SECTION 5b: CHECKPOINT CREATED */}
              {committed && (
                <div style={{ border: "1px solid rgba(110,231,183,0.15)", backgroundColor: "rgba(110,231,183,0.03)", padding: "1rem 1.25rem" }}>
                  <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.50)" }}>
                    Checkpoint scheduled
                  </div>
                  <p style={{ marginTop: "0.35rem", fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.50)" }}>
                    In 48 hours, the system will ask whether you acted on the identified blocker.
                    Your response will be recorded and will affect how the system governs this case.
                  </p>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginTop: "0.5rem" }}>
                    Checkpoint visible in Decision Centre when due
                  </p>
                </div>
              )}

              {/* SECTION 5c: WHAT WAS CREATED */}
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem 1.25rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "0.6rem" }}>
                  What was created
                </p>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  <div style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "10px" }}>
                    <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}99` }}>
                      Diagnostic record
                    </p>
                    <p style={{ fontSize: "0.8rem", lineHeight: 1.5, color: "rgba(255,255,255,0.45)" }}>
                      The finding, condition, authority index, comparison band, and recommended governance move.
                    </p>
                  </div>
                  <div style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "10px" }}>
                    <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}99` }}>
                      Governed case
                    </p>
                    <p style={{ fontSize: "0.8rem", lineHeight: 1.5, color: "rgba(255,255,255,0.45)" }}>
                      Created when you save this reading into Decision Centre.
                    </p>
                  </div>
                  {committed && (
                    <div style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "10px" }}>
                      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}99` }}>
                        Checkpoint
                      </p>
                      <p style={{ fontSize: "0.8rem", lineHeight: 1.5, color: "rgba(255,255,255,0.45)" }}>
                        Created only if you accepted a commitment or review trigger.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <ClientIntelligenceStack
                scope={{
                  caseId: result.caseRef ?? null,
                  sourceSurface: "FAST_DIAGNOSTIC",
                  scopeLabel: "Fast Diagnostic case",
                  scopeType: "CASE",
                }}
                showVelocity
                fallbackVelocitySummary={fallbackVelocitySummary}
              />

              {/* SECTION 5e: RETURN BRIEF PROMISE */}
              {committed && (
                <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem 1.25rem" }}>
                  <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                    The system will remember this
                  </div>
                  <p style={{ marginTop: "0.35rem", fontSize: "0.85rem", lineHeight: 1.55, color: "rgba(255,255,255,0.45)" }}>
                    If this remains unresolved, your Return Brief will confront the gap between what you committed to do and what actually happened. This is not optional feedback — it is governed memory.
                  </p>
                </div>
              )}

              {/* SECTION 5f: SIGNAL NARRATIVE — full explanation when signal detected */}
              {result.detectedSignals && result.detectedSignals.length > 0 && (() => {
                const primary = result.detectedSignals[0]!;
                return (
                  <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem 1.5rem" }}>
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.75rem" }}>
                      Institutional pattern — {primary.signalName}
                    </p>
                    <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)" }}>
                      {primary.narrativeSummary}
                    </p>
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.4rem" }}>
                        What changes the outcome
                      </p>
                      <p style={{ fontSize: "0.84rem", lineHeight: 1.6, color: "rgba(255,255,255,0.50)" }}>
                        {primary.differentiatorSummary}
                      </p>
                    </div>
                    <div style={{ marginTop: "0.75rem" }}>
                      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.4rem" }}>
                        Next admissible move
                      </p>
                      <p style={{ fontSize: "0.84rem", lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
                        {primary.admissibleNextMove}
                      </p>
                    </div>
                    {result.comparisonBand && (
                      <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                            Comparison band
                          </p>
                          {result.comparisonMaturityLevel != null && (
                            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.15)" }}>
                              Distribution maturity {result.comparisonMaturityLevel}/5
                            </p>
                          )}
                        </div>
                        <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.42)" }}>
                          {result.comparisonBand}
                        </p>
                        {result.comparisonBasisLabel && (
                          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.18)", marginTop: "0.2rem", lineHeight: 1.5 }}>
                            {result.comparisonBasisLabel}
                          </p>
                        )}
                      </div>
                    )}
                    <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.16)", marginTop: "0.75rem", lineHeight: 1.6 }}>
                      {primary.sampleCaveat}
                    </p>
                  </div>
                );
              })()}

              {/* SECTION 6: NEXT INSTRUMENT — from recommendation engine */}
              <div style={{ padding: "1.5rem 0", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.45)", marginBottom: "1rem" }}>
                  {an?.cta ?? "Your decision pattern is now on record. The next step determines whether this becomes a structural correction or a repeated pattern."}
                </p>
                {(() => {
                  const rec = recommendNextInstrument({
                    sourceSurface: "fast_diagnostic",
                    condition: result.condition,
                    authorityGap: result.condition === "authority",
                    ownershipGap: result.condition === "authority" || /(everyone|the team|shared|unclear)/i.test(answers.claimedOwner || ""),
                    interventionUnclear: result.condition === "definition",
                    consequenceHigh: result.signalStrength === "high",
                    executionBlocked: result.condition === "execution",
                    evidenceInsufficient: result.signalStrength === "low",
                    preCommitmentMissing: !committed,
                  });
                  return rec ? (
                    <ProductRecommendationCard recommendation={rec} variant="dark" />
                  ) : null;
                })()}
              </div>

              {/* SECTION 7: EVIDENCE & GOVERNANCE — collapsible below the fold */}
              <details style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem 1.25rem" }}>
                <summary style={{ cursor: "pointer", ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Evidence &amp; governance — {result.signalStrength} reading strength
                </summary>
                <div style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>

                  {/* Authority + execution summary */}
                  <ExecutiveDecisionAuthorityBlock authorityIndex={result.authorityIndex} costOfInaction={result.costOfInaction} executionFailure={result.executionFailure} />

                  {/* Intelligence summary */}
                  <IntelligenceGainPanel
                    stage="Fast Diagnostic"
                    findings={[
                      ...(result.condition ? [{ label: "Condition", value: result.conditionLabel || result.condition }] : []),
                      ...(result.synthesis?.primaryContradiction ? [{ label: "Contradiction", value: result.synthesis.primaryContradiction }] : []),
                      ...(result.authorityIndex ? [{ label: "Authority", value: `${result.authorityIndex.band} — ${result.authorityIndex.label}` }] : []),
                      ...(result.costOfInaction ? [{ label: "Exposure", value: result.costOfInaction.exposureBand }] : []),
                      ...(result.executionFailure ? [{ label: "Failure mode", value: result.executionFailure.likelyFailureMode }] : []),
                      ...(result.detectedSignals && result.detectedSignals.length > 0 ? [{ label: "Signal", value: `${result.detectedSignals[0]!.severityBand} — ${result.detectedSignals[0]!.signalName}` }] : []),
                      ...(result.comparisonBand ? [{ label: "Comparison band", value: result.comparisonBand }] : []),
                    ]}
                  />

                  {/* Evidence strength */}
                  <EvidenceStrengthMeter
                    level="single_source"
                    stagesCompleted={1}
                    whatWouldStrengthen={
                      result.signalStrength === "low"
                        ? "Provide more specific detail about the decision, owner, and consequence to strengthen this reading."
                        : "Add an Internal Constraint or Governance Diagnostic to move from single-source to multi-source evidence."
                    }
                  />

                  {/* How this was determined */}
                  <div>
                    <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.5rem" }}>How this was determined</div>
                    <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
                      You indicated: {answers.decision || "an unresolved decision"}, under authority held by {answers.claimedOwner || "an unclear owner"}, with consequence described as {answers.consequence || "increasing cost"}.
                    </p>
                    <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", marginTop: "0.5rem" }}>
                      This combination typically produces decision drift because the structure carrying the decision is weaker than the urgency surrounding it.
                    </p>
                  </div>

                  {/* Pattern evidence */}
                  {result.patternEvidence && (
                    <div>
                      <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "0.35rem" }}>Recognised pattern</div>
                      <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
                        {result.patternEvidence.recognitionLine}
                      </p>
                    </div>
                  )}

                  {/* Outcome memory */}
                  {result.memoryTrend && result.memoryTrend.totalDecisions > 0 && (
                    <OutcomeMemoryPreview
                      entries={result.memoryTrend.repeatedConditions.map((c, i) => ({
                        stage: "Prior reading",
                        date: "",
                        finding: c,
                      }))}
                      dominantPattern={result.memoryTrend.dominantState}
                      escalationTrend={result.memoryTrend.escalationTrend}
                    />
                  )}

                  {/* Review message */}
                  {result.reviewMessage && (
                    <p style={{ fontSize: "0.82rem", color: "rgba(252,165,165,0.55)" }}>{result.reviewMessage}</p>
                  )}

                  {/* Governance disclosures */}
                  <ArbiterBadge context="fast_diagnostic" variant="dark" />
                  <HumanReviewPrompt context="Fast Diagnostic" />
                  <GovernanceDisclosure context="fast_diagnostic" compact />
                  <DiagnosticStandardPanel />

                  {/* Re-evaluation note */}
                  <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                    This pattern is commonly seen before structural correction. This reading can be tracked over time. Re-evaluate in 14 days to see whether the pattern improves or repeats.
                  </p>

                </div>
              </details>

              {/* Email capture — below the fold, after value is proven */}
              <ResultEmailCapture source="fast_diagnostic" resultRef={result.caseRef} />

              {/* Send-to-self bridge — for users who do not want to create an account */}
              <SendToSelfFastDiagnostic
                condition={result.conditionLabel || result.condition || ""}
                requiredMove={result.anchorNarrative?.requiredMove || result.synthesis?.concreteMove || ""}
                caseRef={result.caseRef || ""}
              />

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
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
        {label}
      </div>
      <p style={{ marginTop: "0.5rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.97rem", lineHeight: 1.72, color: "rgba(255,255,255,0.72)" }}>
        {children}
      </p>
    </div>
  );
}

function OperatingHandoffField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.7rem" }}>
      <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.3rem" }}>
        {label}
      </p>
      <p style={{ fontSize: "0.84rem", lineHeight: 1.55, color: "rgba(255,255,255,0.62)" }}>
        {value}
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
      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginRight: "0.75rem" }}>{label}:</span>
      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.68)" }}>{text}</span>
    </div>
  );
}

function SendToSelfFastDiagnostic({
  condition,
  requiredMove,
  caseRef,
}: {
  condition: string;
  requiredMove: string;
  caseRef: string;
}) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/tools/send-to-self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: "fast_diagnostic",
          content: {
            title: `Diagnostic finding: ${condition}`,
            summary: `Case reference: ${caseRef}. The system identified a ${condition} condition with the recommended governance move below.`,
            nextMove: requiredMove,
          },
        }),
      });
      const json = await response.json();
      if (json.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div style={{ marginTop: "16px", borderLeft: `2px solid rgba(110,231,183,0.25)`, backgroundColor: "rgba(110,231,183,0.02)", padding: "12px 16px" }}>
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(110,231,183,0.55)" }}>
          Sent. Check your inbox.
        </p>
        <p style={{ ...serif, fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.40)", marginTop: "4px" }}>
          This does not create a governed case. To carry this forward, save it in Decision Centre or return when ready.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "16px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "14px 18px" }}>
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "8px" }}>
        Send this governance move to my email
      </p>
      <p style={{ ...serif, fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.40)", marginBottom: "10px" }}>
        We will send this result to the email you provide. This does not create a governed case unless you create an account.
      </p>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder="your@email.com"
          autoComplete="email"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.10)",
            backgroundColor: "transparent",
            color: "rgba(255,255,255,0.80)",
            ...mono,
            fontSize: "12px",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={status === "sending" || !email.trim()}
          style={{
            padding: "10px 16px",
            border: `1px solid ${GOLD}40`,
            backgroundColor: `${GOLD}10`,
            color: `${GOLD}CC`,
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: status === "sending" ? "wait" : "pointer",
            opacity: status === "sending" ? 0.7 : 1,
            flexShrink: 0,
            minHeight: "40px",
          }}
        >
          {status === "sending" ? "Sending..." : "Send"}
        </button>
      </div>
      {status === "error" && (
        <p style={{ marginTop: "8px", fontSize: "12px", color: "rgba(252,165,165,0.55)" }}>
          Could not send. Try again later.
        </p>
      )}
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.16)", marginTop: "8px" }}>
        No marketing. No account created. One email only.
      </p>
    </div>
  );
}

export default FastDiagnosticPage;

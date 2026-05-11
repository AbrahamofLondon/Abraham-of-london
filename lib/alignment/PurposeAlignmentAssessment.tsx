"use client";

import React from "react";

import DualAxisInput from "@/components/diagnostics/DualAxisInput";
import DecisionChallengeCard from "@/components/diagnostics/DecisionChallengeCard";
import ProgressIndicator from "@/components/diagnostics/ProgressIndicator";
import PurposeAlignmentFreeResultSurface from "@/components/alignment/PurposeAlignmentFreeResultSurface";
import PurposeAlignmentPaidResultSurface from "@/components/alignment/PurposeAlignmentPaidResultSurface";
import { trackLaunch } from "@/lib/analytics/client-launch-events";
import { PURPOSE_ALIGNMENT_QUESTIONS } from "@/lib/alignment/checklist";
import { scorePurposeProfile } from "@/lib/alignment/scoring";
import type { AlignmentDomain, DualAxisAnswer, PurposeProfileResult } from "@/lib/alignment/types";
import {
  clearAssessmentState,
  loadAssessmentState,
  saveAssessmentState,
  type AssessmentCurrentStep,
  type PurposeAssessmentSnapshot,
} from "@/lib/client/assessment-state";
import { detectDualAxisIntegrityChallenge } from "@/lib/client/assessment-integrity";

type Props = {
  onScored?: (result: PurposeProfileResult, answers: Record<string, DualAxisAnswer>) => void;
  /** Pre-assessment entitlement flag — set true when user has paid entitlement before starting */
  isPaidEntitled?: boolean;
};

type Phase = "context" | "signal" | "result";

type ContextAnswers = {
  avoidedDecision: string;
  competingObligation: string;
  consequence: string;
};

type AnchorNarrativeShape = {
  opening: string;
  condition: string;
  whyItExists: string;
  pattern: string;
  costOfInaction: { thirtyDays: string; sixtyDays: string; ninetyDays: string };
  perspective: string;
  requiredMove: string;
  cta: string;
};

type ChallengeResult = {
  severity: "none" | "clarify" | "challenge" | "block";
  type?:
    | "vague_decision"
    | "missing_owner"
    | "shared_authority"
    | "weak_consequence"
    | "contradiction"
    | "avoidance_language"
    | "no_action_commitment"
    | "insufficient_evidence";
  challengeText?: string;
  clarificationPrompt?: string;
  suggestedOptions?: string[];
  canProceed: boolean;
};

const CONTEXT_STEPS = [
  {
    id: "avoidedDecision" as const,
    label: "Step 1 of 3",
    question: "What decision are you currently avoiding or deferring?",
    helper: "Name the specific choice, not the general direction.",
    placeholder: "e.g. Leave current role / Confront a relationship / Commit to a new direction",
  },
  {
    id: "competingObligation" as const,
    label: "Step 2 of 3",
    question: "What competing obligation or priority is pulling against that decision?",
    helper: "This is usually the thing you are protecting while the decision waits.",
    placeholder: "e.g. Financial stability / Family expectations / Current commitments",
  },
  {
    id: "consequence" as const,
    label: "Step 3 of 3",
    question: "What becomes worse if this remains unresolved?",
    helper: "Be specific. Vague consequences produce vague analysis.",
    placeholder: "e.g. I continue doing delivery work myself and delay commercial outreach",
  },
] as const;

const LOADING_LINES = [
  "Evaluating structural alignment…",
  "Mapping contradictions…",
  "Projecting consequences…",
];

const INITIAL_CONTEXT: ContextAnswers = {
  avoidedDecision: "",
  competingObligation: "",
  consequence: "",
};

function createInitialResponses() {
  return Object.fromEntries(
    PURPOSE_ALIGNMENT_QUESTIONS.map((question) => [
      question.id,
      { resonance: 5, certainty: 5 },
    ]),
  ) as Record<string, DualAxisAnswer>;
}

function currentStepFromState(phase: Phase, contextStep: number): AssessmentCurrentStep {
  if (phase === "signal" || phase === "result") return "signal";
  return `context-${contextStep}` as AssessmentCurrentStep;
}

function phaseFromStoredStep(step: AssessmentCurrentStep): { phase: Phase; contextStep: number } {
  if (step === "signal") return { phase: "signal", contextStep: 2 };
  return { phase: "context", contextStep: Number(step.replace("context-", "")) || 0 };
}

function domainHeading(domain: AlignmentDomain) {
  return domain.replaceAll("_", " ");
}

function toneClassForStep(active: boolean) {
  return active
    ? "translate-y-0 opacity-100 duration-500"
    : "translate-y-2 opacity-0 duration-300";
}

export default function PurposeAlignmentAssessment({ onScored, isPaidEntitled }: Props) {
  const [phase, setPhase] = React.useState<Phase>("context");
  const [contextStep, setContextStep] = React.useState(0);
  const [contextAnswers, setContextAnswers] = React.useState<ContextAnswers>(INITIAL_CONTEXT);
  const [responses, setResponses] = React.useState<Record<string, DualAxisAnswer>>(createInitialResponses);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [result, setResult] = React.useState<PurposeProfileResult | null>(null);
  const [anchorNarrative, setAnchorNarrative] = React.useState<AnchorNarrativeShape | null>(null);
  const [socialProof, setSocialProof] = React.useState<string>("");
  const [assessmentId, setAssessmentId] = React.useState<string>("");
  const [challenge, setChallenge] = React.useState<ChallengeResult | null>(null);
  const [challengeLoading, setChallengeLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingLineIndex, setLoadingLineIndex] = React.useState(0);
  const [analysisError, setAnalysisError] = React.useState<string>("");
  const [resumeState, setResumeState] = React.useState<PurposeAssessmentSnapshot | null>(null);
  const [captureBusy, setCaptureBusy] = React.useState(false);
  const [captureEmail, setCaptureEmail] = React.useState("");
  const [captureMessage, setCaptureMessage] = React.useState("");
  const [signalPage, setSignalPage] = React.useState(0);
  const [startedAt] = React.useState(() => new Date().toISOString());
  const startedAtMs = React.useRef(Date.now());
  const pendingAdvanceRef = React.useRef<null | (() => void)>(null);
  const [isPaid, setIsPaid] = React.useState(Boolean(isPaidEntitled));
  const [paidResult, setPaidResult] = React.useState<import("@/lib/alignment/purpose-alignment-paid-contract").PurposeAlignmentPaidResult | null>(null);

  React.useEffect(() => {
    trackLaunch("purpose_alignment_started", "purpose_alignment");
    try {
      if (sessionStorage.getItem("aol_purpose_fresh_session")) return;
    } catch { /* ignore */ }
    const stored = loadAssessmentState();
    if (stored) setResumeState(stored);
  }, []);

  React.useEffect(() => {
    if (phase === "result") return;
    saveAssessmentState({
      contextAnswers,
      dualAxisResponses: responses,
      currentStep: currentStepFromState(phase, contextStep),
      timestamp: new Date().toISOString(),
    });
  }, [contextAnswers, responses, phase, contextStep]);

  React.useEffect(() => {
    if (!submitting) return;
    const timer = window.setInterval(() => {
      setLoadingLineIndex((current) => (current + 1) % LOADING_LINES.length);
    }, 1300);
    return () => window.clearInterval(timer);
  }, [submitting]);

  async function runChallenge(stage: string): Promise<ChallengeResult | null> {
    setChallengeLoading(true);
    setChallenge(null);

    try {
      const response = await fetch("/api/diagnostics/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentType: "purpose",
          stage,
          answers: contextAnswers,
        }),
      });

      if (!response.ok) return null;
      const json = (await response.json()) as { ok: boolean } & ChallengeResult;
      if (!json.ok || json.severity === "none") return null;
      setChallenge(json);
      return json;
    } catch {
      return null;
    } finally {
      setChallengeLoading(false);
    }
  }

  function applyResume(snapshot: PurposeAssessmentSnapshot) {
    const stepState = phaseFromStoredStep(snapshot.currentStep);
    setContextAnswers(snapshot.contextAnswers);
    setResponses(snapshot.dualAxisResponses);
    setPhase(stepState.phase);
    setContextStep(stepState.contextStep);
    setTouched(
      Object.fromEntries(Object.keys(snapshot.dualAxisResponses).map((key) => [key, true])),
    );
    setResumeState(null);
  }

  function discardResume() {
    clearAssessmentState();
    setResumeState(null);
    try { sessionStorage.setItem("aol_purpose_fresh_session", "1"); } catch { /* ignore */ }
  }

  function dismissChallenge() {
    setChallenge(null);
    pendingAdvanceRef.current = null;
  }

  function queueAdvance(next: () => void) {
    pendingAdvanceRef.current = next;
  }

  function acceptChallenge() {
    const next = pendingAdvanceRef.current;
    setChallenge(null);
    pendingAdvanceRef.current = null;
    next?.();
  }

  async function advanceContext() {
    const step = CONTEXT_STEPS[contextStep]!;
    const value = contextAnswers[step.id].trim();
    if (value.length < 5) return;

    const next = () => {
      if (contextStep < CONTEXT_STEPS.length - 1) {
        setContextStep((prev) => prev + 1);
      } else {
        setPhase("signal");
      }
    };

    const stage =
      contextStep === 0 ? "stated_purpose" : contextStep === 1 ? "competing_obligation" : "pre_result";
    const hit = await runChallenge(stage);

    if (!hit) {
      next();
      return;
    }

    if (hit.severity === "block") {
      pendingAdvanceRef.current = null;
      return;
    }

    queueAdvance(next);
  }

  function updateResponse(questionId: string, next: DualAxisAnswer) {
    setResponses((prev) => ({
      ...prev,
      [questionId]: next,
    }));
    setTouched((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  }

  async function persistAssessment(nextResult: PurposeProfileResult, answers: Record<string, DualAxisAnswer>) {
    setSubmitting(true);
    setAnalysisError("");
    setLoadingLineIndex(0);

    try {
      const response = await fetch("/api/purpose-alignment/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          reflections: {
            avoidedDecision: contextAnswers.avoidedDecision || null,
            lastSevenDays: contextAnswers.consequence || null,
            dissenter: contextAnswers.competingObligation || null,
            consequence: contextAnswers.consequence || null,
            competingObligation: contextAnswers.competingObligation || null,
          },
          clientMeta: {
            startedAt,
            submittedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "We could not complete analysis.");
      }

      const json = (await response.json()) as {
        assessmentId?: string;
        anchorNarrative?: AnchorNarrativeShape;
        result?: PurposeProfileResult;
        socialProof?: string;
        isPaid?: boolean;
        paidResult?: import("@/lib/alignment/purpose-alignment-paid-contract").PurposeAlignmentPaidResult;
      };

      if (json.result) {
        setResult(json.result);
        onScored?.(json.result, answers);
      }
      if (json.anchorNarrative) setAnchorNarrative(json.anchorNarrative);
      if (json.socialProof) setSocialProof(json.socialProof);
      if (json.assessmentId) setAssessmentId(json.assessmentId);
      if (json.isPaid) {
        setIsPaid(true);
        if (json.paidResult) setPaidResult(json.paidResult);
      }
      trackLaunch("purpose_alignment_completed", "purpose_alignment", { caseId: json.assessmentId ?? undefined });
      clearAssessmentState();
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "We could not complete analysis. Your responses are saved. Retry?",
      );
      setResult(nextResult);
      onScored?.(nextResult, answers);
    } finally {
      setSubmitting(false);
      setPhase("result");
    }
  }

  async function handleScore() {
    const answers = responses;
    const localResult = scorePurposeProfile({
      answers,
      context: {
        reflections: {
          avoidedDecision: contextAnswers.avoidedDecision || null,
          lastSevenDays: contextAnswers.consequence || null,
          dissenter: contextAnswers.competingObligation || null,
        },
      },
    });

    setResult(localResult);
    await persistAssessment(localResult, answers);
  }

  async function retryAnalysis() {
    if (!result) return;
    await persistAssessment(result, responses);
  }

  async function handleCapture(isAnonymous: boolean) {
    if (!assessmentId) {
      setCaptureMessage("Result stored locally. Complete server analysis to enable tracking.");
      return;
    }

    setCaptureBusy(true);
    setCaptureMessage("");

    try {
      const response = await fetch("/api/purpose-alignment/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          email: isAnonymous ? "" : captureEmail,
          cadenceDays: 14,
          isEnabled: !isAnonymous,
        }),
      });

      const json = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !json.ok) {
        throw new Error(json.error || "Capture failed");
      }

      setCaptureMessage(
        isAnonymous
          ? "Result saved. Structural pattern tracking is active for this session."
          : "Result saved. Re-evaluation is scheduled for 14 days.",
      );
    } catch (error) {
      setCaptureMessage(error instanceof Error ? error.message : "Capture failed.");
    } finally {
      setCaptureBusy(false);
    }
  }

  const currentPrompt = CONTEXT_STEPS[contextStep]!;
  const touchedCount = Object.values(touched).filter(Boolean).length;
  const allSignalTouched = touchedCount === PURPOSE_ALIGNMENT_QUESTIONS.length;

  return (
    <div className="bg-[linear-gradient(180deg,#f7f3ec_0%,#fbfaf7_32%,#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8">
        {resumeState ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
              Resume your assessment?
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-700">
              A previous session was found from {new Date(resumeState.timestamp).toLocaleString("en-GB")}.
              Resume where you left off or discard it and start clean.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => applyResume(resumeState)}
                className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
              >
                Resume assessment
              </button>
              <button
                type="button"
                onClick={discardResume}
                className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
              >
                Discard saved state
              </button>
            </div>
          </div>
        ) : null}

        <header className="grid gap-5 rounded-[32px] border border-neutral-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.28em] text-[#8a6a2f]">
            Alignment under pressure — decision, behaviour, consequence
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl font-serif text-4xl leading-tight text-neutral-950 sm:text-5xl">
                Where is your direction breaking down?
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-700">
                This is not a confidence exercise. It is a structural reading of the decision under pressure,
                the signal supporting it, and the consequence if the pattern remains untouched.
              </p>
            </div>
            <div className="rounded-[24px] border border-neutral-200 bg-[#faf7f0] p-4">
              <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                Input fidelity
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                High-resolution input produces a verdict people trust. Rate both truth and certainty.
              </p>
            </div>
          </div>

          <ProgressIndicator current={phase === "result" ? "result" : phase === "signal" ? "signal" : "context"} />
        </header>

        {phase === "context" ? (
          <section className={`rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8 ${toneClassForStep(true)}`}>
            <div className="max-w-3xl">
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                {currentPrompt.label}
              </div>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-neutral-950">
                {currentPrompt.question}
              </h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">{currentPrompt.helper}</p>
              <textarea
                value={contextAnswers[currentPrompt.id]}
                onChange={(event) =>
                  setContextAnswers((prev) => ({
                    ...prev,
                    [currentPrompt.id]: event.target.value,
                  }))
                }
                rows={5}
                placeholder={currentPrompt.placeholder}
                className="mt-5 min-h-[160px] w-full rounded-[24px] border border-neutral-200 bg-[#fcfbf8] p-4 text-base leading-7 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
            </div>

            {challengeLoading ? (
              <p className="mt-4 text-sm text-neutral-500">Testing for structural conflict…</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {contextStep > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    dismissChallenge();
                    setContextStep((prev) => prev - 1);
                  }}
                  className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
                >
                  Previous
                </button>
              ) : null}
              <button
                type="button"
                onClick={advanceContext}
                disabled={contextAnswers[currentPrompt.id].trim().length < 5}
                className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                {contextStep === CONTEXT_STEPS.length - 1 ? "Continue to signal" : "Continue"}
              </button>
            </div>
          </section>
        ) : null}

        {phase === "signal" ? (() => {
          const DOMAIN_GROUPS: AlignmentDomain[][] = [
            ["identity", "decision"],
            ["environment", "behaviour"],
            ["emotional_order", "legacy"],
          ];
          const currentGroup = DOMAIN_GROUPS[signalPage] ?? DOMAIN_GROUPS[0]!;
          const groupQuestions = PURPOSE_ALIGNMENT_QUESTIONS.filter((q) => currentGroup.includes(q.domain));
          const groupTouched = groupQuestions.every((q) => touched[q.id]);
          const isLastPage = signalPage === DOMAIN_GROUPS.length - 1;

          return (
            <section className={`grid gap-6 ${toneClassForStep(true)}`}>
              <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                      Signal {signalPage + 1} of {DOMAIN_GROUPS.length}
                    </div>
                    <h2 className="mt-3 font-serif text-3xl leading-tight text-neutral-950">
                      Rate each statement for truth and certainty.
                    </h2>
                  </div>
                  <div className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-700">
                    {touchedCount} / {PURPOSE_ALIGNMENT_QUESTIONS.length} conditions interrogated
                  </div>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600">
                  Low certainty softens the signal. High certainty hardens it. Wide gaps expose contradiction.
                </p>
              </div>

              {currentGroup.map((domain) => (
                <div key={domain} className="grid gap-4">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
                    {domainHeading(domain)}
                  </div>
                  {PURPOSE_ALIGNMENT_QUESTIONS.filter((question) => question.domain === domain).map((question) => (
                    <DualAxisInput
                      key={question.id}
                      question={question}
                      value={responses[question.id]!}
                      touched={Boolean(touched[question.id])}
                      onChange={(next) => updateResponse(question.id, next)}
                    />
                  ))}
                </div>
              ))}

              <div className="sticky bottom-3 z-20 rounded-[28px] border border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-neutral-700">
                    {isLastPage
                      ? "Move only when every statement has been touched. Precision matters more than speed."
                      : `${groupQuestions.length} statements in this group. Complete them to continue.`}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        dismissChallenge();
                        if (signalPage > 0) setSignalPage(signalPage - 1);
                        else setPhase("context");
                      }}
                      className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
                    >
                      {signalPage > 0 ? "Previous" : "Revise context"}
                    </button>
                    {isLastPage ? (
                      <button
                        type="button"
                        onClick={() => {
                          const integrityHit = detectDualAxisIntegrityChallenge({
                            answers: responses,
                            startedAt: startedAtMs.current,
                            submittedAt: Date.now(),
                          });
                          if (integrityHit) {
                            setChallenge(integrityHit);
                            queueAdvance(handleScore);
                            return;
                          }
                          handleScore();
                        }}
                        disabled={!allSignalTouched || submitting}
                        className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Continue to verdict
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (groupTouched) {
                            const groupAnswers = Object.fromEntries(
                              groupQuestions.map((q) => [q.id, responses[q.id]!]),
                            );
                            const integrityHit = detectDualAxisIntegrityChallenge({
                              answers: groupAnswers,
                              minimumAnswers: 4,
                            });
                            if (integrityHit) {
                              setChallenge(integrityHit);
                              queueAdvance(() => setSignalPage(signalPage + 1));
                              return;
                            }
                            setSignalPage(signalPage + 1);
                          }
                        }}
                        disabled={!groupTouched}
                        className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Continue
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })() : null}

        {phase === "result" && result ? (
          <section className={`grid gap-6 ${toneClassForStep(true)}`}>
            {isPaid && paidResult ? (
              <PurposeAlignmentPaidResultSurface
                result={result}
                paidResult={paidResult}
                contextAnswers={contextAnswers}
                anchorNarrative={anchorNarrative}
                socialProof={socialProof}
                assessmentId={assessmentId}
                analysisError={analysisError}
                retryAnalysis={retryAnalysis}
              />
            ) : (
              <PurposeAlignmentFreeResultSurface
                result={result}
                contextAnswers={contextAnswers}
                anchorNarrative={anchorNarrative}
                socialProof={socialProof}
                captureEmail={captureEmail}
                onCaptureEmailChange={setCaptureEmail}
                onCaptureWithEmail={() => handleCapture(false)}
                onCaptureAnonymous={() => handleCapture(true)}
                captureBusy={captureBusy}
                captureMessage={captureMessage}
                analysisError={analysisError}
                retryAnalysis={retryAnalysis}
              />
            )}
          </section>
        ) : null}
      </div>

      {submitting ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-[#0e0e10] p-8 text-white shadow-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#c9a96e]">Resolution</div>
            <p className="mt-4 font-serif text-3xl leading-tight">{LOADING_LINES[loadingLineIndex]}</p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#c9a96e]" />
            </div>
          </div>
        </div>
      ) : null}

      {challenge ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
            <DecisionChallengeCard
              challenge={challenge}
              onRevise={dismissChallenge}
              onAccept={challenge.severity === "block" ? undefined : acceptChallenge}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

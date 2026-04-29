"use client";

import React from "react";
import { PURPOSE_ALIGNMENT_QUESTIONS } from "@/lib/alignment/checklist";
import { scorePurposeProfile } from "@/lib/alignment/scoring";
import type { DualAxisAnswer, PurposeProfileResult } from "@/lib/alignment/types";
import DecisionChallengeCard from "@/components/diagnostics/DecisionChallengeCard";
import type { ChallengeResult } from "@/lib/server/decision/challenge-engine.server";

type Props = {
  onScored?: (result: PurposeProfileResult, answers: Record<string, DualAxisAnswer>) => void;
};

type Phase = "context" | "checklist" | "result";

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

export default function PurposeAlignmentAssessment({ onScored }: Props) {
  const [phase, setPhase] = React.useState<Phase>("context");
  const [contextStep, setContextStep] = React.useState(0);
  const [contextAnswers, setContextAnswers] = React.useState<ContextAnswers>({
    avoidedDecision: "",
    competingObligation: "",
    consequence: "",
  });
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const [result, setResult] = React.useState<PurposeProfileResult | null>(null);
  const [anchorNarrative, setAnchorNarrative] = React.useState<AnchorNarrativeShape | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [challenge, setChallenge] = React.useState<ChallengeResult | null>(null);
  const [challengeLoading, setChallengeLoading] = React.useState(false);

  const CONTEXT_STEPS = [
    {
      id: "avoidedDecision" as const,
      question: "What decision are you currently avoiding or deferring?",
      helper: "Name the specific choice, not the general direction.",
      placeholder: "e.g. Leave current role / Confront a relationship / Commit to a new direction",
    },
    {
      id: "competingObligation" as const,
      question: "What competing obligation or priority is pulling against that decision?",
      helper: "This is usually the thing you are protecting while the decision waits.",
      placeholder: "e.g. Financial stability / Family expectations / Current commitments",
    },
    {
      id: "consequence" as const,
      question: "What becomes worse if this remains unresolved?",
      helper: "Be specific. Vague consequences produce vague analysis.",
      placeholder: "e.g. I continue doing delivery work myself and delay commercial outreach",
    },
  ];

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

  function dismissChallenge() {
    setChallenge(null);
  }

  async function advanceContext() {
    const step = CONTEXT_STEPS[contextStep]!;
    const value = contextAnswers[step.id].trim();
    if (value.length < 5) return;

    // Challenge checkpoints
    if (contextStep === 0) {
      const hit = await runChallenge("stated_purpose");
      if (hit && !hit.canProceed) return;
      if (hit && hit.canProceed) return; // show card, user accepts to continue
    } else if (contextStep === 1) {
      const hit = await runChallenge("competing_obligation");
      if (hit && !hit.canProceed) return;
      if (hit && hit.canProceed) return;
    } else if (contextStep === 2) {
      const hit = await runChallenge("pre_result");
      if (hit && !hit.canProceed) return;
      if (hit && hit.canProceed) return;
    }

    if (contextStep < CONTEXT_STEPS.length - 1) {
      setContextStep((prev) => prev + 1);
    } else {
      setPhase("checklist");
    }
  }

  function acceptChallenge() {
    dismissChallenge();
    if (contextStep < CONTEXT_STEPS.length - 1) {
      setContextStep((prev) => prev + 1);
    } else {
      setPhase("checklist");
    }
  }

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleScore = async () => {
    const answers = Object.fromEntries(
      PURPOSE_ALIGNMENT_QUESTIONS.map((question) => [
        question.id,
        checked[question.id]
          ? { resonance: 8, certainty: 8 }
          : { resonance: 2, certainty: 8 },
      ]),
    ) as Record<string, DualAxisAnswer>;
    const scored = scorePurposeProfile({
      answers,
      context: {
        reflections: {
          avoidedDecision: contextAnswers.avoidedDecision || null,
          lastSevenDays: null,
          dissenter: null,
        },
      },
    });
    setResult(scored);
    onScored?.(scored, answers);

    setSaving(true);
    try {
      const response = await fetch("/api/purpose-alignment/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          reflections: {
            avoidedDecision: contextAnswers.avoidedDecision || null,
            lastSevenDays: null,
            dissenter: null,
          },
        }),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.anchorNarrative) {
          setAnchorNarrative(json.anchorNarrative as AnchorNarrativeShape);
        }
      }
    } finally {
      setSaving(false);
    }
    setPhase("result");
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const requiredMove = result?.corrections[0] ?? "Name one direction-defining move and commit to it inside the next 72 hours.";

  return (
    <div className="grid gap-8">
      <div className="rounded-2xl border p-6 shadow-sm bg-white">
        <div className="text-xs uppercase tracking-[0.24em] text-neutral-500">
          {phase === "context" ? "Context" : phase === "checklist" ? "Signal" : "Verdict"}
          {" → "}
          {phase === "context" ? "Signal → Precision → Verdict" : phase === "checklist" ? "Precision → Verdict" : "Complete"}
        </div>
        <h1 className="mt-3 text-3xl font-semibold">Where is your direction breaking down?</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {phase === "context"
            ? "Before we assess conditions, name the decision that is actually under pressure."
            : "Work through the live conditions shaping your direction across identity, decisions, environment, behaviour, emotional order, and legacy."}
        </p>
      </div>

      {/* ── CONTEXT PHASE — collect decision anchors ─── */}
      {phase === "context" && (
        <div className="rounded-2xl border p-6 shadow-sm bg-white">
          <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
            Step {contextStep + 1} of {CONTEXT_STEPS.length}
          </div>
          <h2 className="text-lg font-semibold text-neutral-900">
            {CONTEXT_STEPS[contextStep]!.question}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {CONTEXT_STEPS[contextStep]!.helper}
          </p>
          <textarea
            value={contextAnswers[CONTEXT_STEPS[contextStep]!.id]}
            onChange={(e) =>
              setContextAnswers((prev) => ({
                ...prev,
                [CONTEXT_STEPS[contextStep]!.id]: e.target.value,
              }))
            }
            rows={3}
            placeholder={CONTEXT_STEPS[contextStep]!.placeholder}
            className="mt-3 w-full rounded-xl border p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
          />

          {challenge && (
            <div className="mt-4">
              <DecisionChallengeCard
                challenge={challenge}
                onRevise={dismissChallenge}
                onAccept={acceptChallenge}
              />
            </div>
          )}

          {challengeLoading && (
            <p className="mt-3 text-sm text-neutral-400">Evaluating decision quality...</p>
          )}

          <div className="mt-4 flex gap-3">
            {contextStep > 0 && (
              <button
                onClick={() => { setContextStep((prev) => prev - 1); dismissChallenge(); }}
                className="rounded-xl border px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-50"
              >
                Previous
              </button>
            )}
            <button
              onClick={advanceContext}
              disabled={contextAnswers[CONTEXT_STEPS[contextStep]!.id].trim().length < 5}
              className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {contextStep === CONTEXT_STEPS.length - 1 ? "Continue to conditions" : "Next"}
            </button>
          </div>
        </div>
      )}

      {/* ── CHECKLIST PHASE — existing checkbox grid ─── */}
      {phase === "checklist" && (
        <div className="rounded-2xl border p-6 shadow-sm bg-white">
          <p className="text-sm text-neutral-500 mb-4">
            Precision step: {checkedCount} / {PURPOSE_ALIGNMENT_QUESTIONS.length} conditions marked
          </p>
          <div className="grid gap-4">
            {PURPOSE_ALIGNMENT_QUESTIONS.map((q) => (
              <label
                key={q.id}
                className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer hover:bg-neutral-50"
              >
                <input
                  type="checkbox"
                  checked={Boolean(checked[q.id])}
                  onChange={() => toggle(q.id)}
                  className="mt-1"
                />
                <div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    {q.domain.replace("_", " ")}
                  </div>
                  <div className="text-sm text-neutral-900">{q.statement}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { setPhase("context"); setContextStep(0); }}
              className="rounded-xl border px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-50"
            >
              Revise context
            </button>
            <button
              onClick={handleScore}
              className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50"
            >
              Continue to verdict
            </button>
          </div>

          {saving && <p className="mt-3 text-sm text-neutral-500">Saving analysis...</p>}
        </div>
      )}

      {/* ── RESULT PHASE — anchor-bound when available ─── */}
      {phase === "result" && result && (
        <div className="rounded-2xl border p-6 shadow-sm bg-white">
          <div className="text-xs uppercase tracking-[0.24em] text-neutral-500">Verdict</div>

          {anchorNarrative ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-neutral-800">{anchorNarrative.opening}</p>
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Condition</div>
                <p className="text-sm text-neutral-800">{anchorNarrative.condition}</p>
              </div>
              <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Why this exists</div>
                <p className="text-sm text-neutral-800">{anchorNarrative.whyItExists}</p>
              </div>
              <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Pattern</div>
                <p className="text-sm text-neutral-800">{anchorNarrative.pattern}</p>
              </div>
              <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Cost of inaction</div>
                <p className="text-sm text-neutral-700 mt-1">30 days: {anchorNarrative.costOfInaction.thirtyDays}</p>
                <p className="text-sm text-neutral-700 mt-1">60 days: {anchorNarrative.costOfInaction.sixtyDays}</p>
                <p className="text-sm text-neutral-700 mt-1">90 days: {anchorNarrative.costOfInaction.ninetyDays}</p>
              </div>
              <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Perspective</div>
                <p className="text-sm text-neutral-800">{anchorNarrative.perspective}</p>
              </div>
              <p className="mt-4 text-sm font-medium text-neutral-900">{anchorNarrative.requiredMove}</p>
              <p className="mt-2 text-sm text-neutral-700">{anchorNarrative.cta}</p>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-xl font-semibold">
                {contextAnswers.avoidedDecision
                  ? `You are not blocked because you lack conviction around ${contextAnswers.avoidedDecision}.`
                  : "This is not a motivation problem. It is a direction structure problem."}
              </h2>
              <p className="mt-3 text-sm text-neutral-700">
                {contextAnswers.avoidedDecision && contextAnswers.competingObligation
                  ? `The unresolved tension is between "${contextAnswers.avoidedDecision}" and "${contextAnswers.competingObligation}".`
                  : result.weakestDomains.length > 0
                    ? `The strongest immediate pressure appears around ${result.weakestDomains[0]}.`
                    : "A directional correction is required."}
              </p>
              <p className="mt-3 text-sm text-neutral-700">
                {contextAnswers.consequence
                  ? `If this continues: ${contextAnswers.consequence}.`
                  : "If unchanged, this condition will continue to distort decisions until drift becomes your normal operating state."}
              </p>
              <p className="mt-3 text-sm font-medium text-neutral-900">Required move: {requiredMove}</p>
            </>
          )}

          <div className="mt-4">
            <h3 className="font-medium">Recommended next steps</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
              {result.corrections.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {/* ── Escalation hook: Purpose → Team ─── */}
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-xs uppercase tracking-wide text-amber-700 mb-1">Next unknown</div>
            <p className="text-sm text-neutral-800">
              This is not only personal. This pattern usually appears in team structures as well.
            </p>
            <a
              href="/diagnostics/team-assessment"
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 shadow-sm hover:bg-amber-50"
            >
              Run Team Diagnostic
            </a>
          </div>

          <div className="mt-6 flex gap-3">
            <a
              href={`/.netlify/functions/purpose-alignment-report?ts=${encodeURIComponent(result.createdAt)}`}
              className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50"
            >
              Download PDF report
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

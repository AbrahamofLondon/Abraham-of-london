"use client";

import React from "react";
import { PURPOSE_ALIGNMENT_QUESTIONS } from "@/lib/alignment/checklist";
import { scorePurposeProfile } from "@/lib/alignment/scoring";
import type { DualAxisAnswer, PurposeProfileResult } from "@/lib/alignment/types";

type Props = {
  onScored?: (result: PurposeProfileResult, answers: Record<string, DualAxisAnswer>) => void;
};

export default function PurposeAlignmentAssessment({ onScored }: Props) {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const [result, setResult] = React.useState<PurposeProfileResult | null>(null);
  const [saving, setSaving] = React.useState(false);

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
    const scored = scorePurposeProfile({ answers });
    setResult(scored);
    onScored?.(scored, answers);

    setSaving(true);
    try {
      await fetch("/api/purpose-alignment/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, result: scored }),
      });
    } finally {
      setSaving(false);
    }
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const publicState = result
    ? result.percent >= 70
      ? "ORDERED"
      : result.percent >= 45
        ? "DRIFTING"
        : result.percent >= 30
          ? "MISALIGNED"
          : "DISORDERED"
    : null;
  const publicSummary = result
    ? result.weakestDomains.length > 0
      ? `Governed analysis complete. The strongest immediate pressure appears around ${result.weakestDomains[0]}.`
      : "Governed analysis complete. A directional correction is required."
    : null;
  const patternRecognition = result
    ? result.weakestDomains.length > 0
      ? `This pattern is not isolated. It appears when ${result.weakestDomains[0]} is carrying more structural strain than the rest of the system can absorb.`
      : "This pattern is not isolated. It appears when direction is stated clearly but not yet reinforced through consistent behaviour."
    : null;
  const boardView = result
    ? publicState === "DISORDERED" || publicState === "MISALIGNED"
      ? "From a board perspective, this signals a breakdown in directional governance rather than a temporary motivation issue."
      : "From a board perspective, this is a watch condition: direction exists, but it is not yet carrying enough reinforcement under pressure."
    : null;
  const requiredMove = result?.corrections[0] ?? "Name one direction-defining move and commit to it inside the next 72 hours.";

  return (
    <div className="grid gap-8">
      <div className="rounded-2xl border p-6 shadow-sm bg-white">
        <div className="text-xs uppercase tracking-[0.24em] text-neutral-500">Input → Signal → Precision → Verdict</div>
        <h1 className="mt-3 text-3xl font-semibold">Where is your direction breaking down?</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Work through the live conditions shaping your direction across identity, decisions, environment, behaviour, emotional order, and legacy.
        </p>
        <p className="mt-4 text-sm text-neutral-500">
          Precision step: {checkedCount} / {PURPOSE_ALIGNMENT_QUESTIONS.length} conditions marked
        </p>
      </div>

      <div className="rounded-2xl border p-6 shadow-sm bg-white">
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
            onClick={handleScore}
            className="rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50"
          >
            Continue to verdict
          </button>
        </div>

        {saving && <p className="mt-3 text-sm text-neutral-500">Saving analysis…</p>}
      </div>

      {result && (
        <div className="rounded-2xl border p-6 shadow-sm bg-white">
          <div className="text-xs uppercase tracking-[0.24em] text-neutral-500">Verdict</div>
          <h2 className="mt-3 text-xl font-semibold">This is not a motivation problem. It is a direction structure problem.</h2>
          <p className="mt-3 text-sm text-neutral-700">Current condition: {publicSummary}</p>
          <p className="mt-3 text-sm text-neutral-700">{patternRecognition}</p>
          <p className="mt-3 text-sm text-neutral-700">
            If unchanged, this condition will continue to distort decisions until drift becomes your normal operating state.
          </p>
          <p className="mt-3 text-sm text-neutral-700">{boardView}</p>
          <p className="mt-3 text-sm font-medium text-neutral-900">Required move: {requiredMove}</p>

          <div className="mt-4">
            <h3 className="font-medium">Recommended next steps</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
              {result.corrections.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
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

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

  return (
    <div className="grid gap-8">
      <div className="rounded-2xl border p-6 shadow-sm bg-white">
        <h1 className="text-3xl font-semibold">Purpose Alignment Checklist</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Score directional integrity across identity, decisions, environment, behaviour,
          emotional order, and legacy.
        </p>
        <p className="mt-4 text-sm text-neutral-500">
          Checked: {checkedCount} / {PURPOSE_ALIGNMENT_QUESTIONS.length}
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
            Score alignment
          </button>
        </div>

        {saving && <p className="mt-3 text-sm text-neutral-500">Saving assessment…</p>}
      </div>

      {result && (
        <div className="rounded-2xl border p-6 shadow-sm bg-white">
          <h2 className="text-xl font-semibold">Assessment Result</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Score: {result.totalScore}/{result.maxScore} ({result.percent}%)
          </p>
          <p className="mt-1 text-sm text-neutral-600">Band: {result.coherenceBand}</p>

          <div className="mt-4">
            <h3 className="font-medium">Corrections</h3>
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

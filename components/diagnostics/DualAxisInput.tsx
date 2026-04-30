"use client";

import * as React from "react";

import type { AlignmentQuestion, DualAxisAnswer } from "@/lib/alignment/types";

type Props = {
  question: AlignmentQuestion;
  value: DualAxisAnswer;
  touched: boolean;
  onChange: (next: DualAxisAnswer) => void;
};

function toneFor(answer: DualAxisAnswer) {
  const gap = Math.abs(answer.resonance - answer.certainty);
  const lowCertainty = answer.certainty <= 3;
  const highCertainty = answer.certainty >= 8;

  return {
    isConflict: gap >= 4,
    statementClass: lowCertainty
      ? "opacity-55"
      : highCertainty
        ? "font-semibold opacity-100"
        : "opacity-85",
    shellClass: gap >= 4
      ? "border-amber-300 bg-amber-50/80"
      : "border-neutral-200 bg-white",
  };
}

export default function DualAxisInput({ question, value, touched, onChange }: Props) {
  const tone = toneFor(value);

  return (
    <article
      className={`rounded-[24px] border p-5 shadow-sm transition-all duration-300 ${tone.shellClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            {question.domain.replaceAll("_", " ")}
          </div>
          <h3
            className={`mt-2 text-base leading-7 text-neutral-900 transition-all duration-300 ${tone.statementClass}`}
          >
            {question.statement}
          </h3>
        </div>

        {tone.isConflict ? (
          <span className="shrink-0 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-800">
            Tension
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <div className="flex items-center justify-between gap-4 text-sm text-neutral-700">
            <span>How true is this?</span>
            <span className="font-mono text-neutral-900">{value.resonance}/10</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={value.resonance}
            onChange={(event) =>
              onChange({
                resonance: Number(event.target.value),
                certainty: value.certainty,
              })
            }
            className="h-11 w-full cursor-pointer accent-neutral-900"
            aria-label={`${question.statement} resonance`}
          />
        </label>

        <label className="grid gap-2">
          <div className="flex items-center justify-between gap-4 text-sm text-neutral-700">
            <span>How certain are you?</span>
            <span className="font-mono text-neutral-900">{value.certainty}/10</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={value.certainty}
            onChange={(event) =>
              onChange({
                resonance: value.resonance,
                certainty: Number(event.target.value),
              })
            }
            className="h-11 w-full cursor-pointer accent-[#8a6a2f]"
            aria-label={`${question.statement} certainty`}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
        <span className="rounded-full bg-neutral-100 px-2.5 py-1">Resonance {value.resonance}</span>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1">Certainty {value.certainty}</span>
        {!touched ? (
          <span className="rounded-full bg-neutral-100 px-2.5 py-1">Awaiting signal</span>
        ) : null}
        {value.certainty <= 3 ? (
          <span className="rounded-full bg-neutral-100 px-2.5 py-1">Low certainty</span>
        ) : null}
        {tone.isConflict ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
            Contradiction zone
          </span>
        ) : null}
      </div>
    </article>
  );
}

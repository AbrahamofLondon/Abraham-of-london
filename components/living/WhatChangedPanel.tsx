"use client";

/**
 * Shows what changed because of this stage — deltas and new evidence.
 */

type Delta = {
  metric: string;
  before: string | number | null;
  after: string | number;
  direction: "improved" | "stable" | "deteriorated";
};

type Props = {
  deltas: Delta[];
  newEvidence?: string[];
  className?: string;
};

export default function WhatChangedPanel({ deltas, newEvidence, className = "" }: Props) {
  if (deltas.length === 0 && (!newEvidence || newEvidence.length === 0)) return null;

  return (
    <div className={`border border-white/10 bg-white/[0.02] p-4 ${className}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/60 mb-3">
        What changed
      </div>

      {deltas.length > 0 && (
        <div className="space-y-2 mb-3">
          {deltas.map((d) => (
            <div key={d.metric} className="flex items-center gap-3 text-sm">
              <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wide shrink-0 w-32">
                {d.metric}
              </span>
              <span className={
                d.direction === "improved" ? "text-emerald-400/80" :
                d.direction === "deteriorated" ? "text-red-400/80" :
                "text-zinc-400"
              }>
                {d.before != null ? `${d.before} → ` : ""}{d.after}
              </span>
              <span className="text-[10px] font-mono text-zinc-600">
                {d.direction}
              </span>
            </div>
          ))}
        </div>
      )}

      {newEvidence && newEvidence.length > 0 && (
        <div className="border-t border-white/8 pt-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500 mb-2">
            New evidence added
          </div>
          {newEvidence.map((e, i) => (
            <div key={i} className="text-sm text-zinc-400 leading-6">{e}</div>
          ))}
        </div>
      )}
    </div>
  );
}

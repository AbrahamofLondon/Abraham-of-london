"use client";

/**
 * Shows what changed because of this stage — deltas and new evidence.
 */

import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";

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
  variant?: LivingThemeVariant;
};

export default function WhatChangedPanel({ deltas, newEvidence, className = "", variant = "dark" }: Props) {
  const theme = getLivingTheme(variant);
  if (deltas.length === 0 && (!newEvidence || newEvidence.length === 0)) return null;

  const directionColor = (direction: string) =>
    direction === "improved" ? theme.emerald :
    direction === "deteriorated" ? theme.red :
    theme.body;

  return (
    <div className={`p-4 ${className}`} style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: theme.accent }}>
        What changed
      </div>

      {deltas.length > 0 && (
        <div className="space-y-2 mb-3">
          {deltas.map((d) => (
            <div key={d.metric} className="flex items-center gap-3 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-wide shrink-0 w-32" style={{ color: theme.muted }}>
                {d.metric}
              </span>
              <span style={{ color: directionColor(d.direction) }}>
                {d.before != null ? `${d.before} → ` : ""}{d.after}
              </span>
              <span className="text-[10px] font-mono" style={{ color: theme.dim }}>
                {d.direction}
              </span>
            </div>
          ))}
        </div>
      )}

      {newEvidence && newEvidence.length > 0 && (
        <div className="pt-3" style={{ borderTop: `1px solid ${theme.divider}` }}>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-2" style={{ color: theme.muted }}>
            New evidence added
          </div>
          {newEvidence.map((e, i) => (
            <div key={i} className="text-sm leading-6" style={{ color: theme.body }}>{e}</div>
          ))}
        </div>
      )}
    </div>
  );
}
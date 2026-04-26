/**
 * DeterminismProof — makes the system auditable in UI.
 *
 * "This decision was reached deterministically.
 *  Same input → same output."
 *
 * Shows: weakest domain, contradiction source, scoring basis,
 * integrity-adjusted confidence.
 */

import * as React from "react";
import { Shield } from "lucide-react";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export type DeterminismProofProps = {
  spine: IntelligenceSpine;
  compact?: boolean;
};

export default function DeterminismProof({ spine, compact = false }: DeterminismProofProps) {
  const integrity = spine.integrityScore ?? 1;
  const confidence = Math.round(spine.c3.specificityScore * integrity * 100);
  const condition = spine.deterministic.conditionClass;
  const tier = spine.c3.tier;

  if (compact) {
    return (
      <div className="flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <Shield className="h-3 w-3 shrink-0" style={{ color: "rgba(110,231,183,0.50)" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
          Deterministic · {condition} · {confidence}% confidence
        </span>
      </div>
    );
  }

  return (
    <div className="border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-3.5 w-3.5" style={{ color: "rgba(110,231,183,0.50)" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.40)" }}>
          Deterministic Decision Proof
        </span>
      </div>

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.40)" }}>
        This decision was reached deterministically. Same input produces same output.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.08em" }}>
        <div className="border border-white/[0.04] p-2">
          <span style={{ color: "rgba(255,255,255,0.20)", textTransform: "uppercase" }}>Condition</span>
          <div style={{ color: "rgba(255,255,255,0.50)", marginTop: "2px" }}>{condition}</div>
        </div>
        <div className="border border-white/[0.04] p-2">
          <span style={{ color: "rgba(255,255,255,0.20)", textTransform: "uppercase" }}>C3 Tier</span>
          <div style={{ color: "rgba(255,255,255,0.50)", marginTop: "2px" }}>{tier.replace("_", " ").toLowerCase()}</div>
        </div>
        <div className="border border-white/[0.04] p-2">
          <span style={{ color: "rgba(255,255,255,0.20)", textTransform: "uppercase" }}>Confidence</span>
          <div style={{ color: confidence >= 70 ? "rgba(110,231,183,0.60)" : confidence >= 50 ? "rgba(201,169,110,0.70)" : "rgba(252,165,165,0.60)", marginTop: "2px" }}>
            {confidence}%
          </div>
        </div>
        <div className="border border-white/[0.04] p-2">
          <span style={{ color: "rgba(255,255,255,0.20)", textTransform: "uppercase" }}>Integrity</span>
          <div style={{ color: integrity >= 0.8 ? "rgba(110,231,183,0.60)" : integrity >= 0.5 ? "rgba(201,169,110,0.70)" : "rgba(252,165,165,0.60)", marginTop: "2px" }}>
            {Math.round(integrity * 100)}%
          </div>
        </div>
      </div>

      {spine.c3.scoringExplanation && (
        <div className="mt-3 space-y-1" style={{ fontSize: "7px", color: "rgba(255,255,255,0.18)", fontFamily: "'JetBrains Mono', monospace" }}>
          <div>Clarity: {spine.c3.scoringExplanation.clarity}</div>
          <div>Context: {spine.c3.scoringExplanation.context}</div>
          <div>Consequence: {spine.c3.scoringExplanation.consequence}</div>
        </div>
      )}
    </div>
  );
}

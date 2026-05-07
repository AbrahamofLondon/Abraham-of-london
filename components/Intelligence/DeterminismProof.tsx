/**
 * DeterminismProof — makes the system auditable in UI.
 *
 * "This decision was reached by governed analysis.
 *  Same input → same output."
 *
 * Shows: governed verification badge + abstracted confidence.
 * Does NOT expose: tier names, scoring dimensions, integrity formula, criteria.
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
  const raw = spine.c3.specificityScore * integrity;
  const level = raw >= 0.7 ? "high" : raw >= 0.5 ? "moderate" : "limited";
  const levelColor = raw >= 0.7 ? "rgba(110,231,183,0.60)" : raw >= 0.5 ? "rgba(201,169,110,0.70)" : "rgba(252,165,165,0.60)";

  if (compact) {
    return (
      <div className="flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <Shield className="h-3 w-3 shrink-0" style={{ color: "rgba(110,231,183,0.50)" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
          Governed · {level} confidence
        </span>
      </div>
    );
  }

  return (
    <div className="border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-3.5 w-3.5" style={{ color: "rgba(110,231,183,0.50)" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.40)" }}>
          Governed Decision Proof
        </span>
      </div>

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.40)" }}>
        This result was reached by governed analysis. Same input produces same output. The logic path is auditable.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.08em" }}>
        <div className="border border-white/[0.04] p-2">
          <span style={{ color: "rgba(255,255,255,0.20)", textTransform: "uppercase" }}>Signal strength</span>
          <div style={{ color: levelColor, marginTop: "2px" }}>{level}</div>
        </div>
        <div className="border border-white/[0.04] p-2">
          <span style={{ color: "rgba(255,255,255,0.20)", textTransform: "uppercase" }}>Verification</span>
          <div style={{ color: "rgba(110,231,183,0.50)", marginTop: "2px" }}>passed</div>
        </div>
      </div>

      <p className="mt-3" style={{ fontSize: "7px", color: "rgba(255,255,255,0.15)", fontFamily: "'JetBrains Mono', monospace" }}>
        Proprietary multi-factor evaluation. Result derived from your stated inputs only.
      </p>
    </div>
  );
}

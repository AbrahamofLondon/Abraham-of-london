/**
 * Decision-grade blocks that upgrade free assessments from
 * "useful diagnostic" to "decision-grade instrument."
 *
 * Every assessment renders these after its core result.
 */

import * as React from "react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type ConfidenceLevel = "strong" | "moderate" | "weak";

export type DecisionGradeProps = {
  /** The binary decision this result surfaces */
  decisionDeclaration: { optionA: string; optionB: string };
  /** What happens if nothing changes — one sentence, not dramatic */
  ifUnchanged: string;
  /** One action. No fluff. */
  minimumViableMove: string;
  /** How strong the signal is */
  confidence: ConfidenceLevel;
  /** Where this breaks at scale — connects small signal to big consequence */
  scaleBreak?: string;
};

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; color: string }> = {
  strong: { label: "Strong signal — clear pattern", color: "rgba(110,231,183,0.60)" },
  moderate: { label: "Moderate signal — emerging pattern", color: `${GOLD}BB` },
  weak: { label: "Weak signal — requires validation", color: "rgba(255,255,255,0.35)" },
};

export default function DecisionGradeBlocks({ data }: { data: DecisionGradeProps }) {
  const conf = CONFIDENCE_CONFIG[data.confidence];

  return (
    <div className="space-y-3">
      {/* Decision declaration */}
      <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
        <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}70` }}>
          Based on this result, the decision in front of you is
        </span>
        <div className="mt-2 flex items-center gap-3">
          <span style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", color: "rgba(255,255,255,0.80)", fontWeight: 500 }}>
            {data.decisionDeclaration.optionA}
          </span>
          <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.20)" }}>vs</span>
          <span style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", color: "rgba(255,255,255,0.80)", fontWeight: 500 }}>
            {data.decisionDeclaration.optionB}
          </span>
        </div>
      </div>

      {/* If you do nothing */}
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.85rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.45)" }}>
          If unchanged
        </span>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)", marginTop: "0.2rem", maxWidth: "60ch" }}>
          {data.ifUnchanged}
        </p>
      </div>

      {/* Minimum viable move */}
      <div style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}03`, padding: "0.85rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
          One move
        </span>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.75)", marginTop: "0.2rem", maxWidth: "60ch" }}>
          {data.minimumViableMove}
        </p>
      </div>

      {/* Scale-break insight */}
      {data.scaleBreak && (
        <div style={{ border: "1px solid rgba(255,255,255,0.05)", padding: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.45)" }}>
            Where this breaks at scale
          </span>
          <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(253,186,116,0.55)", marginTop: "0.15rem", maxWidth: "60ch" }}>
            {data.scaleBreak}
          </p>
        </div>
      )}

      {/* Confidence signal */}
      <div className="flex items-center gap-2" style={{ padding: "0.5rem 0" }}>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: conf.color }} />
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: conf.color }}>
          {conf.label}
        </span>
      </div>
    </div>
  );
}

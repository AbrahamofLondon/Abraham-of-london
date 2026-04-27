/**
 * LimitationsBlock — "What this assessment cannot tell you."
 * Creates the gap that makes the next stage feel necessary.
 */

import * as React from "react";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export type LimitationsBlockProps = {
  assessmentType: "purpose" | "constitutional" | "team" | "enterprise" | "fast";
  customLimitations?: string[];
};

const DEFAULT_LIMITATIONS: Record<LimitationsBlockProps["assessmentType"], string[]> = {
  fast: [
    "whether this is isolated or structural",
    "what the delay is costing monthly",
    "whether your team sees the same problem",
    "whether this needs enforcement or restructuring",
  ],
  purpose: [
    "whether the misalignment extends into organisational structure",
    "whether the team around you operates at the same standard",
    "what this pattern is costing in financial terms",
    "whether the condition requires external enforcement",
  ],
  constitutional: [
    "how the team perceives this structural condition",
    "what the financial cost of this condition is",
    "whether this requires institutional-level intervention",
    "whether the decision owner is the right person",
  ],
  team: [
    "whether the gap is structural or perceptual",
    "what the financial exposure of this misalignment is",
    "whether governance mechanisms can absorb this pressure",
    "whether enforcement is required or monitoring is sufficient",
  ],
  enterprise: [
    "whether this requires board-level intervention",
    "the exact financial exposure without a supplied cost anchor",
    "whether the decision owner has effective authority",
    "whether the condition will reverse without enforcement",
  ],
};

export default function LimitationsBlock({ assessmentType, customLimitations }: LimitationsBlockProps) {
  const limitations = customLimitations ?? DEFAULT_LIMITATIONS[assessmentType];

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem", marginTop: "1.25rem" }}>
      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
        What this assessment cannot tell you
      </span>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.38)", marginTop: "0.3rem" }}>
        This reading identifies the condition. It cannot determine:
      </p>
      <ul style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", lineHeight: 1.7, color: "rgba(255,255,255,0.30)", marginTop: "0.3rem", paddingLeft: "1rem" }}>
        {limitations.map((l) => <li key={l}>{l}</li>)}
      </ul>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", marginTop: "0.4rem", fontWeight: 500 }}>
        That requires the next valid test.
      </p>
    </div>
  );
}

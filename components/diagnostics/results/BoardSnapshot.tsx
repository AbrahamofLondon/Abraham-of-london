/**
 * BoardSnapshot — compressed board-level view at top of ER output.
 *
 * Five lines. No paragraphs. No explanation.
 * A CFO/CEO understands the value in under 30 seconds.
 */

import * as React from "react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export type BoardSnapshotData = {
  primaryContradiction: string;
  costOfInaction90Days: string;
  decisionVelocityRisk: string;
  competitivePosition: string;
  requiredAction: string;
};

export default function BoardSnapshot({ data }: { data: BoardSnapshotData | null }) {
  if (!data) return null;

  const rows: Array<{ label: string; value: string; color?: string }> = [
    { label: "Primary contradiction", value: data.primaryContradiction, color: "rgba(252,165,165,0.55)" },
    { label: "Financial exposure (90 days)", value: data.costOfInaction90Days, color: "rgba(252,165,165,0.60)" },
    { label: "Decision velocity risk", value: data.decisionVelocityRisk },
    { label: "Competitive position", value: data.competitivePosition },
    { label: "Required action", value: data.requiredAction, color: `${GOLD}CC` },
  ];

  return (
    <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem", marginBottom: "1.25rem" }}>
      <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
        Board snapshot
      </span>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", minWidth: "120px", flexShrink: 0, paddingTop: "2px" }}>
              {row.label}
            </span>
            <span style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.45, color: row.color ?? "rgba(255,255,255,0.50)" }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

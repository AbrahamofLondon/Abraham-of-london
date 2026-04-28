import * as React from "react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type Props = {
  advantageTheme?: string;
  recommendation?: string;
};

const DEFAULT_ADVANTAGE_LINES = [
  {
    title: "Commercial implication",
    body: "Delay compounds cost faster than most operators admit. Governed analysis is useful when consequence must be made explicit.",
  },
  {
    title: "Decision advantage",
    body: "This layer helps turn a live condition into a board-grade reading that can support action rather than further speculation.",
  },
  {
    title: "Recommended next move",
    body: "Use the flagship review when the issue needs disciplined interpretation, clear exposure framing, and a practical escalation route.",
  },
];

export default function ProductAdvantageBlocks({
  advantageTheme = "Governed advantage",
  recommendation = "Move into the next review layer only when the issue is live enough to justify structured interpretation.",
}: Props) {
  return (
    <div className="space-y-3">
      <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}05`, padding: "1rem" }}>
        <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}70` }}>
          {advantageTheme}
        </span>
        <p style={{ marginTop: "0.4rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.9rem", lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>
          {recommendation}
        </p>
      </div>

      {DEFAULT_ADVANTAGE_LINES.map((item) => (
        <div key={item.title} style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)", padding: "0.9rem 1rem" }}>
          <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
            {item.title}
          </div>
          <p style={{ marginTop: "0.2rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.54)" }}>
            {item.body}
          </p>
        </div>
      ))}
    </div>
  );
}

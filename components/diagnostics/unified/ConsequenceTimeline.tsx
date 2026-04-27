/**
 * ConsequenceTimeline — structured 7/30/90 day forecast for all assessments.
 */

import * as React from "react";

const RED = "rgba(252,165,165,";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export type ConsequenceTimelineProps = {
  sevenDays: string;
  thirtyDays: string;
  ninetyDays: string;
  controlShiftSummary?: string;
};

export default function ConsequenceTimeline({ sevenDays, thirtyDays, ninetyDays, controlShiftSummary }: ConsequenceTimelineProps) {
  return (
    <div style={{ border: `1px solid ${RED}0.12)`, padding: "1rem", marginTop: "1rem" }}>
      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${RED}0.40)` }}>If nothing changes</span>
      <div className="mt-2 space-y-2">
        {[
          { label: "7 days", text: sevenDays },
          { label: "30 days", text: thirtyDays },
          { label: "90 days", text: ninetyDays },
        ].map((c) => (
          <div key={c.label} className="flex gap-3">
            <span style={{ ...mono, fontSize: "7px", color: `${RED}0.30)`, minWidth: "50px" }}>{c.label}</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>{c.text}</span>
          </div>
        ))}
      </div>
      {controlShiftSummary && (
        <p style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.15)", marginTop: "0.75rem" }}>
          {controlShiftSummary}
        </p>
      )}
    </div>
  );
}

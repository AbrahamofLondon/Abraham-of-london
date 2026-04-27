/**
 * ConsequenceTimeline — structured 7/30/90 day forecast for all assessments.
 */

import * as React from "react";

const RED = "rgba(252,165,165,";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export type ConsequenceTimelineProps = {
  alreadyIncurred?: string;
  sevenDays: string;
  thirtyDays: string;
  ninetyDays: string;
  controlShiftSummary?: string;
};

export default function ConsequenceTimeline({ alreadyIncurred, sevenDays, thirtyDays, ninetyDays, controlShiftSummary }: ConsequenceTimelineProps) {
  return (
    <div style={{ border: `1px solid ${RED}0.12)`, padding: "1rem", marginTop: "1rem" }}>
      {alreadyIncurred && (
        <div style={{ marginBottom: "0.75rem", paddingBottom: "0.65rem", borderBottom: `1px solid ${RED}0.08)` }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${RED}0.55)` }}>Already incurred</span>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", lineHeight: 1.6, color: `${RED}0.60)`, marginTop: "0.25rem" }}>{alreadyIncurred}</p>
        </div>
      )}
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

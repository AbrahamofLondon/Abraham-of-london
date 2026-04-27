/**
 * CaseActiveBanner — persistence signal for all assessment results.
 * Shows case reference, save time, commitment status, follow-up.
 */

import * as React from "react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export type CaseActiveBannerProps = {
  caseReference: string;
  committed?: boolean;
  assessmentType: string;
};

export default function CaseActiveBanner({ caseReference, committed, assessmentType }: CaseActiveBannerProps) {
  return (
    <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem", marginBottom: "1.5rem" }}>
      <div className="flex items-center justify-between">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}70` }}>
          Your case is now active
        </span>
        <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>{caseReference.slice(0, 16)}</span>
      </div>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.38)", marginTop: "0.4rem" }}>
        The system has preserved your {assessmentType} inputs.
        {committed ? " You committed to act. If nothing happens, this case will follow up." : " Your next step should match the condition detected below."}
      </p>
    </div>
  );
}

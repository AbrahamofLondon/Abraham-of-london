import * as React from "react";

import type { CounselCase } from "@/lib/product/counsel-room-contract";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export default function CounselMemorySummary({ counselCase, caseCount }: {
  counselCase: CounselCase;
  caseCount: number;
}) {
  const evidenceAttached = counselCase.permissionToUseEvidencePackage && counselCase.evidencePackage.completedStages.length > 0;
  const nextExpectedOperatorState =
    counselCase.status === "REQUESTED"
      ? "Operator triage"
      : counselCase.status === "MORE_EVIDENCE_REQUIRED" || counselCase.status === "EVIDENCE_REVIEW_REQUIRED"
        ? "Evidence clarification"
        : counselCase.status === "ACCEPTED_FOR_REVIEW"
          ? "Counsel allocation"
          : counselCase.status === "IN_COUNSEL_REVIEW"
            ? "Counsel response capture"
            : counselCase.status === "COUNSEL_RESPONSE_READY"
              ? "Governed release or closure"
              : "Archive and continuity monitoring";

  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
        Counsel memory
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
            What the system already knows
          </p>
          <ul className="mt-2 space-y-2 text-sm leading-7 text-white/64">
            <li>{caseCount} counsel case record{caseCount === 1 ? "" : "s"} attached to this account.</li>
            <li>{counselCase.evidencePackage.completedStages.length} completed diagnostic stage{counselCase.evidencePackage.completedStages.length === 1 ? "" : "s"} carried into the case.</li>
            <li>{counselCase.evidencePackage.activeContradictions.length} contradiction marker{counselCase.evidencePackage.activeContradictions.length === 1 ? "" : "s"} retained.</li>
            <li>{evidenceAttached ? "Evidence package attached for governed review." : "Evidence package not yet attached for governed review."}</li>
          </ul>
        </div>
        <div>
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
            What happens next
          </p>
          <ul className="mt-2 space-y-2 text-sm leading-7 text-white/64">
            <li>Current case status: {counselCase.status.replace(/_/g, " ").toLowerCase()}.</li>
            <li>Last status change recorded: {new Date(counselCase.updatedAt).toLocaleDateString("en-GB")}.</li>
            <li>Next expected operator state: {nextExpectedOperatorState}.</li>
            <li>Operator and counsel notes are not shown on this client-safe status surface.</li>
          </ul>
        </div>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/28" style={mono}>
        Evidence posture: {counselCase.evidencePackage.evidencePosture.replace(/_/g, " ").toLowerCase()}
      </p>
    </section>
  );
}

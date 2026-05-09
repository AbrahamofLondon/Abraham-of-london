"use client";

import * as React from "react";
import type { CrossAssessmentIntelligence } from "@/lib/analytics/cross-assessment-intelligence";

type Props = {
  intelligence: CrossAssessmentIntelligence;
  title?: string;
  className?: string;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function formatDate(value?: string | null): string {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CrossAssessmentInsight({
  intelligence,
  title = "Cross-assessment signal detected",
  className = "",
}: Props) {
  if (intelligence.conflicts.length === 0 && intelligence.reinforcingSignals.length === 0) return null;

  return (
    <div
      className={className}
      style={{
        border: "1px solid rgba(201,169,110,0.16)",
        backgroundColor: "rgba(201,169,110,0.04)",
        padding: "16px 18px",
      }}
    >
      <div style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
        {title}
      </div>
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginTop: "8px" }}>
        Scope: {intelligence.meta.scope.scopeLabel} · Source: {intelligence.meta.sourceLabel} · As of {formatDate(intelligence.asOf)}
      </p>
      {intelligence.conflicts.slice(0, 2).map((conflict) => (
        <div key={conflict.label} style={{ marginTop: "10px" }}>
          <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
            {conflict.surfacesInvolved.join(" · ")}
          </div>
          <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.78)", marginTop: "4px" }}>
            {conflict.userSafeExplanation}
          </p>
          <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.36)", marginTop: "5px" }}>
            Evidence posture: {conflict.evidencePosture.replace(/_/g, " ").toLowerCase()} · Severity: {conflict.severity.toLowerCase()}
          </p>
          {conflict.basis.length > 0 && (
            <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.32)", marginTop: "5px" }}>
              Basis: {conflict.basis.map((item) => `${item.stage} (${formatDate(item.capturedAt)})`).join(" · ")}
            </p>
          )}
        </div>
      ))}
      {intelligence.reinforcingSignals.slice(0, 1).map((signal) => (
        <p key={signal.label} style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.40)", marginTop: "10px" }}>
          {signal.description}
        </p>
      ))}
      {intelligence.caution && (
        <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.34)", marginTop: "10px" }}>
          {intelligence.caution}
        </p>
      )}
      {intelligence.meta.limitation && (
        <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.30)", marginTop: "10px" }}>
          {intelligence.meta.limitation}
        </p>
      )}
    </div>
  );
}

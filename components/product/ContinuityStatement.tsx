"use client";

/**
 * ContinuityStatement — renders signal continuity classification.
 *
 * Shows whether a signal is new, repeated, worsening, improving, resolved,
 * or a verified pattern. Institutional, precise, calm, not dramatic.
 */

import * as React from "react";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type ContinuityType =
  | "NEW"
  | "REPEATED"
  | "WORSENING"
  | "IMPROVING"
  | "RESOLVED"
  | "VERIFIED_PATTERN"
  | "UNKNOWN";

type ContinuityStatementProps = {
  continuity: ContinuityType;
  reason?: string | null;
  priorOccurrences?: number;
  trend?: "stable" | "escalating" | "de-escalating" | "unknown" | null;
  lastObserved?: string | null;
  implication?: string | null;
  compact?: boolean;
};

const CONTINUITY_CONFIG: Record<ContinuityType, { label: string; color: string; explanation: string }> = {
  NEW: {
    label: "New signal",
    color: "rgba(255,255,255,0.40)",
    explanation: "This signal has not been observed in prior diagnostic history.",
  },
  REPEATED: {
    label: "Repeated signal",
    color: "rgba(251,191,36,0.55)",
    explanation: "This signal has been observed previously at similar severity.",
  },
  WORSENING: {
    label: "Worsening signal",
    color: "rgba(252,165,165,0.65)",
    explanation: "This signal has intensified since prior observation.",
  },
  IMPROVING: {
    label: "Improving signal",
    color: "rgba(110,231,183,0.60)",
    explanation: "This signal has decreased in severity since prior observation.",
  },
  RESOLVED: {
    label: "Resolved signal",
    color: "rgba(110,231,183,0.70)",
    explanation: "Outcome verification classified this signal as resolved.",
  },
  VERIFIED_PATTERN: {
    label: "Verified pattern",
    color: "rgba(252,165,165,0.70)",
    explanation: "This signal has recurred structurally. It is a pattern, not an incident.",
  },
  UNKNOWN: {
    label: "Insufficient history",
    color: "rgba(255,255,255,0.20)",
    explanation: "Continuity status: insufficient history for signal classification.",
  },
};

export default function ContinuityStatement({
  continuity,
  reason,
  priorOccurrences,
  trend,
  lastObserved,
  implication,
  compact = false,
}: ContinuityStatementProps) {
  const config = CONTINUITY_CONFIG[continuity];

  return (
    <div
      style={{
        border: `1px solid ${continuity === "WORSENING" || continuity === "VERIFIED_PATTERN" ? "rgba(252,165,165,0.12)" : continuity === "IMPROVING" || continuity === "RESOLVED" ? "rgba(110,231,183,0.10)" : "rgba(255,255,255,0.06)"}`,
        backgroundColor: "rgba(255,255,255,0.015)",
        padding: compact ? "10px 14px" : "16px 20px",
      }}
    >
      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: compact ? "4px" : "8px" }}>
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: config.color,
            flexShrink: 0,
          }}
        />
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: config.color }}>
          {config.label}
        </span>
        {priorOccurrences != null && priorOccurrences > 0 && (
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.20)" }}>
            {priorOccurrences} prior occurrence{priorOccurrences !== 1 ? "s" : ""}
          </span>
        )}
        {trend && trend !== "unknown" && (
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.20)" }}>
            Trend: {trend}
          </span>
        )}
      </div>

      {/* Explanation */}
      {!compact && (
        <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.40)", margin: 0 }}>
          {reason || config.explanation}
        </p>
      )}

      {/* Last observed */}
      {lastObserved && !compact && (
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.18)", marginTop: "6px" }}>
          Last observed: {lastObserved}
        </p>
      )}

      {/* Implication */}
      {implication && !compact && (
        <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.35)", marginTop: "6px", fontStyle: "italic" }}>
          {implication}
        </p>
      )}
    </div>
  );
}

export type { ContinuityType, ContinuityStatementProps };

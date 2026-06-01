"use client";

/**
 * ContinuityStatement — renders signal continuity classification.
 *
 * Shows whether a signal is new, repeated, worsening, improving, resolved,
 * or a verified pattern. Institutional, precise, calm, not dramatic.
 *
 * Supports dark and light theme variants.
 */

import * as React from "react";
import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";

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
  variant?: LivingThemeVariant;
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

// Light variant color overrides for the status dot and label
const LIGHT_STATUS_COLORS: Record<ContinuityType, string> = {
  NEW: "rgba(64,64,64,0.50)",
  REPEATED: "rgba(180,130,30,0.65)",
  WORSENING: "rgba(180,50,50,0.70)",
  IMPROVING: "rgba(22,130,80,0.65)",
  RESOLVED: "rgba(22,130,80,0.75)",
  VERIFIED_PATTERN: "rgba(180,50,50,0.75)",
  UNKNOWN: "rgba(64,64,64,0.25)",
};

export default function ContinuityStatement({
  continuity,
  reason,
  priorOccurrences,
  trend,
  lastObserved,
  implication,
  compact = false,
  variant = "dark",
}: ContinuityStatementProps) {
  const theme = getLivingTheme(variant);
  const config = CONTINUITY_CONFIG[continuity];
  const isDark = variant === "dark";

  const statusColor = isDark ? config.color : LIGHT_STATUS_COLORS[continuity];

  // Border color based on continuity type and variant
  const borderColor = (() => {
    if (continuity === "WORSENING" || continuity === "VERIFIED_PATTERN") {
      return isDark ? "rgba(252,165,165,0.12)" : "rgba(180,50,50,0.15)";
    }
    if (continuity === "IMPROVING" || continuity === "RESOLVED") {
      return isDark ? "rgba(110,231,183,0.10)" : "rgba(22,130,80,0.12)";
    }
    return theme.border;
  })();

  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        backgroundColor: theme.bg,
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
            backgroundColor: statusColor,
            flexShrink: 0,
          }}
        />
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: statusColor }}>
          {config.label}
        </span>
        {priorOccurrences != null && priorOccurrences > 0 && (
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", color: theme.dim }}>
            {priorOccurrences} prior occurrence{priorOccurrences !== 1 ? "s" : ""}
          </span>
        )}
        {trend && trend !== "unknown" && (
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", color: theme.dim }}>
            Trend: {trend}
          </span>
        )}
      </div>

      {/* Explanation */}
      {!compact && (
        <p style={{ fontSize: "13px", lineHeight: 1.65, color: theme.body, margin: 0 }}>
          {reason || config.explanation}
        </p>
      )}

      {/* Last observed */}
      {lastObserved && !compact && (
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em", color: theme.dim, marginTop: "6px" }}>
          Last observed: {lastObserved}
        </p>
      )}

      {/* Implication */}
      {implication && !compact && (
        <p style={{ fontSize: "12px", lineHeight: 1.6, color: theme.muted, marginTop: "6px", fontStyle: "italic" }}>
          {implication}
        </p>
      )}
    </div>
  );
}

export type { ContinuityType, ContinuityStatementProps };
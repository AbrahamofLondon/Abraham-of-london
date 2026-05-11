"use client";

/**
 * SignalPressurePanel
 *
 * Surfaces sovereign signal pressure within the Strategy Room session.
 * This is not decorative. Each item here governs a concrete posture requirement
 * that must be met before the execution path is confirmed.
 *
 * Classification: PUBLIC_SAFE_DTO consumer — no raw engine data.
 */

import * as React from "react";
import type { SignalPressure, SignalPressureItem } from "@/lib/strategy-room/room-state-contract";

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const SERIF: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "rgba(252,165,165,0.80)",
  ALERT: "#C9A96E",
  CONCERN: "rgba(255,255,255,0.50)",
  WATCH: "rgba(110,231,183,0.55)",
};

const SEVERITY_BORDER: Record<string, string> = {
  CRITICAL: "rgba(252,165,165,0.30)",
  ALERT: "rgba(201,169,110,0.25)",
  CONCERN: "rgba(255,255,255,0.10)",
  WATCH: "rgba(110,231,183,0.15)",
};

const POSTURE_EFFECT_LABEL: Record<string, string> = {
  REQUIRE_AUTHORITY_CLARIFICATION: "Authority clarification required",
  REQUIRE_DECISION_OWNER: "Decision owner must be named",
  REQUIRE_CHECKPOINT_CONFIRMATION: "Checkpoint confirmation required",
  RESTRICT_UNTIL_CAPACITY_NAMED: "Intervention restricted — capacity blocker must be named",
  REQUIRE_EVIDENCE_CLARIFICATION: "Evidence clarification required",
  FLAG_SPONSOR_ATTENTION: "Sponsor/operator attention flagged",
  RECOMMEND_RETAINED_MEMORY: "Retained memory or oversight recommended",
  TRIGGER_RETURN_BRIEF: "Return brief and checkpoint challenge triggered",
  FLAG_COUNSEL_SENSITIVITY: "Counsel and boardroom sensitivity flagged",
};

function SignalPressureItem({ item }: { item: SignalPressureItem }) {
  const [expanded, setExpanded] = React.useState(false);
  const color = SEVERITY_COLOR[item.severityBand] ?? "rgba(255,255,255,0.50)";
  const border = SEVERITY_BORDER[item.severityBand] ?? "rgba(255,255,255,0.10)";
  const isLocking = [
    "REQUIRE_AUTHORITY_CLARIFICATION",
    "REQUIRE_DECISION_OWNER",
    "REQUIRE_CHECKPOINT_CONFIRMATION",
    "RESTRICT_UNTIL_CAPACITY_NAMED",
    "REQUIRE_EVIDENCE_CLARIFICATION",
  ].includes(item.postureEffect);

  return (
    <div
      style={{
        borderLeft: `2px solid ${border}`,
        paddingLeft: "14px",
        marginBottom: "12px",
      }}
    >
      {/* Signal identity */}
      <div
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", cursor: "pointer" }}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
            <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color }}>
              {item.severityBand}
            </span>
            {isLocking && (
              <span
                style={{
                  ...MONO,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(252,165,165,0.55)",
                  border: "1px solid rgba(252,165,165,0.20)",
                  padding: "1px 5px",
                }}
              >
                Execution gate
              </span>
            )}
          </div>
          <p style={{ ...SERIF, fontSize: "15px", lineHeight: 1.3, color: "#F5F5F5", margin: 0 }}>
            {item.signalName}
          </p>
        </div>
        <span style={{ ...MONO, fontSize: "10px", color: "rgba(255,255,255,0.20)", flexShrink: 0, marginTop: "2px" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Posture effect — always visible */}
      <div
        style={{
          marginTop: "8px",
          padding: "8px 10px",
          background: isLocking ? "rgba(252,165,165,0.04)" : "rgba(255,255,255,0.02)",
          borderLeft: `1px solid ${isLocking ? "rgba(252,165,165,0.20)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "4px" }}>
          System requirement
        </p>
        <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.65)", margin: 0 }}>
          {POSTURE_EFFECT_LABEL[item.postureEffect]}
        </p>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
          <div>
            <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "4px" }}>
              Why this matters for this intervention
            </p>
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.48)" }}>
              {item.interventionRelevance}
            </p>
          </div>
          <div>
            <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "4px" }}>
              What is now required
            </p>
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
              {item.postureConsequence}
            </p>
          </div>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
              Evidence: {item.evidencePosture.replace(/_/g, " ").toLowerCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

type Props = {
  signalPressure: SignalPressure;
};

export default function SignalPressurePanel({ signalPressure }: Props) {
  if (signalPressure.items.length === 0) return null;

  const lockingItems = signalPressure.items.filter((item) =>
    ["REQUIRE_AUTHORITY_CLARIFICATION", "REQUIRE_DECISION_OWNER", "REQUIRE_CHECKPOINT_CONFIRMATION",
      "RESTRICT_UNTIL_CAPACITY_NAMED", "REQUIRE_EVIDENCE_CLARIFICATION"].includes(item.postureEffect),
  );
  const advisoryItems = signalPressure.items.filter((item) =>
    !["REQUIRE_AUTHORITY_CLARIFICATION", "REQUIRE_DECISION_OWNER", "REQUIRE_CHECKPOINT_CONFIRMATION",
      "RESTRICT_UNTIL_CAPACITY_NAMED", "REQUIRE_EVIDENCE_CLARIFICATION"].includes(item.postureEffect),
  );

  const headerBg = signalPressure.postureLocked
    ? "rgba(252,165,165,0.04)"
    : "rgba(201,169,110,0.03)";
  const headerBorder = signalPressure.postureLocked
    ? "rgba(252,165,165,0.20)"
    : "rgba(201,169,110,0.15)";
  const headerBorderLeft = signalPressure.postureLocked
    ? "3px solid rgba(252,165,165,0.50)"
    : "3px solid rgba(201,169,110,0.45)";

  return (
    <div
      style={{
        background: headerBg,
        border: `1px solid ${headerBorder}`,
        borderLeft: headerBorderLeft,
        padding: "22px 24px",
      }}
    >
      {/* Section label */}
      <p style={{ ...MONO, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "12px" }}>
        Signal Pressure Affecting This Intervention
      </p>

      {/* Summary */}
      <p style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(255,255,255,0.60)", marginBottom: "20px" }}>
        {signalPressure.summary}
      </p>

      {/* Locking items first */}
      {lockingItems.length > 0 && (
        <div style={{ marginBottom: advisoryItems.length > 0 ? "16px" : "0" }}>
          {lockingItems.map((item) => (
            <SignalPressureItem key={item.signalId} item={item} />
          ))}
        </div>
      )}

      {/* Advisory items */}
      {advisoryItems.length > 0 && (
        <>
          {lockingItems.length > 0 && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginBottom: "14px" }} />
          )}
          {advisoryItems.map((item) => (
            <SignalPressureItem key={item.signalId} item={item} />
          ))}
        </>
      )}

      {/* Governance footer */}
      <p style={{ ...MONO, fontSize: "8px", lineHeight: 1.55, color: "rgba(255,255,255,0.16)", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        Signal pressure is derived from the institutional pattern dataset. It represents observed tendencies, not determinate conclusions. Evidence posture and sample caveat apply to each signal.
      </p>
    </div>
  );
}

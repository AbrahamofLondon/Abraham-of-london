/**
 * ConsequencePath.tsx
 *
 * Shows the consequence timeline for a named signal or diagnostic finding:
 * current condition → 30 / 60 / 90-day path → compounding point → correction point.
 *
 * Used on: Fast Diagnostic result, decision instrument results, Oversight,
 *          Boardroom signal authority surfaces.
 *
 * Design: matches the dark product system — void background, gold accents,
 *         JetBrains Mono labels, Cormorant Garamond body text.
 */

import * as React from "react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

export type ConsequencePathProps = {
  /** The current named condition (e.g. "Execution Fragility Cascade") */
  currentCondition: string;
  /** What happens if nothing changes at 30 days */
  thirtyDays: string;
  /** What happens at 60 days */
  sixtyDays: string;
  /** What happens at 90 days */
  ninetyDays: string;
  /**
   * The point at which inaction compounds — the condition becomes self-reinforcing.
   * If null, no compounding point is shown.
   */
  compoundingPoint: string | null;
  /**
   * The last point at which correction is accessible without external intervention.
   * If null, no correction point is shown.
   */
  correctionPoint: string | null;
  /**
   * Governance caveat — shown in micro-text below the path.
   * Defaults to standard scenario caveat.
   */
  caveat?: string;
  /** Whether to render in compact mode (no compounding/correction points) */
  compact?: boolean;
};

type StepProps = {
  label: string;
  labelColor?: string;
  text: string;
  borderColor?: string;
};

function PathStep({ label, labelColor, text, borderColor }: StepProps) {
  return (
    <div
      style={{
        borderLeft: `2px solid ${borderColor ?? "rgba(255,255,255,0.10)"}`,
        paddingLeft: "1rem",
        paddingTop: "0.25rem",
        paddingBottom: "0.25rem",
      }}
    >
      <p
        style={{
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: labelColor ?? "rgba(255,255,255,0.28)",
          marginBottom: "0.3rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          ...serif,
          fontSize: "0.92rem",
          lineHeight: 1.55,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {text}
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        paddingLeft: "1rem",
        marginLeft: "0",
      }}
    >
      <div
        style={{
          width: "1px",
          height: "12px",
          backgroundColor: "rgba(255,255,255,0.10)",
          marginLeft: "-1px",
        }}
      />
    </div>
  );
}

export default function ConsequencePath({
  currentCondition,
  thirtyDays,
  sixtyDays,
  ninetyDays,
  compoundingPoint,
  correctionPoint,
  caveat,
  compact = false,
}: ConsequencePathProps) {
  const defaultCaveat =
    "Consequence path is a scenario estimate based on the current record and observed patterns. " +
    "It is not a financial forecast. Individual organisations may differ materially from dataset patterns.";

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.015)",
        padding: "1.25rem 1.5rem",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: `${GOLD}80`,
            marginBottom: "0.4rem",
          }}
        >
          Consequence path
        </p>
        <p
          style={{
            ...serif,
            fontSize: "0.88rem",
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.42)",
            fontStyle: "italic",
          }}
        >
          If {currentCondition} remains unaddressed
        </p>
      </div>

      {/* Timeline */}
      <div style={{ display: "grid", gap: "0" }}>
        <PathStep
          label="Now"
          labelColor={`${GOLD}70`}
          text={currentCondition}
          borderColor={`${GOLD}40`}
        />
        <Divider />
        <PathStep
          label="30 days"
          text={thirtyDays}
          borderColor="rgba(251,191,36,0.30)"
        />
        <Divider />
        <PathStep
          label="60 days"
          text={sixtyDays}
          borderColor="rgba(249,115,22,0.30)"
        />
        <Divider />
        <PathStep
          label="90 days"
          text={ninetyDays}
          borderColor="rgba(239,68,68,0.30)"
        />

        {!compact && compoundingPoint && (
          <>
            <Divider />
            <PathStep
              label="Compounding point"
              labelColor="rgba(239,68,68,0.60)"
              text={compoundingPoint}
              borderColor="rgba(239,68,68,0.20)"
            />
          </>
        )}

        {!compact && correctionPoint && (
          <>
            <Divider />
            <PathStep
              label="Last accessible correction point"
              labelColor="rgba(110,231,183,0.55)"
              text={correctionPoint}
              borderColor="rgba(110,231,183,0.20)"
            />
          </>
        )}
      </div>

      {/* Caveat */}
      <p
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.18)",
          marginTop: "1rem",
          lineHeight: 1.6,
        }}
      >
        {caveat ?? defaultCaveat}
      </p>
    </div>
  );
}

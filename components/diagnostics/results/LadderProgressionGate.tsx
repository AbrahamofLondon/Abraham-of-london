/**
 * LadderProgressionGate — earned progression through the next paid layer.
 *
 * The free layer must already have delivered a useful result.
 * This block explains what the next layer adds and gives the user
 * a truthful choice about whether to continue.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type LadderStage = {
  label: string;
  href: string;
  reason: string;
};

export type LadderProgressionProps = {
  severity: "low" | "medium" | "high" | "critical";
  nextStage: LadderStage;
  consequenceOfExit: string;
  trajectoryWarning?: string;
  canDefer?: boolean;
  ctaLabel?: string;
  deferLabel?: string;
  deferNote?: string;
};

export default function LadderProgressionGate({
  severity,
  nextStage,
  consequenceOfExit,
  trajectoryWarning,
  canDefer = true,
  ctaLabel,
  deferLabel = "Stay with this result for now",
  deferNote,
}: LadderProgressionProps) {
  const [deferred, setDeferred] = React.useState(false);

  const borderColor = severity === "critical" ? "rgba(252,165,165,0.25)"
    : severity === "high" ? "rgba(253,186,116,0.22)"
    : `${GOLD}22`;

  const accentColor = severity === "critical" ? "rgba(252,165,165,0.70)"
    : severity === "high" ? "rgba(253,186,116,0.65)"
    : `${GOLD}BB`;

  const resolvedCtaLabel = ctaLabel
    ?? (nextStage.label === "Executive Reporting"
      ? "Move to Executive Reporting"
      : nextStage.label === "Strategy Room"
        ? "Enter Strategy Room"
        : `Continue to ${nextStage.label}`);

  if (deferred) return null;

  return (
    <div style={{ border: `1px solid ${borderColor}`, backgroundColor: "rgba(255,255,255,0.03)", padding: "1.25rem", marginBottom: "1rem" }}>
      <div className="mb-3">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: accentColor }}>
          Earned escalation
        </span>
      </div>

      <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.8, color: "rgba(255,255,255,0.82)", marginBottom: "0.5rem", maxWidth: "62ch" }}>
        {nextStage.reason}
      </p>

      <div style={{ border: "1px solid rgba(252,165,165,0.12)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.65rem", marginBottom: "0.75rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)" }}>
          What this next layer adds
        </span>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.9rem", lineHeight: 1.75, color: "rgba(255,255,255,0.72)", marginTop: "0.2rem", maxWidth: "62ch" }}>
          {consequenceOfExit}
        </p>
      </div>

      {trajectoryWarning && (
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(253,186,116,0.78)", marginBottom: "0.75rem", maxWidth: "62ch" }}>
          {trajectoryWarning}
        </p>
      )}

      <Link
        href={nextStage.href}
        className="inline-flex items-center gap-2.5"
        style={{
          padding: "11px 22px",
          border: `1px solid ${accentColor}`,
          backgroundColor: `${accentColor}10`,
          color: accentColor,
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.26em",
          textTransform: "uppercase",
        }}
      >
        {resolvedCtaLabel} <ArrowRight style={{ width: 11, height: 11 }} />
      </Link>

      {canDefer && (
        <button
          type="button"
          onClick={() => setDeferred(true)}
          style={{
            display: "block",
            marginTop: "0.75rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
          }}
        >
          {deferLabel}
        </button>
      )}
      {deferNote && (
        <p style={{ marginTop: "0.5rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.65, color: "rgba(255,255,255,0.58)", maxWidth: "60ch" }}>
          {deferNote}
        </p>
      )}
    </div>
  );
}

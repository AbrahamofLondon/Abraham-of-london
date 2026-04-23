/**
 * LadderProgressionGate — forced progression through the decision ladder.
 *
 * After any diagnostic stage completes, this component:
 * 1. Names the next required stage
 * 2. Shows what happens if the user exits (consequence of inaction)
 * 3. Requires explicit acknowledgement to defer
 *
 * This is not optional navigation. This is enforcement.
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
  /** Current condition severity — determines urgency tone */
  severity: "low" | "medium" | "high" | "critical";
  /** The next stage in the ladder */
  nextStage: LadderStage;
  /** What worsens if they don't continue */
  consequenceOfExit: string;
  /** Projected trajectory text */
  trajectoryWarning?: string;
  /** Whether the user has acknowledged and can defer */
  canDefer?: boolean;
};

export default function LadderProgressionGate({
  severity,
  nextStage,
  consequenceOfExit,
  trajectoryWarning,
  canDefer = true,
}: LadderProgressionProps) {
  const [deferred, setDeferred] = React.useState(false);
  const [acknowledged, setAcknowledged] = React.useState(false);

  const borderColor = severity === "critical" ? "rgba(252,165,165,0.25)"
    : severity === "high" ? "rgba(253,186,116,0.22)"
    : `${GOLD}22`;

  const accentColor = severity === "critical" ? "rgba(252,165,165,0.70)"
    : severity === "high" ? "rgba(253,186,116,0.65)"
    : `${GOLD}BB`;

  if (deferred) return null;

  return (
    <div style={{ border: `1px solid ${borderColor}`, backgroundColor: "rgba(255,255,255,0.015)", padding: "1.25rem", marginBottom: "1rem" }}>
      {/* Progression directive */}
      <div className="mb-3">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: accentColor }}>
          System directive
        </span>
      </div>

      <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.55, color: "rgba(255,255,255,0.60)", marginBottom: "0.5rem" }}>
        {nextStage.reason}
      </p>

      {/* Consequence of exit */}
      <div style={{ border: "1px solid rgba(252,165,165,0.12)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.65rem", marginBottom: "0.75rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)" }}>
          If you exit now
        </span>
        <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(252,165,165,0.45)", marginTop: "0.15rem" }}>
          {consequenceOfExit}
        </p>
      </div>

      {/* Trajectory warning */}
      {trajectoryWarning && (
        <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(253,186,116,0.45)", fontStyle: "italic", marginBottom: "0.75rem" }}>
          {trajectoryWarning}
        </p>
      )}

      {/* Primary CTA — continue the ladder */}
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
        Continue to {nextStage.label} <ArrowRight style={{ width: 11, height: 11 }} />
      </Link>

      {/* Defer — requires acknowledgement */}
      {canDefer && !acknowledged && (
        <button
          type="button"
          onClick={() => setAcknowledged(true)}
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
            color: "rgba(255,255,255,0.18)",
          }}
        >
          I understand the consequence — defer for now
        </button>
      )}

      {/* Acknowledged — show cost and allow exit */}
      {acknowledged && (
        <div style={{ marginTop: "0.5rem" }}>
          <p style={{ ...mono, fontSize: "7px", color: "rgba(252,165,165,0.40)", marginBottom: "0.35rem" }}>
            The system has recorded this deferral. Your condition remains unpriced.
          </p>
          <button
            type="button"
            onClick={() => setDeferred(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.15)",
            }}
          >
            Exit without pricing
          </button>
        </div>
      )}
    </div>
  );
}

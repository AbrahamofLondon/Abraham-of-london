/**
 * components/diagnostics/CommercialExposurePanel.tsx
 *
 * Surfaces the cost of delay across governed case results.
 *
 * Rules:
 * - No fake currency where no basis exists.
 * - Always include: "Scenario estimate only. Not financial advice."
 * - If no cost basis, show structural consequence only.
 * - Basis must be USER_REPORTED, SYSTEM_ESTIMATED, or NOT_AVAILABLE.
 *
 * Usage:
 *   <CommercialExposurePanel exposure={result.commercialExposure} />
 *
 * Placement:
 * - Decision Delay Exposure result
 * - Fast Diagnostic result (via AssessmentResultSurface)
 * - All assessment result surfaces (via AssessmentResultSurface)
 * - Decision Centre case detail where basis exists
 */

import * as React from "react";
import { AlertTriangle } from "lucide-react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type CommercialExposure = {
  costToDate?: string | null;
  avoidableThirtyDayExposure?: string | null;
  basis: "USER_REPORTED" | "SYSTEM_ESTIMATED" | "NOT_AVAILABLE";
  disclaimer: string;
};

export type CommercialExposurePanelProps = {
  exposure: CommercialExposure | null | undefined;
  /** Optional: suppress the panel entirely when no basis exists and this is false */
  showWhenUnavailable?: boolean;
};

// ─── Basis label ─────────────────────────────────────────────────────────────

const BASIS_LABELS: Record<CommercialExposure["basis"], string> = {
  USER_REPORTED: "User-reported estimate",
  SYSTEM_ESTIMATED: "System-estimated",
  NOT_AVAILABLE: "No basis available",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommercialExposurePanel({
  exposure,
  showWhenUnavailable = false,
}: CommercialExposurePanelProps) {
  // Nothing to render
  if (!exposure) return null;

  const hasNoBasis = exposure.basis === "NOT_AVAILABLE";
  const hasCostFigures =
    !!exposure.costToDate || !!exposure.avoidableThirtyDayExposure;

  // If no basis and caller doesn't want the unavailable state shown, skip
  if (hasNoBasis && !hasCostFigures && !showWhenUnavailable) return null;

  return (
    <section
      style={{
        border: hasNoBasis
          ? "1px solid rgba(255,255,255,0.06)"
          : `1px solid rgba(255,180,80,0.15)`,
        backgroundColor: hasNoBasis
          ? "rgba(255,255,255,0.01)"
          : "rgba(255,180,80,0.03)",
        padding: "1rem 1.25rem",
      }}
      aria-label="Commercial exposure"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle
          className="h-4 w-4 shrink-0"
          style={{
            color: hasNoBasis ? "rgba(255,255,255,0.22)" : "rgba(255,180,80,0.7)",
          }}
        />
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: hasNoBasis ? "rgba(255,255,255,0.28)" : "rgba(255,180,80,0.75)",
          }}
        >
          Commercial exposure
        </p>
        <span
          style={{
            ...mono,
            fontSize: "6px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.20)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "0.1rem 0.35rem",
          }}
        >
          {BASIS_LABELS[exposure.basis]}
        </span>
      </div>

      {/* Cost figures — only when basis exists */}
      {!hasNoBasis && hasCostFigures && (
        <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {exposure.costToDate && (
            <div
              style={{
                border: "1px solid rgba(255,180,80,0.12)",
                padding: "0.65rem 0.85rem",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "6.5px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                  marginBottom: "0.25rem",
                }}
              >
                Estimated cost to date
              </p>
              <p
                style={{
                  ...serif,
                  fontSize: "1.2rem",
                  lineHeight: 1.2,
                  color: "rgba(255,180,80,0.85)",
                }}
              >
                {exposure.costToDate}
              </p>
            </div>
          )}

          {exposure.avoidableThirtyDayExposure && (
            <div
              style={{
                border: "1px solid rgba(255,180,80,0.12)",
                padding: "0.65rem 0.85rem",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "6.5px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                  marginBottom: "0.25rem",
                }}
              >
                Avoidable 30-day exposure
              </p>
              <p
                style={{
                  ...serif,
                  fontSize: "1.2rem",
                  lineHeight: 1.2,
                  color: "rgba(255,180,80,0.85)",
                }}
              >
                {exposure.avoidableThirtyDayExposure}
              </p>
            </div>
          )}
        </div>
      )}

      {/* No basis — structural consequence only */}
      {hasNoBasis && (
        <p
          style={{
            ...serif,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.38)",
            marginBottom: "0.5rem",
          }}
        >
          No cost basis is available for this case. The commercial consequence of
          delay is structural — delayed accountability decisions compound in
          ambiguity, reduced optionality, and increased reversal cost.
        </p>
      )}

      {/* Mandatory disclaimer */}
      <p
        style={{
          ...mono,
          fontSize: "6.5px",
          letterSpacing: "0.10em",
          color: "rgba(255,255,255,0.22)",
          lineHeight: 1.6,
          marginTop: hasNoBasis ? 0 : "0.25rem",
        }}
      >
        {exposure.disclaimer}
      </p>
    </section>
  );
}

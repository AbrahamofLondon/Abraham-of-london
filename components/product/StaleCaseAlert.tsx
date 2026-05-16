/**
 * components/product/StaleCaseAlert.tsx
 *
 * User-facing alert that surfaces when one or more of the user's governed
 * cases has not received a move for 30+ days (WATCH), 60+ days (ALERT),
 * or 90+ days (CRITICAL).
 *
 * Rules:
 * - Never shown without at least one stale case.
 * - CRITICAL cases surface first.
 * - Never more than 3 cases shown in the alert (link to DC for full list).
 * - Each case shows its band, days inactive, and up to 5 action options.
 * - User can dismiss per-case (session only — not persisted).
 *
 * Usage:
 *   <StaleCaseAlert cases={staleCases} />
 *
 * Placement:
 * - Decision Centre page (above case list)
 */

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ChevronDown, ChevronUp, X } from "lucide-react";

import type { StaleCaseResult, StalenessBand } from "@/lib/product/stale-governed-case-detector";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Band styles ─────────────────────────────────────────────────────────────

const BAND_STYLES: Record<
  StalenessBand,
  { border: string; bg: string; label: string; iconColor: string; textColor: string }
> = {
  WATCH: {
    border: `1px solid ${GOLD}30`,
    bg: `${GOLD}05`,
    label: "WATCH",
    iconColor: `${GOLD}90`,
    textColor: `${GOLD}CC`,
  },
  ALERT: {
    border: "1px solid rgba(255,180,80,0.35)",
    bg: "rgba(255,180,80,0.05)",
    label: "ALERT",
    iconColor: "rgba(255,160,60,0.90)",
    textColor: "rgba(255,160,60,0.95)",
  },
  CRITICAL: {
    border: "1px solid rgba(255,90,90,0.30)",
    bg: "rgba(255,90,90,0.04)",
    label: "CRITICAL",
    iconColor: "rgba(255,110,110,0.90)",
    textColor: "rgba(255,110,110,0.95)",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type StaleCaseAlertProps = {
  cases: StaleCaseResult[];
  /** Max cases to show before "view all" link; default 3 */
  maxVisible?: number;
};

// ─── Single stale case card ───────────────────────────────────────────────────

function StaleCaseCard({
  stale,
  onDismiss,
}: {
  stale: StaleCaseResult;
  onDismiss: (caseId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const styles = BAND_STYLES[stale.band];

  return (
    <div
      style={{
        border: styles.border,
        backgroundColor: styles.bg,
        padding: "1rem 1.1rem",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <AlertTriangle
            className="h-4 w-4 shrink-0"
            style={{ color: styles.iconColor }}
          />

          {/* Band pill */}
          <span
            style={{
              ...mono,
              fontSize: "6.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: styles.textColor,
              border: styles.border,
              padding: "0.1rem 0.4rem",
            }}
          >
            {styles.label}
          </span>

          {/* Days inactive */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              ...mono,
              fontSize: "6.5px",
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.32)",
            }}
          >
            <Clock className="h-3 w-3" />
            {stale.daysInactive} days inactive
          </span>
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={() => onDismiss(stale.caseId)}
          aria-label="Dismiss alert"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.22)",
            padding: "0",
            flexShrink: 0,
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Title */}
      <p
        style={{
          ...serif,
          fontSize: "0.95rem",
          lineHeight: 1.45,
          color: "rgba(255,255,255,0.80)",
          marginTop: "0.55rem",
        }}
      >
        {stale.title}
      </p>

      {/* Headline */}
      <p
        style={{
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.08em",
          color: styles.textColor,
          marginTop: "0.35rem",
          lineHeight: 1.5,
        }}
      >
        {stale.headline}
      </p>

      {/* Expand / collapse consequence */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)",
          padding: "0",
          marginTop: "0.6rem",
        }}
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3 w-3" /> Hide consequence
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" /> What this means
          </>
        )}
      </button>

      {expanded && (
        <p
          style={{
            ...serif,
            fontSize: "0.88rem",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.48)",
            marginTop: "0.6rem",
          }}
        >
          {stale.consequence}
        </p>
      )}

      {/* Actions */}
      <div
        className="flex flex-wrap gap-2"
        style={{ marginTop: "0.85rem" }}
      >
        {stale.actions.map((action) => (
          <Link
            key={action.kind}
            href={action.href}
            title={action.description}
            style={{
              ...mono,
              fontSize: "7.5px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textDecoration: "none",
              padding: "0.4rem 0.75rem",
              border: action.primary
                ? `1px solid ${GOLD}44`
                : "1px solid rgba(255,255,255,0.10)",
              backgroundColor: action.primary ? `${GOLD}0C` : "transparent",
              color: action.primary
                ? `${GOLD}DD`
                : "rgba(255,255,255,0.38)",
              minHeight: "32px",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StaleCaseAlert({
  cases,
  maxVisible = 3,
}: StaleCaseAlertProps) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  const visible = cases.filter((c) => !dismissed.has(c.caseId));
  if (visible.length === 0) return null;

  const shown = visible.slice(0, maxVisible);
  const remaining = visible.length - shown.length;

  function handleDismiss(caseId: string) {
    setDismissed((prev) => new Set([...prev, caseId]));
  }

  return (
    <section aria-label="Stale case alerts">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          Cases requiring a move
        </p>
        <span
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.10em",
            color: "rgba(255,255,255,0.20)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "0.1rem 0.4rem",
          }}
        >
          {visible.length}
        </span>
      </div>

      {/* Case cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {shown.map((stale) => (
          <StaleCaseCard
            key={stale.caseId}
            stale={stale}
            onDismiss={handleDismiss}
          />
        ))}
      </div>

      {/* "View all" overflow link */}
      {remaining > 0 && (
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.28)",
            marginTop: "0.75rem",
          }}
        >
          +{remaining} more case{remaining === 1 ? "" : "s"} require attention.{" "}
          <Link
            href="/decision-centre"
            style={{ color: `${GOLD}99`, textDecoration: "none" }}
          >
            View all in Decision Centre
          </Link>
        </p>
      )}
    </section>
  );
}

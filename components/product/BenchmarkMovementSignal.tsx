/**
 * components/product/BenchmarkMovementSignal.tsx
 *
 * Benchmark movement signal for Return Brief.
 *
 * Shows how the benchmark position has moved (or not) since the original
 * governed case was created. Used as a re-engagement signal: "here is what
 * the cohort now shows vs. when you first ran this case."
 *
 * Rules:
 * - Requires Professional tier. Free tier shows upgrade prompt only.
 * - Only shows movement when there is a meaningful delta (≥ 5 pts or 5 percentile points).
 * - Movement direction is shown contextually — not as "you were X, now Y" but as
 *   "the cohort context has shifted since this case was opened."
 * - Never claims the change is good or bad — shows direction and magnitude only.
 * - Always shows disclaimer.
 * - Does not render when both positions are unavailable.
 *
 * Usage:
 *   <BenchmarkMovementSignal
 *     originalImprovementRate={62}
 *     currentImprovementRate={71}
 *     originalN={60}
 *     currentN={88}
 *     tier="professional"
 *   />
 *
 * Placement:
 * - Return Brief result page — before the re-engagement CTA
 * - Decision Centre case detail when a return brief is available
 */

import * as React from "react";
import Link from "next/link";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type BenchmarkMovementSignalProps = {
  /**
   * Improvement rate (%) when the original case was governed.
   * null = not available at that time.
   */
  originalImprovementRate: number | null;
  /** Current improvement rate (%) from the live benchmark pool. */
  currentImprovementRate: number | null;
  /** Pool size at the time of the original case. */
  originalN: number;
  /** Current pool size. */
  currentN: number;
  /** Access tier for the current user. */
  tier?: "free" | "professional" | "retainer";
  /** Optional: days since the case was originally governed. */
  daysSinceCase?: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function movementLabel(delta: number): { label: string; color: string } {
  const abs = Math.abs(delta);
  if (abs < 5) return { label: "No meaningful movement", color: "rgba(255,255,255,0.40)" };
  if (delta > 0) {
    if (delta >= 15) return { label: `+${delta}pp — cohort improvement rate is notably higher`, color: "rgba(110,231,183,0.80)" };
    return { label: `+${delta}pp — cohort improvement rate has grown`, color: "rgba(110,231,183,0.65)" };
  }
  if (delta <= -15) return { label: `${delta}pp — cohort improvement rate is notably lower`, color: "rgba(252,165,165,0.75)" };
  return { label: `${delta}pp — cohort improvement rate has declined`, color: "rgba(252,165,165,0.60)" };
}

function poolGrowthLabel(original: number, current: number): string {
  const delta = current - original;
  if (delta <= 0) return `Pool: ${current} cases`;
  return `Pool: ${original} → ${current} cases (+${delta} since case opened)`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BenchmarkMovementSignal({
  originalImprovementRate,
  currentImprovementRate,
  originalN,
  currentN,
  tier = "free",
  daysSinceCase,
}: BenchmarkMovementSignalProps) {
  // Free tier — upgrade prompt
  if (tier === "free") {
    return (
      <section
        style={{
          border: `1px solid ${GOLD}20`,
          background: `${GOLD}04`,
          padding: "0.85rem 1rem",
        }}
        aria-label="Benchmark movement signal"
      >
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: `${GOLD}88`,
            marginBottom: "0.35rem",
          }}
        >
          Benchmark movement · Professional
        </p>
        <p
          style={{
            ...mono,
            fontSize: "8.5px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.35)",
            marginBottom: "0.65rem",
          }}
        >
          See how the benchmark cohort has shifted since this case was opened.
          Return Brief uses benchmark movement as a re-engagement signal.
        </p>
        <Link
          href="/professionals"
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: `${GOLD}CC`,
            textDecoration: "none",
          }}
        >
          Unlock benchmark movement signals →
        </Link>
      </section>
    );
  }

  // No data at all
  if (currentImprovementRate === null) return null;

  // If no original rate, show current only (first return brief)
  if (originalImprovementRate === null) {
    return (
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.01)",
          padding: "1rem 1.1rem",
        }}
        aria-label="Benchmark movement signal"
      >
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            marginBottom: "0.55rem",
          }}
        >
          Benchmark context
        </p>
        <p
          style={{
            ...mono,
            fontSize: "9px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          Current benchmark improvement rate: {currentImprovementRate}% ({currentN} opted-in cases).
          Benchmark movement will appear on subsequent Return Briefs.
        </p>
      </section>
    );
  }

  const delta = currentImprovementRate - originalImprovementRate;
  const { label, color } = movementLabel(delta);

  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.01)",
        padding: "1rem 1.1rem",
      }}
      aria-label="Benchmark movement signal"
    >
      {/* Header */}
      <p
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.20em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)",
          marginBottom: "0.65rem",
        }}
      >
        Benchmark movement since case opened
        {daysSinceCase != null && (
          <span style={{ color: "rgba(255,255,255,0.18)", marginLeft: "6px" }}>
            ({daysSinceCase} days)
          </span>
        )}
      </p>

      {/* Movement delta */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "0.6rem", flexWrap: "wrap" }}>
        <p style={{ ...serif, fontSize: "1.3rem", color }}>
          {delta >= 0 ? `+${delta}` : delta}
          <span style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.28)", marginLeft: "4px" }}>pp</span>
        </p>
        <p style={{ ...mono, fontSize: "8px", color, lineHeight: 1.5 }}>
          {label}
        </p>
      </div>

      {/* Before / After */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          marginBottom: "0.65rem",
        }}
      >
        <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.55rem 0.7rem" }}>
          <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.25rem" }}>
            At case open
          </p>
          <p style={{ ...serif, fontSize: "1rem", color: "rgba(255,255,255,0.55)" }}>
            {originalImprovementRate}%
            <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.22)", marginLeft: "4px" }}>n={originalN}</span>
          </p>
        </div>
        <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.55rem 0.7rem" }}>
          <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.25rem" }}>
            Now
          </p>
          <p style={{ ...serif, fontSize: "1rem", color: "rgba(255,255,255,0.72)" }}>
            {currentImprovementRate}%
            <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.22)", marginLeft: "4px" }}>n={currentN}</span>
          </p>
        </div>
      </div>

      {/* Pool growth */}
      <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.22)", lineHeight: 1.6, marginBottom: "0.2rem" }}>
        {poolGrowthLabel(originalN, currentN)}
      </p>

      {/* Disclaimer */}
      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.14)", lineHeight: 1.6 }}>
        Outcomes are self-reported at the time of contribution. The system does not independently verify.
        Benchmark movement contextualises cohort shifts — it does not predict individual outcomes.
      </p>
    </section>
  );
}

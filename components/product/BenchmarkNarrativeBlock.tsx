/**
 * components/product/BenchmarkNarrativeBlock.tsx
 *
 * Renders a structured benchmark narrative for Executive Reporting.
 *
 * Takes a pre-built BenchmarkNarrative (from lib/benchmarks/benchmark-narrative.ts)
 * and renders it as a governed prose block suitable for board-level report output.
 *
 * Rules:
 * - Only renders when narrative.available = true.
 * - Always shows disclaimer.
 * - Never shows narrative.available = false without a fallback — caller
 *   should not render this component with an unavailable narrative unless
 *   they want the fallback to show.
 * - Phrasing is contextualisation, not prediction.
 *
 * Usage:
 *   const narrative = buildBenchmarkNarrative(position, { surface: "executive_report", tier });
 *   <BenchmarkNarrativeBlock narrative={narrative} />
 *
 * Placement:
 * - Executive Reporting result page — benchmark section before recommendations
 * - Professional governed case detail — benchmark position section
 */

import * as React from "react";
import Link from "next/link";
import type { BenchmarkNarrative } from "@/lib/benchmarks/benchmark-narrative";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type BenchmarkNarrativeBlockProps = {
  narrative: BenchmarkNarrative;
  /** Visual weight. "full" = section header + full prose. "compact" = headline only. */
  variant?: "full" | "compact";
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function BenchmarkNarrativeBlock({
  narrative,
  variant = "full",
}: BenchmarkNarrativeBlockProps) {
  // Unavailable — show building/fallback state
  if (!narrative.available) {
    return (
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.01)",
          padding: "1rem 1.2rem",
        }}
        aria-label="Benchmark context"
      >
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.22)",
            marginBottom: "0.4rem",
          }}
        >
          Benchmark context · Building
        </p>
        <p
          style={{
            ...mono,
            fontSize: "8.5px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.32)",
          }}
        >
          {narrative.positionStatement}
        </p>
      </section>
    );
  }

  // Compact variant — headline + n only
  if (variant === "compact") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "10px",
          padding: "6px 0",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          flexWrap: "wrap",
        }}
        aria-label="Benchmark context summary"
      >
        <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.60)", flex: 1, minWidth: "180px" }}>
          {narrative.headline}
        </p>
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)" }}>
          n={narrative.n}
        </span>
      </div>
    );
  }

  // Full variant
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.015)",
        padding: "1.2rem 1.4rem",
      }}
      aria-label="Benchmark context"
    >
      {/* Section label */}
      <p
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.20em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)",
          marginBottom: "0.75rem",
        }}
      >
        Benchmark context · n={narrative.n}
      </p>

      {/* Headline */}
      <p
        style={{
          ...serif,
          fontSize: "1.05rem",
          lineHeight: 1.4,
          color: "rgba(255,255,255,0.82)",
          marginBottom: "0.6rem",
        }}
      >
        {narrative.headline}
      </p>

      {/* Position statement */}
      <p
        style={{
          ...mono,
          fontSize: "9px",
          lineHeight: 1.8,
          color: "rgba(255,255,255,0.50)",
          marginBottom: narrative.deviations.length > 0 ? "0.85rem" : "0.5rem",
        }}
      >
        {narrative.positionStatement}
      </p>

      {/* Per-metric deviations */}
      {narrative.deviations.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            marginBottom: "0.85rem",
          }}
        >
          {narrative.deviations.map((d) => (
            <div
              key={d.metricKey}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: d.atOrAboveMedian
                    ? "rgba(110,231,183,0.60)"
                    : "rgba(252,165,165,0.55)",
                  flexShrink: 0,
                  paddingTop: "2px",
                }}
              >
                {d.percentile}th
              </span>
              <p
                style={{
                  ...mono,
                  fontSize: "8px",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.42)",
                }}
              >
                {d.sentence}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Upgrade signal */}
      {narrative.upgradeSignal && (
        <div
          style={{
            padding: "0.55rem 0.75rem",
            border: `1px solid ${GOLD}18`,
            background: `${GOLD}05`,
            marginBottom: "0.75rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              ...mono,
              fontSize: "7.5px",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.35)",
              flex: 1,
            }}
          >
            Advanced benchmark context — role, industry, organisation — available with Professional.
          </p>
          <Link
            href="/professionals"
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: `${GOLD}CC`,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Upgrade →
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <p
        style={{
          ...mono,
          fontSize: "6px",
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.16)",
          lineHeight: 1.6,
        }}
      >
        {narrative.disclaimer}
      </p>
    </section>
  );
}

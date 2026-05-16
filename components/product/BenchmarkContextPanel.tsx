/**
 * components/product/BenchmarkContextPanel.tsx
 *
 * Renders aggregate benchmark context derived from opted-in outcome
 * contributions. Requires n ≥ 50 before any data is shown.
 *
 * Rules:
 * - Never shown without n ≥ 50 contributions.
 * - Always shows source label (n and opt-in nature).
 * - Always shows disclaimer (self-reported, not a guarantee).
 * - "Building" state shown when n < 50 — no fake data.
 * - Improvement rate shown as a percentage, not a raw outcome.
 *
 * Usage:
 *   <BenchmarkContextPanel assessmentKind="FAST_DIAGNOSTIC" />
 *
 * Placement:
 * - AssessmentResultSurface (after result, before conversion panel)
 * - Decision Centre case detail
 */

import * as React from "react";
import type { BenchmarkContext } from "@/lib/product/outcome-contribution-contract";
import type { BenchmarkContextApiResponse } from "@/pages/api/cases/benchmark-context";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type BenchmarkContextPanelProps = {
  /** Optional: filter to a specific assessment kind */
  assessmentKind?: string | null;
  /** Pre-loaded context (skips fetch if provided) */
  preloaded?: BenchmarkContext | null;
};

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
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
          marginBottom: "0.3rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          ...serif,
          fontSize: "1.15rem",
          lineHeight: 1.2,
          color: `${GOLD}CC`,
        }}
      >
        {value}
      </p>
    </div>
  );
}

const TIME_LABELS: Record<string, string> = {
  IMMEDIATE: "Within 1 week",
  SHORT: "1–4 weeks",
  MEDIUM: "1–3 months",
  LONG: "3+ months",
  DID_NOT_ACT: "Did not act",
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function BenchmarkContextPanel({
  assessmentKind,
  preloaded,
}: BenchmarkContextPanelProps) {
  const [ctx, setCtx] = React.useState<BenchmarkContext | null>(preloaded ?? null);
  const [loading, setLoading] = React.useState(!preloaded);

  React.useEffect(() => {
    if (preloaded) return;

    let cancelled = false;
    const url = assessmentKind
      ? `/api/cases/benchmark-context?assessmentKind=${encodeURIComponent(assessmentKind)}`
      : "/api/cases/benchmark-context";

    fetch(url)
      .then((r) => r.json())
      .then((json: BenchmarkContextApiResponse) => {
        if (!cancelled) {
          setCtx(json.benchmark);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assessmentKind, preloaded]);

  if (loading) return null;
  if (!ctx) return null;

  // Don't render anything for NO_DATA — no empty states here
  if (ctx.availability === "NO_DATA") return null;

  // Building state — show pool status, no rates
  if (ctx.availability === "BUILDING") {
    return (
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.06)",
          backgroundColor: "rgba(255,255,255,0.01)",
          padding: "0.85rem 1rem",
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
            marginBottom: "0.35rem",
          }}
        >
          Benchmark pool · Building
        </p>
        <p
          style={{
            ...serif,
            fontSize: "0.88rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.32)",
          }}
        >
          {ctx.n} opted-in outcome contribution{ctx.n === 1 ? "" : "s"} so far. Benchmark data becomes available at 50 contributions.
          Contribute your outcome to help build the pool.
        </p>
      </section>
    );
  }

  // Available — show the benchmark data
  return (
    <section
      style={{
        border: `1px solid rgba(255,255,255,0.08)`,
        backgroundColor: "rgba(255,255,255,0.01)",
        padding: "1rem 1.1rem",
      }}
      aria-label="Benchmark context"
    >
      {/* Header */}
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
        Benchmark context
      </p>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        {ctx.improvementRate !== null && (
          <StatCell
            label="Cases improved or resolved"
            value={`${ctx.improvementRate}%`}
          />
        )}
        {ctx.findingAccuracyRate !== null && (
          <StatCell
            label="Finding rated accurate"
            value={`${ctx.findingAccuracyRate}%`}
          />
        )}
        {ctx.recommendationUsefulRate !== null && (
          <StatCell
            label="Recommendation rated useful"
            value={`${ctx.recommendationUsefulRate}%`}
          />
        )}
        {ctx.mostCommonTimeToAct !== null && (
          <StatCell
            label="Most common time to act"
            value={TIME_LABELS[ctx.mostCommonTimeToAct] ?? ctx.mostCommonTimeToAct}
          />
        )}
      </div>

      {/* Source label — mandatory */}
      <p
        style={{
          ...mono,
          fontSize: "6.5px",
          letterSpacing: "0.10em",
          color: "rgba(255,255,255,0.22)",
          lineHeight: 1.6,
          marginBottom: "0.25rem",
        }}
      >
        {ctx.sourceLabel}
      </p>

      {/* Disclaimer — mandatory */}
      <p
        style={{
          ...mono,
          fontSize: "6px",
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.16)",
          lineHeight: 1.6,
        }}
      >
        {ctx.disclaimer}
      </p>
    </section>
  );
}

/**
 * components/product/BenchmarkCaseBadge.tsx
 *
 * Compact benchmark position badge for the Decision Centre case view.
 *
 * Shows a single-line benchmark summary — percentile band and comparison type —
 * that fits in a case detail header or sidebar without taking up significant space.
 *
 * Rules:
 * - Compact — no more than 2 lines of visible content.
 * - Does not render below threshold (n < 50).
 * - Links to /benchmark-context for the full explanation.
 * - Professional tier: shows band label + improvement rate.
 * - Free tier: shows band label only + upgrade hint.
 *
 * Usage:
 *   <BenchmarkCaseBadge
 *     assessmentKind="FAST_DIAGNOSTIC"
 *     tier="professional"
 *   />
 *
 * Placement:
 * - Decision Centre case detail — alongside case metadata
 * - Executive Reporting case summary panel
 */

"use client";

import * as React from "react";
import Link from "next/link";
import type { BenchmarkContext } from "@/lib/product/outcome-contribution-contract";
import type { BenchmarkContextApiResponse } from "@/pages/api/cases/benchmark-context";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type BenchmarkCaseBadgeProps = {
  /** Assessment kind to filter benchmark context */
  assessmentKind?: string | null;
  /** Access tier for the current user */
  tier?: "free" | "professional" | "retainer";
  /** Pre-loaded context (skips fetch if provided) */
  preloaded?: BenchmarkContext | null;
  /** If true, include a link to /benchmark-context. Default true. */
  showLearnLink?: boolean;
};

// ─── Band helpers ─────────────────────────────────────────────────────────────

function improvedRateBand(rate: number | null): { label: string; color: string } {
  if (rate === null) return { label: "—", color: "rgba(255,255,255,0.35)" };
  if (rate >= 70) return { label: `${rate}% improved/resolved`, color: "rgba(110,231,183,0.85)" };
  if (rate >= 50) return { label: `${rate}% improved/resolved`, color: `${GOLD}DD` };
  if (rate >= 30) return { label: `${rate}% improved/resolved`, color: "rgba(255,255,255,0.55)" };
  return { label: `${rate}% improved/resolved`, color: "rgba(252,165,165,0.70)" };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BenchmarkCaseBadge({
  assessmentKind,
  tier = "free",
  preloaded,
  showLearnLink = true,
}: BenchmarkCaseBadgeProps) {
  const [ctx, setCtx] = React.useState<BenchmarkContext | null>(preloaded ?? null);
  const [loading, setLoading] = React.useState(!preloaded);

  React.useEffect(() => {
    if (preloaded) return;

    let cancelled = false;
    const params = new URLSearchParams();
    if (assessmentKind) params.set("assessmentKind", assessmentKind);
    const query = params.toString();
    const url = query ? `/api/cases/benchmark-context?${query}` : "/api/cases/benchmark-context";

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

    return () => { cancelled = true; };
  }, [assessmentKind, preloaded]);

  if (loading) return null;
  if (!ctx || ctx.availability === "NO_DATA") return null;

  // Building state — show minimal indicator
  if (ctx.availability === "BUILDING") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.01)",
        }}
        title="Benchmark pool is building (< 50 cases)"
      >
        <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
          Benchmark · Building ({ctx.n}/50)
        </span>
      </div>
    );
  }

  // Available
  const { improvementRate } = ctx;
  const { label: rateLabel, color: rateColor } = improvedRateBand(improvementRate);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "4px 10px",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.015)",
        flexWrap: "wrap",
      }}
      aria-label="Benchmark context badge"
    >
      {/* Benchmark label */}
      <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
        Benchmark ·
      </span>

      {/* Rate */}
      {tier !== "free" ? (
        <span style={{ ...mono, fontSize: "11px", letterSpacing: "0.08em", color: rateColor }}>
          {rateLabel}
        </span>
      ) : (
        <span style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.30)" }}>
          Context available
        </span>
      )}

      {/* n */}
      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.18)" }}>
        n={ctx.n}
      </span>

      {/* Free upgrade hint */}
      {tier === "free" && (
        <Link
          href="/professionals"
          style={{ ...mono, fontSize: "6px", letterSpacing: "0.10em", textTransform: "uppercase", color: `${GOLD}99`, textDecoration: "none" }}
        >
          Upgrade for detail →
        </Link>
      )}

      {/* Learn link */}
      {showLearnLink && (
        <Link
          href="/benchmark-context"
          style={{ ...mono, fontSize: "6px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.20)", textDecoration: "none" }}
        >
          About benchmarks
        </Link>
      )}
    </div>
  );
}

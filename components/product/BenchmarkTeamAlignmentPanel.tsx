/**
 * components/product/BenchmarkTeamAlignmentPanel.tsx
 *
 * Benchmark context panel for Team Assessment divergence scores.
 *
 * Renders the team_alignment benchmark dimension for a given divergence score.
 * Shows percentile position within the opted-in team assessment cohort.
 * Requires Professional tier — shows upgrade prompt if tier = "free".
 *
 * Rules:
 * - Only renders when benchmark position is available (n ≥ 50).
 * - Shows "Building" state below threshold.
 * - Lower divergence is better — phrasing reflects this.
 * - Always discloses sample size.
 * - Shows the cohort note: "opted-in team assessments".
 *
 * Usage:
 *   <BenchmarkTeamAlignmentPanel
 *     teamDivergenceScore={result.teamDivergenceScore}
 *     tier={user.tier}
 *   />
 *
 * Placement:
 * - Team Assessment result page (after team divergence display, before conversion panel)
 */

"use client";

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

export type BenchmarkTeamAlignmentPanelProps = {
  /** Team divergence score 0–100 (lower = more aligned) */
  teamDivergenceScore: number;
  /**
   * Access tier for the current user.
   * "free" — show upgrade prompt only, no benchmark data.
   * "professional" | "retainer" — show benchmark position.
   */
  tier?: "free" | "professional" | "retainer";
  /** Number of opted-in cases in the benchmark pool (0 = fetch from API) */
  poolSize?: number;
};

// ─── API response shape ───────────────────────────────────────────────────────

type TeamAlignmentBenchmarkResponse = {
  available: boolean;
  poolSize: number;
  percentile: number | null;
  cohortMedian: number | null;
  band: "BOTTOM_QUARTILE" | "LOWER_MID" | "UPPER_MID" | "TOP_QUARTILE" | null;
  building: boolean;
};

// ─── Band colours ─────────────────────────────────────────────────────────────

// Lower divergence is better, so TOP_QUARTILE is the lowest divergence
const BAND_COLOR: Record<string, string> = {
  BOTTOM_QUARTILE: "rgba(252,165,165,0.70)",   // high divergence = worse
  LOWER_MID:       "rgba(201,169,110,0.70)",
  UPPER_MID:       "rgba(255,255,255,0.50)",
  TOP_QUARTILE:    "rgba(110,231,183,0.70)",    // low divergence = better
};

// For divergence: lower score = better (TOP_QUARTILE means lowest divergence)
function bandForDivergence(percentile: number): string {
  // Percentile here = % of cohort with HIGHER divergence (i.e. you are at this rank)
  // For inverted metrics: percentile 80 means 80% of cohort has lower divergence than you (bad)
  // We re-interpret: cohort median comparison
  if (percentile <= 25) return "TOP_QUARTILE";    // you're in the best 25%
  if (percentile <= 50) return "UPPER_MID";
  if (percentile <= 75) return "LOWER_MID";
  return "BOTTOM_QUARTILE";
}

function bandLabel(percentile: number): string {
  const band = bandForDivergence(percentile);
  const labels: Record<string, string> = {
    TOP_QUARTILE:    "Low divergence — top quartile",
    UPPER_MID:       "Moderate divergence — upper half",
    LOWER_MID:       "Elevated divergence — lower half",
    BOTTOM_QUARTILE: "High divergence — bottom quartile",
  };
  return labels[band] ?? band;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BenchmarkTeamAlignmentPanel({
  teamDivergenceScore,
  tier = "free",
  poolSize,
}: BenchmarkTeamAlignmentPanelProps) {
  const [data, setData] = React.useState<TeamAlignmentBenchmarkResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (tier === "free") {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      assessmentKind: "TEAM_ASSESSMENT",
      metric: "teamDivergenceScore",
      value: String(teamDivergenceScore),
    });

    fetch(`/api/cases/benchmark-context?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setData(json.teamAlignment ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [teamDivergenceScore, tier]);

  // Free tier — show upgrade prompt only
  if (tier === "free") {
    return (
      <section
        style={{
          border: `1px solid ${GOLD}20`,
          background: `${GOLD}04`,
          padding: "0.85rem 1rem",
        }}
        aria-label="Team alignment benchmark"
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
          Team alignment benchmark · Professional
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
          See how this team divergence score compares to opted-in team assessments in the benchmark pool.
          Industry, organisation, and sector-level comparisons are included.
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
          Unlock team alignment benchmarks →
        </Link>
      </section>
    );
  }

  if (loading) return null;

  // Building state
  if (!data || data.building || !data.available) {
    const n = data?.poolSize ?? (poolSize ?? 0);
    return (
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.01)",
          padding: "0.85rem 1rem",
        }}
        aria-label="Team alignment benchmark"
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
          Team alignment benchmark · Building
        </p>
        <p
          style={{
            ...mono,
            fontSize: "8.5px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.32)",
          }}
        >
          {n > 0 ? `${n} opted-in team assessment${n === 1 ? "" : "s"} in the pool.` : ""}
          {" "}Team alignment benchmark data becomes available at 50 opted-in assessments.
        </p>
      </section>
    );
  }

  // Available
  const { percentile, cohortMedian, poolSize: n } = data;
  if (percentile === null) return null;

  const band = bandForDivergence(percentile);
  const color = BAND_COLOR[band] ?? "rgba(255,255,255,0.50)";
  const fillPct = Math.min(100, Math.max(0, teamDivergenceScore));

  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.01)",
        padding: "1rem 1.1rem",
      }}
      aria-label="Team alignment benchmark"
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
          Team alignment benchmark
        </p>
        <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", color, textTransform: "uppercase" }}>
          {bandLabel(percentile)}
        </span>
      </div>

      {/* Score + percentile row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
        <p style={{ ...serif, fontSize: "1.4rem", color: color }}>
          {teamDivergenceScore}
          <span style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.30)", marginLeft: "6px" }}>/ 100</span>
        </p>
        <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.35)" }}>
          {percentile}th percentile
          {cohortMedian !== null && (
            <span style={{ color: "rgba(255,255,255,0.22)", marginLeft: "6px" }}>
              (median: {cohortMedian})
            </span>
          )}
        </p>
      </div>

      {/* Track bar */}
      <div style={{ position: "relative", height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", marginBottom: "0.65rem" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${fillPct}%`,
            background: color,
            borderRadius: "2px",
            transition: "width 0.4s ease",
          }}
        />
        {/* Cohort median marker */}
        {cohortMedian !== null && (
          <div
            style={{
              position: "absolute",
              top: "-2px",
              left: `${cohortMedian}%`,
              width: "1px",
              height: "7px",
              background: "rgba(255,255,255,0.25)",
            }}
          />
        )}
      </div>

      {/* Source + disclaimer */}
      <p style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.22)", lineHeight: 1.6, marginBottom: "0.2rem" }}>
        Based on {n} opted-in team assessment{n === 1 ? "" : "s"} with outcome contributions. Lower divergence is better.
      </p>
      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.14)", lineHeight: 1.6 }}>
        Outcomes are self-reported at the time of contribution. Not a guarantee of results.
      </p>
    </section>
  );
}

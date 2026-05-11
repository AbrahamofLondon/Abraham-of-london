"use client";

import * as React from "react";
import type { PercentileResult } from "@/lib/sovereign/intelligence-commons";

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const BAND_COLOR: Record<PercentileResult["band"], string> = {
  BOTTOM_QUARTILE: "rgba(252,165,165,0.55)",
  LOWER_MID: "rgba(201,169,110,0.55)",
  UPPER_MID: "rgba(255,255,255,0.40)",
  TOP_QUARTILE: "rgba(110,231,183,0.55)",
};

const BAND_LABEL: Record<PercentileResult["band"], string> = {
  BOTTOM_QUARTILE: "Bottom quartile",
  LOWER_MID: "Lower mid",
  UPPER_MID: "Upper mid",
  TOP_QUARTILE: "Top quartile",
};

type Props = {
  label: string;
  score: number;
  maxScore?: number;
  benchmark: PercentileResult;
  /** Show the percentile track bar. Default true. */
  showTrack?: boolean;
};

export default function BenchmarkStrip({ label, score, maxScore = 100, benchmark, showTrack = true }: Props) {
  const fillPct = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const color = BAND_COLOR[benchmark.band];

  return (
    <div>
      {/* ── Label row ──────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px", gap: "12px" }}>
        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.50)" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexShrink: 0 }}>
          <span style={{ ...MONO, fontSize: "13px", letterSpacing: "0.02em", color: "#F5F5F5" }}>
            {score}
          </span>
          <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color }}>
            {benchmark.percentile}th pct
          </span>
        </div>
      </div>

      {/* ── Track bar ──────────────────────────────────────── */}
      {showTrack && (
        <div style={{ position: "relative", height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
          {/* Score fill */}
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
          {/* Median reference line at 50th percentile */}
          <div
            style={{
              position: "absolute",
              top: "-2px",
              left: "50%",
              width: "1px",
              height: "7px",
              background: "rgba(255,255,255,0.12)",
            }}
          />
          {/* Percentile marker — your position */}
          <div
            style={{
              position: "absolute",
              top: "-3px",
              left: `${benchmark.percentile}%`,
              width: "2px",
              height: "9px",
              background: color,
              opacity: 0.85,
            }}
          />
        </div>
      )}

      {/* ── Band label ─────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
        <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
          {BAND_LABEL[benchmark.band]}
        </span>
        {benchmark.dataSource === "THEORETICAL" && (
          <span style={{ ...MONO, fontSize: "7px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>
            theoretical benchmark
          </span>
        )}
        {benchmark.cohortSize > 0 && (
          <span style={{ ...MONO, fontSize: "7px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.15)" }}>
            n={benchmark.cohortSize}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Multi-score benchmark display ───────────────────────────────────────────

type BenchmarkReportProps = {
  benchmarks: Record<string, PercentileResult>;
  scores: Record<string, number>;
  cohortKey: string;
  commonsSize: number;
};

const METRIC_LABELS: Record<string, string> = {
  authorityClarity: "Authority clarity",
  narrativeCoherence: "Narrative coherence",
  interventionReadiness: "Intervention readiness",
  executionReadiness: "Execution readiness",
};

export function BenchmarkReport({ benchmarks, scores, cohortKey, commonsSize }: BenchmarkReportProps) {
  const entries = Object.entries(benchmarks).filter(([key]) => key in scores);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ ...MONO, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", margin: 0 }}>
          Benchmark position
        </p>
        <span style={{ ...MONO, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
          Cohort: {cohortKey.replace(".", " · ")}
          {commonsSize > 0 ? ` · n=${commonsSize}` : " · theoretical"}
        </span>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        {entries.map(([key, benchmark]) => (
          <BenchmarkStrip
            key={key}
            label={METRIC_LABELS[key] ?? key}
            score={scores[key] ?? 0}
            benchmark={benchmark}
          />
        ))}
      </div>

      {commonsSize === 0 && (
        <p style={{ ...MONO, fontSize: "8px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.18)", marginTop: "12px" }}>
          Percentiles are theoretically grounded. They will update with empirical data as the Intelligence Commons grows.
        </p>
      )}
    </div>
  );
}

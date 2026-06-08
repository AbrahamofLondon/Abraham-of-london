/**
 * lib/benchmarks/benchmark-narrative.ts
 *
 * Benchmark Narrative — structured prose output from a BenchmarkPosition.
 *
 * Converts a computed BenchmarkPosition (from benchmark-engine.ts) and
 * product context into a typed, human-readable narrative structure.
 *
 * Rules:
 * - Never claims "you are X% better than peers" — uses contextualisation phrasing.
 * - Never emits narrative when BenchmarkPosition.available = false.
 * - Always includes the sample size (n) in the narrative.
 * - Always includes the disclaimer.
 * - Phrasing varies by metric direction (higherIsBetter).
 * - Upgrade signal is only emitted when the metric is professional-gated and
 *   the caller provides tier = "free".
 *
 * Usage:
 *   const narrative = buildBenchmarkNarrative(position, {
 *     surface: "fast_diagnostic",
 *     tier: "free",
 *     role: "leader",
 *   });
 */

import type { BenchmarkPosition } from "./benchmark-engine";
import type { BenchmarkAccessTier } from "./benchmark-context-authority";
import type { ProductSurface } from "./benchmark-metric-registry";
import { getMetricSpec, getMetricsForTier } from "./benchmark-metric-registry";
import { BENCHMARK_CAPABILITY, buildBenchmarkDisclaimer } from "./benchmark-context-authority";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BenchmarkNarrativeDeviation = {
  metricKey: string;
  label: string;
  /** Short contextualisation sentence about this metric's position */
  sentence: string;
  /** Whether the metric is at or above the cohort median */
  atOrAboveMedian: boolean;
  /** Percentile position 0-100 */
  percentile: number;
};

export type BenchmarkNarrative = {
  /** One-line headline for the benchmark position overall */
  headline: string;
  /** 2-3 sentence narrative contextualising the overall position */
  positionStatement: string;
  /** Per-metric context sentences (only metrics with deviations present in position) */
  deviations: BenchmarkNarrativeDeviation[];
  /** Signal shown when professional metrics are available but user is on free tier */
  upgradeSignal: string | null;
  /** Sample size used in the computation */
  n: number;
  /** Full disclaimer */
  disclaimer: string;
  /** Whether the narrative is complete (false = below threshold or position unavailable) */
  available: boolean;
};

export type BenchmarkNarrativeContext = {
  surface: ProductSurface;
  tier: BenchmarkAccessTier;
  /** Optional: role of the decision-maker, e.g. "leader", "advisor" */
  role?: string;
  /** Optional: override for assessment kind label in prose */
  assessmentLabel?: string;
};

// ─── Phrasing helpers ─────────────────────────────────────────────────────────

function bandLabel(percentile: number): string {
  if (percentile >= 75) return "top quartile";
  if (percentile >= 50) return "upper half";
  if (percentile >= 25) return "lower half";
  return "bottom quartile";
}

function directionPhrase(
  percentile: number,
  higherIsBetter: boolean,
  label: string,
): string {
  const band = bandLabel(percentile);
  const isStrong = percentile >= 60;
  const isWeak = percentile < 40;

  if (higherIsBetter) {
    if (isStrong) return `${label} places in the ${band} of the benchmark cohort.`;
    if (isWeak) return `${label} is below the cohort median — there is room to improve relative to comparable cases.`;
    return `${label} is broadly in line with the cohort median.`;
  } else {
    // Lower is better (e.g. escalation frequency, divergence score)
    if (percentile <= 25) {
      return `${label} is lower than the majority of comparable cases — a relatively controlled position.`;
    }
    if (percentile >= 75) {
      return `${label} is higher than most comparable cases — this warrants attention relative to the cohort.`;
    }
    return `${label} is near the cohort median.`;
  }
}

function overallHeadline(
  dominantPercentile: number,
  surface: ProductSurface,
  assessmentLabel: string,
): string {
  const band = bandLabel(dominantPercentile);
  return `This ${assessmentLabel} places in the ${band} of comparable cases in the benchmark pool.`;
}

function positionStatement(
  dominantPercentile: number,
  n: number,
  surface: ProductSurface,
  assessmentLabel: string,
): string {
  const band = bandLabel(dominantPercentile);
  const poolNote = `Based on ${n} opted-in governed case${n === 1 ? "" : "s"}.`;

  if (dominantPercentile >= 75) {
    return (
      `This ${assessmentLabel} position is in the ${band} of the benchmark cohort. ` +
      `${poolNote} ` +
      `Benchmark context contextualises but does not predict — conditions and decisions vary.`
    );
  }
  if (dominantPercentile >= 50) {
    return (
      `This ${assessmentLabel} position is in the upper half of the benchmark cohort. ` +
      `${poolNote} ` +
      `Benchmark context shows where this case sits relative to opted-in cases — it does not predict outcome.`
    );
  }
  if (dominantPercentile >= 25) {
    return (
      `This ${assessmentLabel} position is in the lower half of the benchmark cohort. ` +
      `${poolNote} ` +
      `Benchmark context identifies relative position; it does not prescribe action.`
    );
  }
  return (
    `This ${assessmentLabel} position is in the bottom quartile of the benchmark cohort. ` +
    `${poolNote} ` +
    `Benchmark context contextualises relative position; individual circumstances vary significantly.`
  );
}

function upgradeSignalText(surface: ProductSurface): string {
  return (
    `Advanced benchmark context — including organisation, industry, sector, and role comparisons — ` +
    `is available with a Professional subscription. ` +
    `Upgrade at abrahamoflondon.org/professionals.`
  );
}

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Build a BenchmarkNarrative from a computed BenchmarkPosition.
 *
 * Returns a narrative with available = false when the position is not available.
 * Caller should check narrative.available before rendering.
 */
export function buildBenchmarkNarrative(
  position: BenchmarkPosition,
  ctx: BenchmarkNarrativeContext,
): BenchmarkNarrative {
  const { surface, tier, assessmentLabel = "assessment" } = ctx;

  // Below threshold or no data
  if (!position.available) {
    return {
      headline: "Benchmark context is building",
      positionStatement:
        position.insufficientReason ??
        `The benchmark pool does not yet have sufficient opted-in cases for this dimension. ` +
        `Benchmark output will appear automatically when the pool reaches ${BENCHMARK_CAPABILITY.minimumPoolSize} cases.`,
      deviations: [],
      upgradeSignal: null,
      n: position.cohort.sampleSize,
      disclaimer: BENCHMARK_CAPABILITY.disclaimer,
      available: false,
    };
  }

  // Map position deviations to narrative deviations
  // Only include metrics we have a spec for and that are available at this tier
  const availableMetrics = getMetricsForTier(surface, tier);
  const availableKeys = new Set(availableMetrics.map((m) => m.metricKey));

  const deviations: BenchmarkNarrativeDeviation[] = position.deviations
    .filter((d) => availableKeys.has(d.metric))
    .map((d) => {
      const spec = getMetricSpec(surface, d.metric);
      const label = spec?.label ?? d.metric;
      const higherIsBetter = spec?.higherIsBetter ?? true;
      return {
        metricKey: d.metric,
        label,
        sentence: directionPhrase(d.percentile, higherIsBetter, label),
        atOrAboveMedian: d.percentile >= 50,
        percentile: d.percentile,
      };
    });

  // Dominant percentile = median of available deviations, or cohort-based overall
  const percentiles = deviations.map((d) => d.percentile);
  const dominantPercentile =
    percentiles.length > 0
      ? Math.round(percentiles.reduce((a, b) => a + b, 0) / percentiles.length)
      : 50;

  // Upgrade signal — only when on free tier and professional metrics exist for this surface
  const professionalMetrics = getMetricsForTier(surface, "professional").filter(
    (m) => m.accessTier === "professional",
  );
  const showUpgradeSignal = tier === "free" && professionalMetrics.length > 0;

  return {
    headline: overallHeadline(dominantPercentile, surface, assessmentLabel),
    positionStatement: positionStatement(
      dominantPercentile,
      position.cohort.sampleSize,
      surface,
      assessmentLabel,
    ),
    deviations,
    upgradeSignal: showUpgradeSignal ? upgradeSignalText(surface) : null,
    n: position.cohort.sampleSize,
    disclaimer: buildBenchmarkDisclaimer(position.cohort.sampleSize),
    available: true,
  };
}

// ─── Unavailable guard ────────────────────────────────────────────────────────

/** Returns an unavailable narrative shell with no position data. */
export function buildUnavailableBenchmarkNarrative(reason?: string): BenchmarkNarrative {
  return {
    headline: "Benchmark context unavailable",
    positionStatement:
      reason ??
      "Benchmark context is not available for this case at this time.",
    deviations: [],
    upgradeSignal: null,
    n: 0,
    disclaimer: BENCHMARK_CAPABILITY.disclaimer,
    available: false,
  };
}

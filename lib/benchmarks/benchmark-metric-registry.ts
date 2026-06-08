/**
 * lib/benchmarks/benchmark-metric-registry.ts
 *
 * Per-product benchmark metric definitions.
 *
 * Maps each product surface to the metrics it can contribute to and
 * the benchmark dimensions those metrics align with.
 *
 * Rules:
 * - Metrics are stable string identifiers — never display strings.
 * - Each metric specifies which BenchmarkDimension it maps to.
 * - Each metric specifies the access tier required to display benchmark output.
 * - Metrics that are free (assessment_type, role) must have accessTier = "free".
 * - Metrics that are professional-gated must have accessTier = "professional".
 * - No metric may produce benchmark output below its minimumCohortSize.
 * - This file does not compute — it defines. Computation is in benchmark-engine.ts.
 *
 * Product surfaces:
 *   fast_diagnostic  — Fast Diagnostic (free)
 *   team_assessment  — Team Assessment (professional)
 *   decision_centre  — Decision Centre (free/professional)
 *   executive_report — Executive Reporting (paid)
 *   return_brief     — Return Brief (professional)
 */

import type { BenchmarkDimension, BenchmarkAccessTier } from "./benchmark-context-authority";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductSurface =
  | "fast_diagnostic"
  | "team_assessment"
  | "decision_centre"
  | "executive_report"
  | "return_brief";

export type BenchmarkMetricSpec = {
  /** Stable metric identifier — matches field name in benchmark facts */
  metricKey: string;
  /** Human-readable label */
  label: string;
  /** Brief description of what this metric measures */
  description: string;
  /** Which benchmark dimension this metric feeds */
  dimension: BenchmarkDimension;
  /** Minimum access tier required to see benchmark output for this metric */
  accessTier: BenchmarkAccessTier;
  /** Score range minimum (inclusive) */
  scoreMin: number;
  /** Score range maximum (inclusive) */
  scoreMax: number;
  /** Unit label shown alongside the score, e.g. "/100" or "%" */
  unit: string;
  /** Whether higher is better (used to orient output phrasing) */
  higherIsBetter: boolean;
};

export type ProductBenchmarkProfile = {
  surface: ProductSurface;
  displayName: string;
  /** The assessmentKind value this surface writes to the benchmark pool */
  assessmentKind: string;
  /** Metrics available on this surface */
  metrics: BenchmarkMetricSpec[];
  /** Free-tier metrics (subset of metrics — accessTier = "free") */
  freeMetrics: string[];
  /** Professional-tier metrics (subset of metrics — accessTier = "professional") */
  professionalMetrics: string[];
};

// ─── Metric definitions ───────────────────────────────────────────────────────

/** Shared sovereign-layer metrics (used by Fast Diagnostic and Decision Centre) */
const SOVEREIGN_METRICS: BenchmarkMetricSpec[] = [
  {
    metricKey: "authorityClarity",
    label: "Authority clarity",
    description: "How clearly decision authority and mandate are defined.",
    dimension: "assessment_type",
    accessTier: "free",
    scoreMin: 0,
    scoreMax: 100,
    unit: "/100",
    higherIsBetter: true,
  },
  {
    metricKey: "narrativeCoherence",
    label: "Narrative coherence",
    description: "How coherent the decision narrative is across stakeholders.",
    dimension: "assessment_type",
    accessTier: "free",
    scoreMin: 0,
    scoreMax: 100,
    unit: "/100",
    higherIsBetter: true,
  },
  {
    metricKey: "interventionReadiness",
    label: "Intervention readiness",
    description: "Readiness to act on the identified decision path.",
    dimension: "assessment_type",
    accessTier: "free",
    scoreMin: 0,
    scoreMax: 100,
    unit: "/100",
    higherIsBetter: true,
  },
  {
    metricKey: "executionReadiness",
    label: "Execution readiness",
    description: "Structural readiness for governed decision execution.",
    dimension: "assessment_type",
    accessTier: "free",
    scoreMin: 0,
    scoreMax: 100,
    unit: "/100",
    higherIsBetter: true,
  },
];

/** Role-comparison variants — same metrics but dimension = "role" (free) */
const SOVEREIGN_ROLE_METRICS: BenchmarkMetricSpec[] = SOVEREIGN_METRICS.map((m) => ({
  ...m,
  dimension: "role" as BenchmarkDimension,
}));

/** Org-profile metrics — professional tier */
const ORG_METRICS: BenchmarkMetricSpec[] = [
  {
    metricKey: "escalationFrequency",
    label: "Escalation frequency",
    description: "How often decisions in this profile escalate to senior authority.",
    dimension: "organisation",
    accessTier: "professional",
    scoreMin: 0,
    scoreMax: 100,
    unit: "%",
    higherIsBetter: false,
  },
  {
    metricKey: "outcomeRate",
    label: "Improvement / resolution rate",
    description: "Proportion of cases with improved or resolved outcome at contribution.",
    dimension: "organisation",
    accessTier: "professional",
    scoreMin: 0,
    scoreMax: 100,
    unit: "%",
    higherIsBetter: true,
  },
];

// ─── Product profiles ─────────────────────────────────────────────────────────

const FAST_DIAGNOSTIC_PROFILE: ProductBenchmarkProfile = {
  surface: "fast_diagnostic",
  displayName: "Fast Diagnostic",
  assessmentKind: "FAST_DIAGNOSTIC",
  metrics: [
    ...SOVEREIGN_METRICS,
    ...SOVEREIGN_ROLE_METRICS.map((m) => ({ ...m, metricKey: `${m.metricKey}_role` })),
  ],
  freeMetrics: SOVEREIGN_METRICS.map((m) => m.metricKey),
  professionalMetrics: [],
};

const TEAM_ASSESSMENT_PROFILE: ProductBenchmarkProfile = {
  surface: "team_assessment",
  displayName: "Team Assessment",
  assessmentKind: "TEAM_ASSESSMENT",
  metrics: [
    {
      metricKey: "teamDivergenceScore",
      label: "Team divergence",
      description: "How far the team diverges from the stated decision position.",
      dimension: "team_alignment",
      accessTier: "professional",
      scoreMin: 0,
      scoreMax: 100,
      unit: "/100",
      higherIsBetter: false,
    },
    {
      metricKey: "alignmentResolutionRate",
      label: "Alignment resolution rate",
      description: "Rate at which alignment gaps resolved within the engagement window.",
      dimension: "team_alignment",
      accessTier: "professional",
      scoreMin: 0,
      scoreMax: 100,
      unit: "%",
      higherIsBetter: true,
    },
    ...SOVEREIGN_METRICS.map((m) => ({
      ...m,
      dimension: "assessment_type" as BenchmarkDimension,
    })),
  ],
  freeMetrics: [],
  professionalMetrics: ["teamDivergenceScore", "alignmentResolutionRate"],
};

const DECISION_CENTRE_PROFILE: ProductBenchmarkProfile = {
  surface: "decision_centre",
  displayName: "Decision Centre",
  assessmentKind: "GOVERNED_CASE",
  metrics: [
    ...SOVEREIGN_METRICS,
    ...ORG_METRICS,
    {
      metricKey: "caseEscalationLevel",
      label: "Case escalation level",
      description: "Whether this case has reached the escalation threshold relative to the cohort.",
      dimension: "professional_case",
      accessTier: "professional",
      scoreMin: 0,
      scoreMax: 3,
      unit: "/3",
      higherIsBetter: false,
    },
  ],
  freeMetrics: SOVEREIGN_METRICS.map((m) => m.metricKey),
  professionalMetrics: [
    ...ORG_METRICS.map((m) => m.metricKey),
    "caseEscalationLevel",
  ],
};

const EXECUTIVE_REPORT_PROFILE: ProductBenchmarkProfile = {
  surface: "executive_report",
  displayName: "Executive Reporting",
  assessmentKind: "EXECUTIVE_REPORT",
  metrics: [
    ...SOVEREIGN_METRICS,
    ...ORG_METRICS,
    {
      metricKey: "boardReadinessScore",
      label: "Board readiness",
      description: "Structural readiness of the case narrative for board-level review.",
      dimension: "professional_case",
      accessTier: "professional",
      scoreMin: 0,
      scoreMax: 100,
      unit: "/100",
      higherIsBetter: true,
    },
  ],
  freeMetrics: SOVEREIGN_METRICS.map((m) => m.metricKey),
  professionalMetrics: [
    ...ORG_METRICS.map((m) => m.metricKey),
    "boardReadinessScore",
  ],
};

const RETURN_BRIEF_PROFILE: ProductBenchmarkProfile = {
  surface: "return_brief",
  displayName: "Return Brief",
  assessmentKind: "RETURN_BRIEF",
  metrics: [
    {
      metricKey: "outcomeMovement",
      label: "Outcome movement",
      description: "Direction of outcome change between the original case and the return brief.",
      dimension: "professional_case",
      accessTier: "professional",
      scoreMin: -100,
      scoreMax: 100,
      unit: "pts",
      higherIsBetter: true,
    },
    {
      metricKey: "reEngagementLag",
      label: "Re-engagement lag",
      description: "Days between case close and return brief generation, relative to cohort median.",
      dimension: "professional_case",
      accessTier: "professional",
      scoreMin: 0,
      scoreMax: 365,
      unit: "days",
      higherIsBetter: false,
    },
    {
      metricKey: "continuityScore",
      label: "Continuity score",
      description: "How well the return brief preserves case continuity from the original record.",
      dimension: "professional_case",
      accessTier: "professional",
      scoreMin: 0,
      scoreMax: 100,
      unit: "/100",
      higherIsBetter: true,
    },
  ],
  freeMetrics: [],
  professionalMetrics: ["outcomeMovement", "reEngagementLag", "continuityScore"],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const BENCHMARK_METRIC_REGISTRY: Record<ProductSurface, ProductBenchmarkProfile> = {
  fast_diagnostic:  FAST_DIAGNOSTIC_PROFILE,
  team_assessment:  TEAM_ASSESSMENT_PROFILE,
  decision_centre:  DECISION_CENTRE_PROFILE,
  executive_report: EXECUTIVE_REPORT_PROFILE,
  return_brief:     RETURN_BRIEF_PROFILE,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns all metrics for a product surface at or below a given access tier. */
export function getMetricsForTier(
  surface: ProductSurface,
  tier: BenchmarkAccessTier,
): BenchmarkMetricSpec[] {
  const tierOrder: BenchmarkAccessTier[] = ["free", "professional", "retainer", "gmi", "internal"];
  const tierIndex = tierOrder.indexOf(tier);
  const profile = BENCHMARK_METRIC_REGISTRY[surface];
  return profile.metrics.filter((m) => tierOrder.indexOf(m.accessTier) <= tierIndex);
}

/** Returns the metric spec for a given surface and metricKey, or null if not found. */
export function getMetricSpec(
  surface: ProductSurface,
  metricKey: string,
): BenchmarkMetricSpec | null {
  const profile = BENCHMARK_METRIC_REGISTRY[surface];
  return profile.metrics.find((m) => m.metricKey === metricKey) ?? null;
}

/** Returns all free (no-paywall) metrics for a surface. */
export function getFreeMetrics(surface: ProductSurface): BenchmarkMetricSpec[] {
  return getMetricsForTier(surface, "free");
}

/** Returns the assessmentKind for a product surface. */
export function getAssessmentKind(surface: ProductSurface): string {
  return BENCHMARK_METRIC_REGISTRY[surface].assessmentKind;
}

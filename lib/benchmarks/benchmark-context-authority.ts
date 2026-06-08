/**
 * lib/benchmarks/benchmark-context-authority.ts
 *
 * Benchmark Context Authority — governed capability registry.
 *
 * Unifies all benchmark-related estate knowledge under a single governed capability.
 * Defines what Benchmark Context is, what it can compare, what rules govern it,
 * and what access tiers are required for each comparison dimension.
 *
 * Sources integrated:
 *   - lib/benchmarks/benchmark-engine.ts       — computation + threshold enforcement
 *   - lib/product/benchmark-context-aggregate.ts — SQL aggregate → BenchmarkContext
 *   - lib/claims/claim-governor.ts             — claim safety thresholds
 *   - lib/product/outcome-contribution-contract.ts — BENCHMARK_MIN_N = 50
 *
 * Rules:
 *   - Only anonymized facts — no caseId, email, actorId ever in benchmark output
 *   - Minimum cohort threshold enforced before any benchmark claim
 *   - No benchmark claim below BENCHMARK_MIN_N (50 contributions)
 *   - No public benchmark claim without stated sample size
 *   - No "advanced benchmark" claim without explicit cohort definition
 *   - Every comparison must state what it is comparing against
 *   - Basic tier: free_public (aggregate outcome rates only)
 *   - Advanced tier: professional_gated (multi-dimension comparison)
 */

import { BENCHMARK_MIN_N } from "@/lib/product/outcome-contribution-contract";
import { CLAIM_THRESHOLDS } from "@/lib/claims/claim-governor";

// ─── Comparison dimensions ────────────────────────────────────────────────────

export type BenchmarkDimension =
  | "role"                    // Decision-maker role (leader, operator, advisor)
  | "organisation"            // Organisation type/size band
  | "industry"                // Industry sector
  | "sector"                  // Sub-sector or vertical
  | "maturity"                // Governance maturity stage
  | "assessment_type"         // Type of governed assessment (fast, team, executive, etc.)
  | "team_alignment"          // Team alignment divergence score
  | "enterprise_readiness"    // Enterprise decision-readiness level
  | "gmi_consensus"           // GMI quarterly call consensus comparison
  | "professional_case"       // Professional governed-case outcome comparison
  | "retainer_portfolio";     // Retainer portfolio-level comparison

export type BenchmarkAccessTier =
  | "free"          // Available to all users; aggregate rates only
  | "professional"  // Requires Professional subscription
  | "retainer"      // Requires Retainer engagement
  | "gmi"           // Requires GMI report access
  | "internal";     // Admin/operator only; never shown publicly

export type BenchmarkDimensionSpec = {
  dimension: BenchmarkDimension;
  label: string;
  description: string;
  accessTier: BenchmarkAccessTier;
  /** Whether this dimension produces anonymized output */
  anonymizedOutput: boolean;
  /** Minimum cohort size (n) before this dimension's output is available */
  minimumCohortSize: number;
  /** Whether comparing against this dimension requires stating sample size in output */
  requiresSampleSizeDisclosure: boolean;
  /** What the comparison measures */
  compares: string;
  /** What the output looks like when below threshold */
  belowThresholdBehaviour: "hide" | "show_building" | "show_insufficient";
};

// ─── Dimension registry ───────────────────────────────────────────────────────

export const BENCHMARK_DIMENSIONS: Record<BenchmarkDimension, BenchmarkDimensionSpec> = {
  role: {
    dimension: "role",
    label: "Role comparison",
    description: "How this decision position compares to similar decision-maker roles.",
    accessTier: "free",
    anonymizedOutput: true,
    minimumCohortSize: BENCHMARK_MIN_N,
    requiresSampleSizeDisclosure: true,
    compares: "Decision outcomes and time-to-act across opted-in cases with similar decision-maker roles.",
    belowThresholdBehaviour: "show_building",
  },
  organisation: {
    dimension: "organisation",
    label: "Organisation comparison",
    description: "How this decision position compares to similar organisation types and sizes.",
    accessTier: "professional",
    anonymizedOutput: true,
    minimumCohortSize: BENCHMARK_MIN_N,
    requiresSampleSizeDisclosure: true,
    compares: "Outcome rates and escalation frequency across opted-in cases with similar organisation profiles.",
    belowThresholdBehaviour: "show_building",
  },
  industry: {
    dimension: "industry",
    label: "Industry comparison",
    description: "How this decision position compares across the same industry.",
    accessTier: "professional",
    anonymizedOutput: true,
    minimumCohortSize: BENCHMARK_MIN_N,
    requiresSampleSizeDisclosure: true,
    compares: "Decision trajectory and outcome distribution across opted-in cases in the same industry.",
    belowThresholdBehaviour: "show_building",
  },
  sector: {
    dimension: "sector",
    label: "Sector comparison",
    description: "How this decision position compares within the same sector or vertical.",
    accessTier: "professional",
    anonymizedOutput: true,
    minimumCohortSize: BENCHMARK_MIN_N,
    requiresSampleSizeDisclosure: true,
    compares: "Sector-level outcome patterns across opted-in governed cases.",
    belowThresholdBehaviour: "show_building",
  },
  maturity: {
    dimension: "maturity",
    label: "Governance maturity comparison",
    description: "How this decision position reflects governance maturity relative to the cohort.",
    accessTier: "professional",
    anonymizedOutput: true,
    minimumCohortSize: BENCHMARK_MIN_N,
    requiresSampleSizeDisclosure: true,
    compares: "Governance maturity stage distribution and escalation thresholds across opted-in cases.",
    belowThresholdBehaviour: "show_building",
  },
  assessment_type: {
    dimension: "assessment_type",
    label: "Assessment type comparison",
    description: "How outcomes compare across the same type of governed assessment.",
    accessTier: "free",
    anonymizedOutput: true,
    minimumCohortSize: BENCHMARK_MIN_N,
    requiresSampleSizeDisclosure: true,
    compares: "Outcome rates and time-to-act across opted-in cases of the same assessment kind.",
    belowThresholdBehaviour: "show_building",
  },
  team_alignment: {
    dimension: "team_alignment",
    label: "Team alignment comparison",
    description: "How team divergence scores compare to the cohort.",
    accessTier: "professional",
    anonymizedOutput: true,
    minimumCohortSize: BENCHMARK_MIN_N,
    requiresSampleSizeDisclosure: true,
    compares: "Team alignment divergence scores and resolution rates across opted-in team assessments.",
    belowThresholdBehaviour: "show_building",
  },
  enterprise_readiness: {
    dimension: "enterprise_readiness",
    label: "Enterprise decision-readiness comparison",
    description: "How enterprise decision-readiness compares across similar organisational scans.",
    accessTier: "retainer",
    anonymizedOutput: true,
    minimumCohortSize: BENCHMARK_MIN_N,
    requiresSampleSizeDisclosure: true,
    compares: "Enterprise readiness scores, authority gaps, and dependency exposure across opted-in enterprise assessments.",
    belowThresholdBehaviour: "show_building",
  },
  gmi_consensus: {
    dimension: "gmi_consensus",
    label: "GMI call consensus comparison",
    description: "How prior-call accuracy compares across GMI quarterly editions.",
    accessTier: "gmi",
    anonymizedOutput: true,
    minimumCohortSize: 1,
    requiresSampleSizeDisclosure: false,
    compares: "Prior-call consensus rates and falsification records across GMI quarterly editions.",
    belowThresholdBehaviour: "hide",
  },
  professional_case: {
    dimension: "professional_case",
    label: "Professional governed-case comparison",
    description: "How this governed case compares to Professional-tier cases in the benchmark pool.",
    accessTier: "professional",
    anonymizedOutput: true,
    minimumCohortSize: BENCHMARK_MIN_N,
    requiresSampleSizeDisclosure: true,
    compares: "Outcome rates, escalation patterns, and continuity metrics across opted-in Professional-tier governed cases.",
    belowThresholdBehaviour: "show_building",
  },
  retainer_portfolio: {
    dimension: "retainer_portfolio",
    label: "Retainer portfolio comparison",
    description: "How portfolio-level patterns compare across retainer engagements.",
    accessTier: "retainer",
    anonymizedOutput: true,
    minimumCohortSize: BENCHMARK_MIN_N,
    requiresSampleSizeDisclosure: true,
    compares: "Portfolio-level outcome distributions and governance patterns across opted-in retainer engagements.",
    belowThresholdBehaviour: "show_building",
  },
};

// ─── Capability metadata ──────────────────────────────────────────────────────

export type BenchmarkCapabilitySpec = {
  canonicalRoute: string;
  minimumPoolSize: number;
  claimThreshold: number;
  allowsPublicClaimsBeforeThreshold: false;
  requiresAnonymization: true;
  requiresSampleSizeDisclosure: true;
  freeDimensions: BenchmarkDimension[];
  professionalDimensions: BenchmarkDimension[];
  retainerDimensions: BenchmarkDimension[];
  gmiDimensions: BenchmarkDimension[];
  internalDimensions: BenchmarkDimension[];
  disclaimer: string;
};

export const BENCHMARK_CAPABILITY: BenchmarkCapabilitySpec = {
  canonicalRoute: "/benchmark-context",
  minimumPoolSize: BENCHMARK_MIN_N,
  claimThreshold: CLAIM_THRESHOLDS.benchmarkSampleSize,
  allowsPublicClaimsBeforeThreshold: false,
  requiresAnonymization: true,
  requiresSampleSizeDisclosure: true,
  freeDimensions: ["role", "assessment_type"],
  professionalDimensions: ["organisation", "industry", "sector", "maturity", "team_alignment", "professional_case"],
  retainerDimensions: ["enterprise_readiness", "retainer_portfolio"],
  gmiDimensions: ["gmi_consensus"],
  internalDimensions: [],
  disclaimer:
    "All benchmark comparisons use anonymized, opted-in governed case data. " +
    "No individual case, user, or organisation is identifiable in benchmark output. " +
    "Outcomes are self-reported at the time of contribution. " +
    "The system does not independently verify outcomes. " +
    "Benchmark results are not a guarantee of results.",
};

// ─── Guards ───────────────────────────────────────────────────────────────────

/** Returns true only if a dimension is permitted to publish output at the given sample size. */
export function isBenchmarkDimensionAvailable(
  dimension: BenchmarkDimension,
  sampleSize: number,
): boolean {
  const spec = BENCHMARK_DIMENSIONS[dimension];
  return sampleSize >= spec.minimumCohortSize;
}

/** Returns all dimensions available at a given access tier and sample size. */
export function getAvailableDimensions(
  tier: BenchmarkAccessTier,
  sampleSize: number,
): BenchmarkDimensionSpec[] {
  const tierOrder: BenchmarkAccessTier[] = ["free", "professional", "retainer", "gmi", "internal"];
  const tierIndex = tierOrder.indexOf(tier);

  return Object.values(BENCHMARK_DIMENSIONS).filter((spec) => {
    const specTierIndex = tierOrder.indexOf(spec.accessTier);
    return specTierIndex <= tierIndex && isBenchmarkDimensionAvailable(spec.dimension, sampleSize);
  });
}

/** Builds a benchmark-context disclaimer including sample size. */
export function buildBenchmarkDisclaimer(sampleSize: number): string {
  return `${BENCHMARK_CAPABILITY.disclaimer} Sample size: ${sampleSize} governed cases.`;
}

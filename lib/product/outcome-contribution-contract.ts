/**
 * lib/product/outcome-contribution-contract.ts
 *
 * Contract for opt-in anonymised outcome contribution.
 *
 * Rules:
 * - Contribution is always opt-in. Never automatic.
 * - Contributions are anonymised before any aggregate use.
 *   No caseId, journeyKey, email, or organisation is carried into
 *   the aggregate pool. Only the outcome shape and confidence band.
 * - Benchmark data is not shown until n ≥ 50 contributions exist
 *   for the relevant cohort. Smaller pools return NO_DATA.
 * - All benchmark UI must label source and n.
 * - Contributions can be retracted at any time (data rights).
 * - "Outcome" means the state of the condition after the user acted.
 *   It is self-reported. The system does not independently verify.
 */

// ─── Contribution types ───────────────────────────────────────────────────────

export type OutcomeContributionState =
  | "IMPROVED"     // The condition improved after the governed move
  | "RESOLVED"     // The condition was fully resolved
  | "UNCHANGED"    // No change observed
  | "WORSENED"     // The condition worsened
  | "ABANDONED";   // The user abandoned the governance process

export type OutcomeContributionTimeToActBand =
  | "IMMEDIATE"    // Acted within 1 week
  | "SHORT"        // 1–4 weeks
  | "MEDIUM"       // 1–3 months
  | "LONG"         // 3+ months
  | "DID_NOT_ACT"; // Did not act

export type OutcomeContributionRequest = {
  caseId: string;
  /** User-reported outcome of the governed condition */
  outcomeState: OutcomeContributionState;
  /** How quickly the user acted on the governed recommendation */
  timeToAct: OutcomeContributionTimeToActBand;
  /** Was the system finding accurate? */
  findingAccurate: boolean | null;
  /** Was the recommendation useful? */
  recommendationUseful: boolean | null;
  /** Optional free-text (not stored, used only for session validation) */
  note?: string;
};

export type OutcomeContributionResponse = {
  ok: true;
  contributionId: string;
  message: string;
  canRetract: boolean;
  retractBefore: string; // ISO date — contributions can be retracted within 30 days
};

// ─── Anonymised contribution (aggregate pool entry) ───────────────────────────

/**
 * The shape stored in the aggregate pool after PII stripping.
 * No caseId, email, organisation, or journeyKey is retained.
 */
export type AnonymisedOutcomeContribution = {
  contributionId: string;
  /** Band of the original assessment (e.g. "ALERT", "WATCH", "CRITICAL") */
  assessmentBand: string | null;
  /** Which assessment kind produced this case */
  assessmentKind: string | null;
  outcomeState: OutcomeContributionState;
  timeToAct: OutcomeContributionTimeToActBand;
  findingAccurate: boolean | null;
  recommendationUseful: boolean | null;
  contributedAt: string;
  /** Whether the user has retracted this contribution */
  retracted: boolean;
};

// ─── Benchmark context ────────────────────────────────────────────────────────

export const BENCHMARK_MIN_N = 50;

export type BenchmarkAvailability =
  | "AVAILABLE"    // n ≥ BENCHMARK_MIN_N
  | "BUILDING"     // n < BENCHMARK_MIN_N — pool is building, no data shown
  | "NO_DATA";     // No contributions at all for this cohort

export type BenchmarkContext = {
  availability: BenchmarkAvailability;
  /** Total n for this cohort. Shown to user for transparency. */
  n: number;
  /** Percentage of cases that improved or resolved */
  improvementRate: number | null;
  /** Percentage of cases where finding was rated accurate */
  findingAccuracyRate: number | null;
  /** Percentage of cases where recommendation was rated useful */
  recommendationUsefulRate: number | null;
  /** Most common time-to-act band */
  mostCommonTimeToAct: OutcomeContributionTimeToActBand | null;
  /** Mandatory source label — always shown with data */
  sourceLabel: string;
  /** Mandatory disclaimer — always shown with data */
  disclaimer: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function buildEmptyBenchmarkContext(
  availability: BenchmarkAvailability,
  n: number,
): BenchmarkContext {
  return {
    availability,
    n,
    improvementRate: null,
    findingAccuracyRate: null,
    recommendationUsefulRate: null,
    mostCommonTimeToAct: null,
    sourceLabel: `Based on ${n} governed case${n === 1 ? "" : "s"} with opted-in outcome contributions.`,
    disclaimer:
      "Outcomes are self-reported by users at the time of contribution. The system does not independently verify. Not a guarantee of results.",
  };
}

export function computeBenchmarkContext(
  contributions: AnonymisedOutcomeContribution[],
): BenchmarkContext {
  const active = contributions.filter((c) => !c.retracted);
  const n = active.length;

  if (n === 0) {
    return buildEmptyBenchmarkContext("NO_DATA", 0);
  }

  if (n < BENCHMARK_MIN_N) {
    return buildEmptyBenchmarkContext("BUILDING", n);
  }

  const improved = active.filter(
    (c) => c.outcomeState === "IMPROVED" || c.outcomeState === "RESOLVED",
  ).length;

  const accurateAnswered = active.filter((c) => c.findingAccurate !== null);
  const accurate = accurateAnswered.filter((c) => c.findingAccurate === true).length;

  const usefulAnswered = active.filter((c) => c.recommendationUseful !== null);
  const useful = usefulAnswered.filter((c) => c.recommendationUseful === true).length;

  // Most common time-to-act band
  const bandCounts = new Map<OutcomeContributionTimeToActBand, number>();
  for (const c of active) {
    bandCounts.set(c.timeToAct, (bandCounts.get(c.timeToAct) ?? 0) + 1);
  }
  let mostCommonTimeToAct: OutcomeContributionTimeToActBand | null = null;
  let maxCount = 0;
  for (const [band, count] of bandCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonTimeToAct = band;
    }
  }

  return {
    availability: "AVAILABLE",
    n,
    improvementRate: Math.round((improved / n) * 100),
    findingAccuracyRate:
      accurateAnswered.length > 0
        ? Math.round((accurate / accurateAnswered.length) * 100)
        : null,
    recommendationUsefulRate:
      usefulAnswered.length > 0
        ? Math.round((useful / usefulAnswered.length) * 100)
        : null,
    mostCommonTimeToAct,
    sourceLabel: `Based on ${n} governed case${n === 1 ? "" : "s"} with opted-in outcome contributions.`,
    disclaimer:
      "Outcomes are self-reported by users at the time of contribution. The system does not independently verify. Not a guarantee of results.",
  };
}

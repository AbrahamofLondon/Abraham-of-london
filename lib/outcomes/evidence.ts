import {
  classifyOutcome,
  normalizeOutcomeSnapshot,
  type OutcomeClassification,
  type OutcomeSnapshot,
} from "./outcome-model";
import { recordOutcomeFeedback } from "./feedback-loop";

export type OutcomeEvidenceSummary = {
  title: "Observed Outcomes (System Evidence)";
  processedDecisionCases: number;
  comparableCaseCount: number;
  improvedPercent: number;
  averageTimeToImprovementDays: number | null;
  failureRateWhenIgnored: number;
  medianResolutionWindowDays: number | null;
  confidence: "insufficient" | "directional" | "governed";
  statements: string[];
};

const recordedOutcomes: OutcomeSnapshot[] = [];

function roundTo(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  const left = sorted[mid - 1] ?? 0;
  const right = sorted[mid] ?? 0;
  return roundTo((left + right) / 2);
}

function percent(count: number, total: number): number {
  if (!total) return 0;
  return roundTo((count / total) * 100);
}

function isPositiveOutcome(outcome: OutcomeClassification): boolean {
  return outcome === "resolved" || outcome === "improved";
}

export function recordOutcomeSnapshot(snapshot: OutcomeSnapshot): OutcomeSnapshot {
  const normalized = normalizeOutcomeSnapshot(snapshot);
  recordedOutcomes.push(normalized);
  recordOutcomeFeedback(normalized);
  return normalized;
}

export function getRecordedOutcomeSnapshots(): OutcomeSnapshot[] {
  return [...recordedOutcomes];
}

export function resetOutcomeEvidenceForTests(): void {
  recordedOutcomes.length = 0;
}

export function buildObservedOutcomeEvidence(
  outcomes: OutcomeSnapshot[] = recordedOutcomes,
): OutcomeEvidenceSummary {
  const valid = outcomes
    .map((snapshot) => normalizeOutcomeSnapshot(snapshot))
    .filter((snapshot) => classifyOutcome(snapshot) !== "invalid");

  const positive = valid.filter((snapshot) =>
    isPositiveOutcome(snapshot.outcomeClassification),
  );
  const deteriorated = valid.filter(
    (snapshot) => snapshot.outcomeClassification === "deteriorated",
  );
  const resolved = valid.filter(
    (snapshot) => snapshot.outcomeClassification === "resolved",
  );

  const averageTimeToImprovementDays = positive.length
    ? roundTo(
        positive.reduce((sum, snapshot) => sum + snapshot.timeToOutcomeDays, 0) /
          positive.length,
      )
    : null;

  const medianResolutionWindowDays = median(
    resolved.map((snapshot) => snapshot.timeToOutcomeDays),
  );

  const improvedPercent = percent(positive.length, valid.length);
  const failureRateWhenIgnored = percent(deteriorated.length, valid.length);

  const confidence =
    valid.length >= 30 ? "governed" : valid.length >= 5 ? "directional" : "insufficient";

  const statements =
    valid.length > 0
      ? [
          `${improvedPercent}% improved within the observed follow-up window when intervention was applied.`,
          `${failureRateWhenIgnored}% deteriorated under comparable recorded conditions.`,
          medianResolutionWindowDays == null
            ? "Median resolution window is not yet established."
            : `Median resolution window: ${medianResolutionWindowDays} days.`,
        ]
      : [
          "Observed outcome evidence has not reached a usable sample.",
          "Comparable improvement rate is unavailable until follow-up records are captured.",
          "Failure rate when ignored is unavailable until deterioration outcomes are captured.",
        ];

  return {
    title: "Observed Outcomes (System Evidence)",
    processedDecisionCases: valid.length,
    comparableCaseCount: valid.length,
    improvedPercent,
    averageTimeToImprovementDays,
    failureRateWhenIgnored,
    medianResolutionWindowDays,
    confidence,
    statements,
  };
}

import type { MarketCallRecord } from "./market-intelligence-call-ledger";

export type GmiRubricScore = 0 | 1 | 2 | 3 | 4 | 5;

export type GmiCallScoringRubricItem = {
  score: GmiRubricScore;
  label: string;
  definition: string;
};

export type GmiMethodologyRecord = {
  methodologyVersion: string;
  rubricVersion: string;
  effectiveFrom: string;
  title: string;
  principle: string;
  legalBoundary: string;
  changeLog: Array<{
    version: string;
    effectiveFrom: string;
    note: string;
  }>;
};

export const GMI_CALL_SCORING_RUBRIC: readonly GmiCallScoringRubricItem[] = [
  {
    score: 5,
    label: "Confirmed strongly",
    definition:
      "Evidence directly validates the call within the review window.",
  },
  {
    score: 4,
    label: "Directionally confirmed",
    definition:
      "Core direction correct; magnitude or timing imprecise.",
  },
  {
    score: 3,
    label: "Partially confirmed",
    definition:
      "One component confirmed; others mixed or pending.",
  },
  {
    score: 2,
    label: "Too early to assess",
    definition:
      "Insufficient evidence; carry forward with justification.",
  },
  {
    score: 1,
    label: "Weakly supported",
    definition:
      "Evidence does not yet validate the call.",
  },
  {
    score: 0,
    label: "Disconfirmed",
    definition:
      "Evidence contradicts the call.",
  },
] as const;

export const GMI_METHODOLOGY: GmiMethodologyRecord = {
  methodologyVersion: "GMI-METHOD-1.0.0",
  rubricVersion: "GMI-RUBRIC-1.0.0",
  effectiveFrom: "2026-06-06",
  title: "Global Market Intelligence Methodology",
  principle:
    "Global Market Intelligence registers calls, reviews them, scores the evidence, states falsification thresholds, and converts uncertainty into operator decisions.",
  legalBoundary:
    "Global Market Intelligence is decision-support intelligence. It is not investment advice, does not provide buy, sell, or hold recommendations, and does not provide price targets.",
  changeLog: [
    {
      version: "GMI-METHOD-1.0.0",
      effectiveFrom: "2026-06-06",
      note:
        "Initial locked methodology: call scoring rubric, evidence posture rules, release blockers, and public ledger discipline.",
    },
  ],
};

export function getGmiRubricItem(
  score: GmiRubricScore,
): GmiCallScoringRubricItem {
  const item = GMI_CALL_SCORING_RUBRIC.find((entry) => entry.score === score);
  if (!item) throw new Error(`Unknown GMI rubric score: ${score}`);
  return item;
}

export function getGmiRubricLabel(score: GmiRubricScore): string {
  return getGmiRubricItem(score).label;
}

export function hasOutcomeEvidenceOrTooEarlyJustification(
  call: Pick<MarketCallRecord, "score" | "evidenceSources" | "outcomeSummary">,
): boolean {
  if (call.score === null || call.score === undefined) return true;

  const evidenceCount = call.evidenceSources?.filter(Boolean).length ?? 0;
  const hasSummary = Boolean(call.outcomeSummary?.trim());

  if (call.score === 2) {
    return hasSummary;
  }

  return evidenceCount > 0 && hasSummary;
}


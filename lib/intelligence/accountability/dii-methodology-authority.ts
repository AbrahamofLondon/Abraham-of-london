/**
 * lib/intelligence/accountability/dii-methodology-authority.ts
 *
 * §5 — Canonical DII Methodology Authority.
 *
 * One versioned methodology authority for the Market Decision Integrity Index.
 * No magic weights embedded anonymously in calculation code.
 * Every component weight has documented rationale.
 * Every outcome state has explicit treatment.
 */
export type DiiMethodologyVersion = "1.0.0";

export type OutcomeTreatment = "full_credit" | "partial_credit" | "no_credit" | "penalise" | "exclude_from_accuracy" | "exclude_from_scoring";

export interface ComponentDefinition {
  measure: string;
  weight: number;
  weightRationale: string;
  minSample: number;
}

export interface OutcomeTreatmentRule {
  status: string;
  accuracyScore: number | null;
  accuracyTreatment: OutcomeTreatment;
  calibrationTreatment: OutcomeTreatment;
  notes: string;
}

export interface CoverageRule {
  minScoredForHeadline: number;
  minScoredForComponent: number;
  insufficientLabel: string;
  moderateLabel: string;
  sufficientLabel: string;
}

export interface DiiMethodologyRecord {
  methodologyVersion: DiiMethodologyVersion;
  effectiveFrom: string;
  components: ComponentDefinition[];
  outcomeTreatments: OutcomeTreatmentRule[];
  coverage: CoverageRule;
  unresolvedCallTreatment: string;
  partiallyCorrectTreatment: string;
  notConfirmedTreatment: string;
  disconfirmedTreatment: string;
  revisionTreatment: string;
  falsificationTreatment: string;
  editionEligibilityRule: string;
  changeHistory: Array<{ version: string; date: string; change: string }>;
}

export const DII_METHODOLOGY: DiiMethodologyRecord = {
  methodologyVersion: "1.0.0",
  effectiveFrom: "2026-07-07",
  components: [
    {
      measure: "call_accuracy",
      weight: 0.35,
      weightRationale: "Primary signal of judgement quality. Measures whether the organisation's calls correctly anticipated outcomes. Highest weight because accuracy is the most direct evidence of market understanding.",
      minSample: 3,
    },
    {
      measure: "falsification_discipline",
      weight: 0.25,
      weightRationale: "Willingness to track and learn from errors. Measures carry-forward justification rate, learning documentation, and version history discipline. High weight because willingness to publish and learn from misses is a differentiating moat.",
      minSample: 3,
    },
    {
      measure: "calibration_quality",
      weight: 0.25,
      weightRationale: "Whether confidence levels match outcomes. High-confidence calls should have higher outcome scores than low-confidence calls. Penalises overconfidence (high confidence + poor outcome) and underconfidence (low confidence + good outcome).",
      minSample: 3,
    },
    {
      measure: "revision_discipline",
      weight: 0.15,
      weightRationale: "Rigour of maintaining version history. Measures revision rate and average revisions per call. Lower weight because revision discipline supports credibility but is not a direct accuracy signal.",
      minSample: 3,
    },
  ],
  outcomeTreatments: [
    { status: "CONFIRMED_STRONGLY", accuracyScore: 100, accuracyTreatment: "full_credit", calibrationTreatment: "full_credit", notes: "Call was correct and evidence strongly supports the outcome." },
    { status: "DIRECTIONALLY_CONFIRMED", accuracyScore: 75, accuracyTreatment: "partial_credit", calibrationTreatment: "partial_credit", notes: "Call was directionally correct but magnitude or timing differed." },
    { status: "PARTIALLY_CONFIRMED", accuracyScore: 50, accuracyTreatment: "partial_credit", calibrationTreatment: "partial_credit", notes: "Call was partially correct; some elements confirmed, others not." },
    { status: "WEAKLY_SUPPORTED", accuracyScore: 25, accuracyTreatment: "partial_credit", calibrationTreatment: "partial_credit", notes: "Weak evidence supports the call but insufficient for strong confirmation." },
    { status: "NOT_CONFIRMED", accuracyScore: 0, accuracyTreatment: "no_credit", calibrationTreatment: "penalise", notes: "Call was not confirmed by evidence. Epistemic uncertainty: the call may still be valid but evidence is insufficient." },
    { status: "DISCONFIRMED", accuracyScore: 0, accuracyTreatment: "penalise", calibrationTreatment: "penalise", notes: "Call was demonstrably wrong. Opposite outcome occurred or evidence contradicts the call. Treated more severely than NOT_CONFIRMED." },
    { status: "TOO_EARLY_TO_ASSESS", accuracyScore: null, accuracyTreatment: "exclude_from_accuracy", calibrationTreatment: "exclude_from_scoring", notes: "Insufficient time has passed to assess the call. Excluded from accuracy scoring but counts toward coverage." },
    { status: "PENDING_REVIEW", accuracyScore: null, accuracyTreatment: "exclude_from_scoring", calibrationTreatment: "exclude_from_scoring", notes: "Call has not yet been reviewed. Excluded from all scoring." },
  ],
  coverage: {
    minScoredForHeadline: 5,
    minScoredForComponent: 3,
    insufficientLabel: "INSUFFICIENT_COVERAGE",
    moderateLabel: "PRELIMINARY",
    sufficientLabel: "PUBLISHABLE",
  },
  unresolvedCallTreatment: "Calls with PENDING_REVIEW or TOO_EARLY_TO_ASSESS status are excluded from accuracy scoring but count toward coverage totals. A ledger with only unresolved calls produces INSUFFICIENT_COVERAGE.",
  partiallyCorrectTreatment: "PARTIALLY_CONFIRMED and WEAKLY_SUPPORTED receive partial credit (50% and 25% respectively). These contribute to the accuracy score proportionally.",
  notConfirmedTreatment: "NOT_CONFIRMED receives 0 accuracy score and penalises calibration (the confidence was misplaced). Distinguished from DISCONFIRMED which is treated more severely.",
  disconfirmedTreatment: "DISCONFIRMED receives 0 accuracy score and penalises calibration. Additionally flagged as a falsification event. Distinguished from NOT_CONFIRMED because the call was demonstrably wrong rather than merely unsupported.",
  revisionTreatment: "Revision discipline is measured separately from accuracy. A call with multiple revisions may have high revision discipline (good) even if the original call was wrong.",
  falsificationTreatment: "Falsification events are tracked in the falsification register and the Decision Learning Log. They affect the falsification_discipline component score but do not retroactively change accuracy scores.",
  editionEligibilityRule: "An edition is eligible for DII scoring if it has at least 5 scored calls (CONFIRMED_STRONGLY through DISCONFIRMED). Editions with fewer than 5 scored calls produce NULL headline score with INSUFFICIENT_COVERAGE status.",
  changeHistory: [
    { version: "1.0.0", date: "2026-07-07", change: "Initial DII methodology. Four components: call_accuracy (0.35), falsification_discipline (0.25), calibration_quality (0.25), revision_discipline (0.15). Eight outcome treatments with explicit scoring rules." },
  ],
};

export function getMethodologyVersion(): DiiMethodologyVersion {
  return DII_METHODOLOGY.methodologyVersion;
}

export function getComponentWeight(measure: string): number | null {
  return DII_METHODOLOGY.components.find(c => c.measure === measure)?.weight ?? null;
}

export function getOutcomeTreatment(status: string): OutcomeTreatmentRule | null {
  return DII_METHODOLOGY.outcomeTreatments.find(t => t.status === status) ?? null;
}

export function getCoverageStatus(scoredCalls: number): "INSUFFICIENT_COVERAGE" | "PRELIMINARY" | "PUBLISHABLE" {
  if (scoredCalls >= DII_METHODOLOGY.coverage.minScoredForHeadline) return "PUBLISHABLE";
  if (scoredCalls >= DII_METHODOLOGY.coverage.minScoredForComponent) return "PRELIMINARY";
  return "INSUFFICIENT_COVERAGE";
}

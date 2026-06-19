import {
  getDeliverySurfaceTemplate,
  type DeliverySurfaceContract,
  type DeliveryTruthSurface,
} from "@/lib/intelligence/delivery-surface-contract";
import { getCorridorRecord } from "@/lib/product/paid-corridor-contract";
import { getConsequenceRecord } from "@/lib/product/product-consequence-standard";

export type JudgementConfidence = "LOW" | "MEDIUM" | "HIGH";
export type JudgementGenericityResult = "passed" | "failed" | "not_run";

export interface EvidenceModeTruthPolicy {
  mode: "single_respondent" | "multi_respondent";
  maxJudgementScore: number;
  maxConfidence: JudgementConfidence;
  blockedClaims: string[];
  sourceRefs: string[];
}

export interface JudgementTruthTemplate {
  surface: DeliveryTruthSurface;
  displayName: string;
  judgementCeiling: number;
  outputArtifact: string;
  gateCondition: string;
  mustNotClaim: string[];
  evidenceModePolicies: EvidenceModeTruthPolicy[];
  sourceRefs: string[];
}

export interface JudgementTruthContract {
  judgementId: string;
  runId: string;
  productId: string;
  isCaseDerived: boolean;
  evidenceAnchoredClaims: number;
  unsupportedClaims: number;
  changesWithEvidence: boolean | "not_tested";
  survivesContradiction: boolean | "not_tested";
  justifiesNextAction: boolean;
  namesRejectedAlternatives: boolean;
  falsificationQuestionsPresent: boolean;
  genericityResult: JudgementGenericityResult;
  judgementScore: 0 | 1 | 2 | 3 | 4 | 5;
  blockerReasons: string[];
}

export type JudgementTruthContractInput = Omit<
  JudgementTruthContract,
  "judgementScore" | "blockerReasons"
>;

export interface JudgementVsDeliveryTruth {
  surface: DeliveryTruthSurface;
  displayName: string;
  judgementCeiling: number;
  deliveryCeiling: number;
  effectiveCeiling: number;
  mustNotClaim: string[];
  sourceRefs: string[];
}

export interface JudgementVsDeliveryEvaluation {
  surface: DeliveryTruthSurface;
  proposedJudgementScore: number;
  allowedReleaseScore: number;
  effectiveCeiling: number;
  releaseCeilingReasons: string[];
  violationReasons: string[];
}

export interface JudgementDeliveryReadiness {
  eligibleForIntelligenceProof: boolean;
  blockers: string[];
  effectiveJudgementScore: number;
  deliverySurfaceScore: number;
}

export const TEAM_ASSESSMENT_SINGLE_RESPONDENT_POLICY: EvidenceModeTruthPolicy = {
  mode: "single_respondent",
  maxJudgementScore: 4,
  maxConfidence: "MEDIUM",
  blockedClaims: [
    "cross-respondent divergence",
    "team-wide contradiction",
    "high-confidence multi-respondent judgement",
  ],
  sourceRefs: [
    "docs/product/diagnostic-engine-architecture.md",
    "lib/product/product-consequence-standard.ts",
  ],
};

function clampFivePointScore(value: number): 0 | 1 | 2 | 3 | 4 | 5 {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return rounded as 0 | 1 | 2 | 3 | 4 | 5;
}

function clampTenPointScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

function buildJudgementTruthTemplate(
  surface: DeliveryTruthSurface,
): JudgementTruthTemplate {
  const consequence = getConsequenceRecord(surface);
  const corridor = getCorridorRecord(surface);

  if (!consequence) {
    throw new Error(`Missing consequence record for "${surface}".`);
  }
  if (!corridor) {
    throw new Error(`Missing paid corridor record for "${surface}".`);
  }

  const evidenceModePolicies: EvidenceModeTruthPolicy[] = [];
  if (surface === "team_assessment") {
    evidenceModePolicies.push(
      TEAM_ASSESSMENT_SINGLE_RESPONDENT_POLICY,
      {
        mode: "multi_respondent",
        maxJudgementScore: consequence.maturityScore,
        maxConfidence: "HIGH",
        blockedClaims: [],
        sourceRefs: [
          "docs/paid-corridor-authority-map.md",
          "lib/product/product-consequence-standard.ts",
        ],
      },
    );
  }

  return {
    surface,
    displayName: consequence.displayName,
    judgementCeiling: consequence.maturityScore,
    outputArtifact: consequence.outputArtifact,
    gateCondition: consequence.gateCondition,
    mustNotClaim: corridor.mustNotShow,
    evidenceModePolicies,
    sourceRefs: [
      "lib/product/product-consequence-standard.ts",
      "lib/product/paid-corridor-contract.ts",
    ],
  };
}

function buildBaseJudgementScore(
  input: JudgementTruthContractInput,
): 0 | 1 | 2 | 3 | 4 | 5 {
  let score = 0;

  if (input.isCaseDerived) score += 1;
  if (input.evidenceAnchoredClaims > 0) score += 1;
  if (input.evidenceAnchoredClaims > input.unsupportedClaims) score += 1;
  if (input.changesWithEvidence === true) score += 1;
  if (input.survivesContradiction === true) score += 1;
  if (input.justifiesNextAction) score += 1;
  if (input.namesRejectedAlternatives) score += 1;
  if (input.falsificationQuestionsPresent) score += 1;
  if (input.genericityResult === "passed") score += 1;

  return clampFivePointScore(score / 2);
}

function buildJudgementBlockers(
  input: JudgementTruthContractInput,
  cappedScore: number,
): string[] {
  const blockers: string[] = [];

  if (!input.isCaseDerived) {
    blockers.push("Judgement is not case-derived.");
  }

  if (input.evidenceAnchoredClaims === 0) {
    blockers.push("Judgement contains no evidence-anchored claims.");
  }

  if (input.unsupportedClaims > 0) {
    blockers.push(
      `${input.unsupportedClaims} unsupported claim(s) remain in the judgement output.`,
    );
  }

  if (input.unsupportedClaims > input.evidenceAnchoredClaims) {
    blockers.push(
      "Unsupported claims exceed evidence-anchored claims, so judgement cannot clear a strong truth score.",
    );
  }

  if (input.changesWithEvidence === "not_tested") {
    blockers.push("Judgement has not been tested for evidence sensitivity.");
  }

  if (input.survivesContradiction === "not_tested") {
    blockers.push("Judgement has not been tested against contradiction.");
  }

  if (input.survivesContradiction === false) {
    blockers.push("Judgement does not survive contradiction.");
  }

  if (!input.justifiesNextAction) {
    blockers.push("Judgement does not justify the next admissible move.");
  }

  if (!input.namesRejectedAlternatives) {
    blockers.push("Judgement does not name rejected alternatives.");
  }

  if (!input.falsificationQuestionsPresent) {
    blockers.push("Judgement does not contain falsification questions.");
  }

  if (input.genericityResult === "failed") {
    blockers.push("Judgement failed genericity testing and cannot be intelligence-proven.");
  }

  if (cappedScore < 4) {
    blockers.push("Judgement score is below the proof threshold.");
  }

  return blockers;
}

function applyJudgementScoreCeilings(
  input: JudgementTruthContractInput,
  baseScore: 0 | 1 | 2 | 3 | 4 | 5,
): 0 | 1 | 2 | 3 | 4 | 5 {
  let cappedScore = baseScore;

  if (!input.isCaseDerived) {
    cappedScore = Math.min(cappedScore, 2) as 0 | 1 | 2;
  }

  if (input.survivesContradiction === false) {
    cappedScore = Math.min(cappedScore, 3) as 0 | 1 | 2 | 3;
  }

  if (!input.justifiesNextAction) {
    cappedScore = Math.min(cappedScore, 3) as 0 | 1 | 2 | 3;
  }

  if (input.unsupportedClaims > input.evidenceAnchoredClaims) {
    cappedScore = Math.min(cappedScore, 2) as 0 | 1 | 2;
  }

  return cappedScore;
}

export const JUDGEMENT_TRUTH_TEMPLATES: JudgementTruthTemplate[] = ([
  "team_assessment",
  "enterprise_assessment",
  "executive_reporting",
  "boardroom_mode",
  "strategy_room",
] as const).map((surface) => buildJudgementTruthTemplate(surface));

export function getJudgementTruthTemplate(
  surface: DeliveryTruthSurface,
): JudgementTruthTemplate | undefined {
  return JUDGEMENT_TRUTH_TEMPLATES.find((template) => template.surface === surface);
}

export function createJudgementTruthContract(
  input: JudgementTruthContractInput,
): JudgementTruthContract {
  const baseScore = buildBaseJudgementScore(input);
  const judgementScore: 0 | 1 | 2 | 3 | 4 | 5 = applyJudgementScoreCeilings(
    input,
    baseScore,
  );

  return {
    ...input,
    judgementScore,
    blockerReasons: buildJudgementBlockers(input, judgementScore),
  };
}

export function getJudgementVsDeliveryTruth(
  surface: DeliveryTruthSurface,
): JudgementVsDeliveryTruth | undefined {
  const judgement = getJudgementTruthTemplate(surface);
  const delivery = getDeliverySurfaceTemplate(surface);

  if (!judgement || !delivery) {
    return undefined;
  }

  return {
    surface,
    displayName: judgement.displayName,
    judgementCeiling: judgement.judgementCeiling,
    deliveryCeiling: delivery.deliveryCeiling,
    effectiveCeiling: Math.min(judgement.judgementCeiling, delivery.deliveryCeiling),
    mustNotClaim: [...judgement.mustNotClaim],
    sourceRefs: [...new Set([...judgement.sourceRefs, ...delivery.sourceRefs])],
  };
}

export function evaluateJudgementAgainstDelivery(input: {
  surface: DeliveryTruthSurface;
  proposedJudgementScore: number;
  respondentCount?: number;
  confidence?: JudgementConfidence;
  claimsCrossRespondentDivergence?: boolean;
}): JudgementVsDeliveryEvaluation {
  const truth = getJudgementVsDeliveryTruth(input.surface);
  const template = getJudgementTruthTemplate(input.surface);

  if (!truth || !template) {
    throw new Error(`Missing truth contract for "${input.surface}".`);
  }

  let effectiveCeiling = truth.effectiveCeiling;
  const releaseCeilingReasons: string[] = [];
  const violationReasons: string[] = [];

  if (input.surface === "team_assessment") {
    const respondentCount = input.respondentCount ?? 0;
    const singleRespondentPolicy = template.evidenceModePolicies.find(
      (policy) => policy.mode === "single_respondent",
    );

    if (respondentCount < 2 && singleRespondentPolicy) {
      effectiveCeiling = Math.min(
        effectiveCeiling,
        singleRespondentPolicy.maxJudgementScore,
      );

      if (input.confidence === "HIGH") {
        violationReasons.push(
          "Single-respondent Team Assessment may not claim HIGH confidence.",
        );
      }

      if (input.claimsCrossRespondentDivergence) {
        violationReasons.push(
          "Single-respondent Team Assessment may not claim cross-respondent divergence.",
        );
      }
    }
  }

  const proposedJudgementScore = clampTenPointScore(input.proposedJudgementScore);

  if (proposedJudgementScore > effectiveCeiling) {
    releaseCeilingReasons.push(
      `Proposed judgement score ${proposedJudgementScore} exceeds the release ceiling of ${effectiveCeiling}.`,
    );
  }

  return {
    surface: input.surface,
    proposedJudgementScore,
    allowedReleaseScore: Math.min(proposedJudgementScore, effectiveCeiling),
    effectiveCeiling,
    releaseCeilingReasons,
    violationReasons,
  };
}

export function evaluateJudgementDeliveryReadiness(input: {
  judgement: JudgementTruthContract;
  delivery: DeliverySurfaceContract;
}): JudgementDeliveryReadiness {
  const blockers = [...input.judgement.blockerReasons];

  if (input.judgement.productId !== input.delivery.productId) {
    blockers.push("Judgement and delivery artifacts do not belong to the same product.");
  }

  if (input.judgement.judgementScore < 4) {
    blockers.push("Delivery polish cannot compensate for a weak judgement score.");
  }

  if (input.delivery.deliverySurfaceScore < 4) {
    blockers.push("Delivery surface score is below the board/executive threshold.");
  }

  if (!input.delivery.hasConfidenceDisclosure) {
    blockers.push("Delivery surface does not disclose confidence.");
  }

  return {
    eligibleForIntelligenceProof: blockers.length === 0,
    blockers,
    effectiveJudgementScore: input.judgement.judgementScore,
    deliverySurfaceScore: input.delivery.deliverySurfaceScore,
  };
}

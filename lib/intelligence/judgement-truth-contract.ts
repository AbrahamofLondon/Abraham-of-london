import {
  getDeliverySurfaceContract,
  type DeliveryTruthSurface,
} from "@/lib/intelligence/delivery-surface-contract";
import { getCorridorRecord } from "@/lib/product/paid-corridor-contract";
import { getConsequenceRecord } from "@/lib/product/product-consequence-standard";

export type JudgementConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface EvidenceModeTruthPolicy {
  mode: "single_respondent" | "multi_respondent";
  maxJudgementScore: number;
  maxConfidence: JudgementConfidence;
  blockedClaims: string[];
  sourceRefs: string[];
}

export interface JudgementTruthContract {
  surface: DeliveryTruthSurface;
  displayName: string;
  judgementCeiling: number;
  outputArtifact: string;
  gateCondition: string;
  mustNotClaim: string[];
  evidenceModePolicies: EvidenceModeTruthPolicy[];
  sourceRefs: string[];
}

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

function buildJudgementTruthContract(surface: DeliveryTruthSurface): JudgementTruthContract {
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

export const JUDGEMENT_TRUTH_CONTRACTS: JudgementTruthContract[] = ([
  "team_assessment",
  "enterprise_assessment",
  "executive_reporting",
  "boardroom_mode",
  "strategy_room",
] as const).map(
  (surface: DeliveryTruthSurface) =>
    buildJudgementTruthContract(surface),
);

export function getJudgementTruthContract(
  surface: DeliveryTruthSurface,
): JudgementTruthContract | undefined {
  return JUDGEMENT_TRUTH_CONTRACTS.find((contract) => contract.surface === surface);
}

export function getJudgementVsDeliveryTruth(
  surface: DeliveryTruthSurface,
): JudgementVsDeliveryTruth | undefined {
  const judgement = getJudgementTruthContract(surface);
  const delivery = getDeliverySurfaceContract(surface);

  if (!judgement || !delivery) return undefined;

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

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

export function evaluateJudgementAgainstDelivery(input: {
  surface: DeliveryTruthSurface;
  proposedJudgementScore: number;
  respondentCount?: number;
  confidence?: JudgementConfidence;
  claimsCrossRespondentDivergence?: boolean;
}): JudgementVsDeliveryEvaluation {
  const truth = getJudgementVsDeliveryTruth(input.surface);
  const contract = getJudgementTruthContract(input.surface);

  if (!truth || !contract) {
    throw new Error(`Missing truth contract for "${input.surface}".`);
  }

  let effectiveCeiling = truth.effectiveCeiling;
  const releaseCeilingReasons: string[] = [];
  const violationReasons: string[] = [];

  if (input.surface === "team_assessment") {
    const respondentCount = input.respondentCount ?? 0;
    const singleRespondentPolicy = contract.evidenceModePolicies.find(
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

  const proposedJudgementScore = clampScore(input.proposedJudgementScore);
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

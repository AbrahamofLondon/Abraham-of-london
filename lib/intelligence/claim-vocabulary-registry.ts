import type { ProductIntelligenceClass } from "@/lib/intelligence/product-intelligence-classification";

export type TruthClaimClass =
  | "DESCRIPTIVE"
  | "EVIDENCE"
  | "VALIDATION"
  | "PROVENANCE"
  | "OUTCOME";

export type TruthClaimSurface =
  | "PUBLIC_PRODUCT_COPY"
  | "PUBLIC_PROOF_COPY"
  | "PUBLIC_SAMPLE_COPY"
  | "INTERNAL_REVIEW";

export type TruthClaimRunState =
  | "MISSING"
  | "CAPTURED"
  | "WEAK_EVIDENCE_SAFE"
  | "VERIFIED";

export type TruthClaimHarnessState =
  | "MISSING"
  | "NOT_RUN"
  | "FAILING"
  | "PASSING"
  | "WEAK_EVIDENCE_SAFE";

export type TruthClaimProvenanceState =
  | "MISSING"
  | "PRESENT"
  | "VERIFIED"
  | "EXPIRED";

export type TruthClaimOutcomeState =
  | "MISSING"
  | "NOT_DUE"
  | "COMPLETED"
  | "POSITIVE"
  | "NEGATIVE"
  | "INSUFFICIENT";

export type TruthClaimEvidenceState =
  | "verified"
  | "source_backed"
  | "proxy_backed"
  | "insufficient"
  | "missing"
  | "blocked"
  | "not_applicable";

export type ControlledClaimId =
  | "intelligent"
  | "diagnostic"
  | "judgement_led"
  | "board_grade"
  | "decision_ready"
  | "action_ready"
  | "evidence_backed"
  | "validated"
  | "red_team_tested"
  | "anti_toy_tested"
  | "market_compared"
  | "generic_ai_compared"
  | "provenance_verified"
  | "outcome_informed";

export interface ControlledClaimRequirements {
  productClasses?: readonly ProductIntelligenceClass[];
  evidenceStates?: readonly TruthClaimEvidenceState[];
  runStates?: readonly TruthClaimRunState[];
  harnessStates?: readonly TruthClaimHarnessState[];
  provenanceStates?: readonly TruthClaimProvenanceState[];
  outcomeStates?: readonly TruthClaimOutcomeState[];
  requirePublicClaimAllowed?: boolean;
  minimumJudgementScore?: number;
  minimumDeliveryScore?: number;
  requireRejectedAlternatives?: boolean;
  requireWeakEvidenceHandling?: boolean;
  requireBenchmarkRecord?: boolean;
}

export interface ControlledClaimDefinition {
  id: ControlledClaimId;
  label: string;
  claimClass: TruthClaimClass;
  description: string;
  patterns: readonly RegExp[];
  requirements: ControlledClaimRequirements;
  allowedPublicWording: readonly string[];
  forbiddenPublicWording: readonly string[];
}

export interface SuspiciousTruthClaimWarning {
  label: string;
  patterns: readonly RegExp[];
  note: string;
}

export const TRUTH_CLAIM_CLASS_ORDER: Record<TruthClaimClass, number> = {
  DESCRIPTIVE: 0,
  EVIDENCE: 1,
  VALIDATION: 2,
  PROVENANCE: 3,
  OUTCOME: 4,
};

export const DEFAULT_SURFACE_CLASS_CEILINGS: Record<TruthClaimSurface, TruthClaimClass> = {
  PUBLIC_PRODUCT_COPY: "VALIDATION",
  PUBLIC_PROOF_COPY: "PROVENANCE",
  PUBLIC_SAMPLE_COPY: "OUTCOME",
  INTERNAL_REVIEW: "OUTCOME",
};

const SOURCE_BACKED_EVIDENCE_STATES: readonly TruthClaimEvidenceState[] = [
  "verified",
  "source_backed",
];

const ORIGINATOR_ONLY: readonly ProductIntelligenceClass[] = ["originator"];

export const CONTROLLED_TRUTH_CLAIMS: readonly ControlledClaimDefinition[] = [
  {
    id: "intelligent",
    label: "Intelligent claim",
    claimClass: "DESCRIPTIVE",
    description:
      "Intelligent language is reserved for originator products with source-backed evidence, verified runs, passing harnesses, and a strong judgement score.",
    patterns: [/\bintelligent\b/i, /\bAI-powered intelligence\b/i],
    requirements: {
      productClasses: ORIGINATOR_ONLY,
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      runStates: ["VERIFIED"],
      harnessStates: ["PASSING"],
      requirePublicClaimAllowed: true,
      minimumJudgementScore: 4,
    },
    allowedPublicWording: ["intelligent"],
    forbiddenPublicWording: ["smart", "AI-powered intelligence"],
  },
  {
    id: "diagnostic",
    label: "Diagnostic claim",
    claimClass: "DESCRIPTIVE",
    description:
      "Diagnostic language is controlled when used as a capability claim rather than a product title or route label.",
    patterns: [
      /\bdiagnostic product\b/i,
      /\bdiagnostic intelligence\b/i,
      /\bdiagnostic capability\b/i,
    ],
    requirements: {
      productClasses: ORIGINATOR_ONLY,
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      runStates: ["CAPTURED", "WEAK_EVIDENCE_SAFE", "VERIFIED"],
      harnessStates: ["PASSING", "WEAK_EVIDENCE_SAFE"],
      requirePublicClaimAllowed: true,
      requireWeakEvidenceHandling: true,
    },
    allowedPublicWording: ["diagnostic"],
    forbiddenPublicWording: ["diagnostic product", "diagnostic intelligence"],
  },
  {
    id: "judgement_led",
    label: "Judgement-led claim",
    claimClass: "DESCRIPTIVE",
    description:
      "Judgement-led language requires a strong case-derived judgement and explicit rejected alternatives.",
    patterns: [/\bjudg(?:e)?ment[-\s]led\b/i],
    requirements: {
      productClasses: ORIGINATOR_ONLY,
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      runStates: ["VERIFIED"],
      harnessStates: ["PASSING"],
      requirePublicClaimAllowed: true,
      minimumJudgementScore: 4,
      requireRejectedAlternatives: true,
    },
    allowedPublicWording: ["judgement-led"],
    forbiddenPublicWording: ["judgement led"],
  },
  {
    id: "board_grade",
    label: "Board-grade claim",
    claimClass: "VALIDATION",
    description:
      "Board-grade language requires strong judgement, strong delivery, and a provenance-capable surface.",
    patterns: [/\bboard[-\s]grade\b/i, /\bdecision[-\s]grade\b/i, /\bexecutive[-\s]grade\b/i],
    requirements: {
      productClasses: ORIGINATOR_ONLY,
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      runStates: ["VERIFIED"],
      harnessStates: ["PASSING"],
      provenanceStates: ["PRESENT", "VERIFIED"],
      requirePublicClaimAllowed: true,
      minimumJudgementScore: 4,
      minimumDeliveryScore: 4,
    },
    allowedPublicWording: ["board-grade"],
    forbiddenPublicWording: ["board-ready", "decision-grade", "executive-grade"],
  },
  {
    id: "decision_ready",
    label: "Decision-ready claim",
    claimClass: "VALIDATION",
    description:
      "Decision-ready language requires evidence-backed, benchmarked judgement with at least medium-grade run posture.",
    patterns: [/\bdecision[-\s]ready\b/i],
    requirements: {
      productClasses: ORIGINATOR_ONLY,
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      runStates: ["VERIFIED"],
      harnessStates: ["PASSING"],
      requirePublicClaimAllowed: true,
      minimumJudgementScore: 4,
      requireBenchmarkRecord: true,
    },
    allowedPublicWording: ["decision-ready"],
    forbiddenPublicWording: ["decision ready"],
  },
  {
    id: "action_ready",
    label: "Action-ready claim",
    claimClass: "OUTCOME",
    description:
      "Action-ready language requires strong judgement plus completed, non-negative outcome evidence.",
    patterns: [/\baction[-\s]ready\b/i],
    requirements: {
      productClasses: ORIGINATOR_ONLY,
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      runStates: ["VERIFIED"],
      harnessStates: ["PASSING"],
      outcomeStates: ["COMPLETED", "POSITIVE"],
      requirePublicClaimAllowed: true,
      minimumJudgementScore: 4,
      requireBenchmarkRecord: true,
    },
    allowedPublicWording: ["action-ready"],
    forbiddenPublicWording: ["action ready"],
  },
  {
    id: "evidence_backed",
    label: "Evidence-backed claim",
    claimClass: "EVIDENCE",
    description:
      "Evidence-backed language requires source-backed evidence and a captured run posture.",
    patterns: [/\bevidence[-\s]backed\b/i],
    requirements: {
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      runStates: ["CAPTURED", "VERIFIED"],
      requirePublicClaimAllowed: true,
    },
    allowedPublicWording: ["evidence-backed"],
    forbiddenPublicWording: ["evidence backed"],
  },
  {
    id: "validated",
    label: "Validated claim",
    claimClass: "VALIDATION",
    description:
      "Validated language requires passing harness evidence and must not rely on proxy-only posture.",
    patterns: [/\bvalidated\b/i],
    requirements: {
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      harnessStates: ["PASSING"],
      requirePublicClaimAllowed: true,
    },
    allowedPublicWording: ["validated"],
    forbiddenPublicWording: ["fully validated"],
  },
  {
    id: "red_team_tested",
    label: "Red-team-tested claim",
    claimClass: "VALIDATION",
    description:
      "Red-team-tested language requires an explicit red-team run state for the product or its justified family.",
    patterns: [/\bred[-\s]team(?:ed)?[-\s]tested\b/i, /\badversarially tested\b/i],
    requirements: {
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      harnessStates: ["PASSING"],
      requirePublicClaimAllowed: true,
    },
    allowedPublicWording: ["red-team-tested"],
    forbiddenPublicWording: ["adversarially tested"],
  },
  {
    id: "anti_toy_tested",
    label: "Anti-toy-tested claim",
    claimClass: "VALIDATION",
    description:
      "Anti-toy-tested language requires explicit anti-toy validation, not product registry presence or delivery proof.",
    patterns: [/\banti[-\s]toy(?:ed)?[-\s]tested\b/i],
    requirements: {
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      harnessStates: ["PASSING"],
      requirePublicClaimAllowed: true,
    },
    allowedPublicWording: ["anti-toy-tested"],
    forbiddenPublicWording: ["anti toy tested"],
  },
  {
    id: "market_compared",
    label: "Market-compared claim",
    claimClass: "VALIDATION",
    description:
      "Market-compared language requires a product-applicable market comparison record rather than generic market rhetoric.",
    patterns: [/\bmarket[-\s]compared\b/i],
    requirements: {
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      runStates: ["VERIFIED"],
      harnessStates: ["PASSING"],
      requirePublicClaimAllowed: true,
      requireBenchmarkRecord: true,
    },
    allowedPublicWording: ["market-compared"],
    forbiddenPublicWording: ["market compared"],
  },
  {
    id: "generic_ai_compared",
    label: "Generic-AI-compared claim",
    claimClass: "VALIDATION",
    description:
      "Generic-AI-compared language requires a traceable generic-AI baseline record.",
    patterns: [/\bgeneric(?:[-\s]AI)?[-\s]compared\b/i],
    requirements: {
      evidenceStates: SOURCE_BACKED_EVIDENCE_STATES,
      runStates: ["VERIFIED"],
      harnessStates: ["PASSING"],
      requirePublicClaimAllowed: true,
      requireBenchmarkRecord: true,
    },
    allowedPublicWording: ["generic-AI-compared"],
    forbiddenPublicWording: ["generic ai compared"],
  },
  {
    id: "provenance_verified",
    label: "Provenance-verified claim",
    claimClass: "PROVENANCE",
    description:
      "Provenance-verified language requires an actual provenance state, not a general explanation of methodology.",
    patterns: [/\bprovenance[-\s]verified\b/i],
    requirements: {
      provenanceStates: ["VERIFIED"],
      requirePublicClaimAllowed: true,
    },
    allowedPublicWording: ["provenance-verified"],
    forbiddenPublicWording: ["verified provenance"],
  },
  {
    id: "outcome_informed",
    label: "Outcome-informed claim",
    claimClass: "OUTCOME",
    description:
      "Outcome-informed language requires completed follow-up evidence rather than a hypothetical outcome loop.",
    patterns: [/\boutcome[-\s]informed\b/i],
    requirements: {
      outcomeStates: ["COMPLETED", "POSITIVE"],
      requirePublicClaimAllowed: true,
    },
    allowedPublicWording: ["outcome-informed"],
    forbiddenPublicWording: ["outcome informed"],
  },
] as const;

export const SUSPICIOUS_TRUTH_CLAIM_WARNINGS: readonly SuspiciousTruthClaimWarning[] = [
  {
    label: "Smart/AI-powered intelligence wording",
    patterns: [/\bsmart\b/i, /\bAI-powered intelligence\b/i],
    note: "Adjacent intelligence language should remain evidence-governed.",
  },
  {
    label: "Board-ready wording",
    patterns: [/\bboard[-\s]ready\b/i],
    note: "Board-ready language should not outrun board-grade proof requirements.",
  },
  {
    label: "Battle-tested wording",
    patterns: [/\bbattle[-\s]tested\b/i],
    note: "Battle-tested language requires explicit adversarial proof, not stylistic emphasis.",
  },
  {
    label: "Trusted wording",
    patterns: [/\btrusted\b/i],
    note: "Trusted language should be bounded to evidence posture and verification context.",
  },
  {
    label: "Proven wording",
    patterns: [/\bproven\b/i],
    note: "Proven language should not appear without benchmark, provenance, or outcome support.",
  },
  {
    label: "Evidence-led wording",
    patterns: [/\bevidence[-\s]led\b/i],
    note: "Evidence-led language should remain a warning until explicitly cleared by the estate proof stack.",
  },
  {
    label: "Adversarially tested wording",
    patterns: [/\badversarially tested\b/i],
    note: "Adversarial testing claims must be tied to explicit validation records.",
  },
];

const CONTROLLED_TRUTH_CLAIM_MAP = new Map(
  CONTROLLED_TRUTH_CLAIMS.map((claim) => [claim.id, claim] as const),
);

export function getControlledTruthClaim(
  claimId: ControlledClaimId,
): ControlledClaimDefinition | undefined {
  return CONTROLLED_TRUTH_CLAIM_MAP.get(claimId);
}

export function truthClaimClassRank(claimClass: TruthClaimClass): number {
  return TRUTH_CLAIM_CLASS_ORDER[claimClass];
}

export function claimClassExceedsCeiling(
  claimClass: TruthClaimClass,
  ceiling: TruthClaimClass,
): boolean {
  return truthClaimClassRank(claimClass) > truthClaimClassRank(ceiling);
}

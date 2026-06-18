import type { DerivedEvidenceState } from "@/lib/product/derived-evidence-state";
import type { ProductAuthorityState } from "@/lib/product/product-authority-contract";

export type TruthClaimClass =
  | "DESCRIPTIVE"
  | "EXECUTION"
  | "EVIDENCE"
  | "AUTHORITY"
  | "OUTCOME";

export type TruthClaimSurface =
  | "PUBLIC_PRODUCT_COPY"
  | "PUBLIC_PROOF_COPY"
  | "PUBLIC_SAMPLE_COPY"
  | "INTERNAL_REVIEW";

export type TruthClaimRunState = "MISSING" | "DECLARED" | "CAPTURED" | "VERIFIED";

export type TruthClaimHarnessState = "MISSING" | "DECLARED" | "CAPTURED" | "VERIFIED";

export type TruthClaimProvenanceState = "MISSING" | "PENDING" | "AVAILABLE";

export type TruthClaimOutcomeState =
  | "MISSING"
  | "PENDING_REVIEW"
  | "TOO_EARLY_TO_ASSESS"
  | "DIRECTIONALLY_CONFIRMED"
  | "PARTIALLY_CONFIRMED"
  | "WEAKLY_SUPPORTED"
  | "DISCONFIRMED"
  | "CONFIRMED_STRONGLY";

export type TruthClaimEvidenceStatus = DerivedEvidenceState["ledgerStatus"];

export type ControlledClaimId =
  | "diagnostic_product"
  | "judgement_product"
  | "externally_proven"
  | "board_ready"
  | "verified_outcome"
  | "guaranteed_outcome";

export interface ControlledClaimRequirements {
  authorityStates?: readonly ProductAuthorityState[];
  requirePublicClaimAllowed?: boolean;
  evidenceStatuses?: readonly TruthClaimEvidenceStatus[];
  requireLedgerEntry?: boolean;
  requireValidEvidence?: boolean;
  runStates?: readonly TruthClaimRunState[];
  harnessStates?: readonly TruthClaimHarnessState[];
  provenanceStates?: readonly TruthClaimProvenanceState[];
  outcomeStates?: readonly TruthClaimOutcomeState[];
}

export interface ControlledClaimDefinition {
  id: ControlledClaimId;
  label: string;
  claimClass: TruthClaimClass;
  description: string;
  patterns: readonly RegExp[];
  prohibited?: boolean;
  requirements: ControlledClaimRequirements;
}

export const TRUTH_CLAIM_CLASS_ORDER: Record<TruthClaimClass, number> = {
  DESCRIPTIVE: 0,
  EXECUTION: 1,
  EVIDENCE: 2,
  AUTHORITY: 3,
  OUTCOME: 4,
};

export const DEFAULT_SURFACE_CLASS_CEILINGS: Record<TruthClaimSurface, TruthClaimClass> = {
  PUBLIC_PRODUCT_COPY: "AUTHORITY",
  PUBLIC_PROOF_COPY: "OUTCOME",
  PUBLIC_SAMPLE_COPY: "OUTCOME",
  INTERNAL_REVIEW: "OUTCOME",
};

const POSITIVE_PUBLIC_AUTHORITY_STATES: readonly ProductAuthorityState[] = [
  "diagnostic_product",
  "judgement_product",
  "externally_proven_gold_product",
];

const TRUSTED_EVIDENCE_STATUSES: readonly TruthClaimEvidenceStatus[] = [
  "trusted_artifact_supported",
];

export const CONTROLLED_TRUTH_CLAIMS: readonly ControlledClaimDefinition[] = [
  {
    id: "diagnostic_product",
    label: "Diagnostic Product Claim",
    claimClass: "AUTHORITY",
    description:
      "Diagnostic-product language is controlled and must align with an actual product authority state.",
    patterns: [/\bdiagnostic product\b/i],
    requirements: {
      authorityStates: ["diagnostic_product"],
      requirePublicClaimAllowed: true,
      evidenceStatuses: TRUSTED_EVIDENCE_STATUSES,
      requireLedgerEntry: true,
      requireValidEvidence: true,
      runStates: ["CAPTURED", "VERIFIED"],
      harnessStates: ["VERIFIED"],
      provenanceStates: ["AVAILABLE"],
    },
  },
  {
    id: "judgement_product",
    label: "Judgement Product Claim",
    claimClass: "AUTHORITY",
    description:
      "Judgement-product language is controlled and must align with an actual product authority state.",
    patterns: [/\bjudgement product\b/i, /\bjudgment product\b/i],
    requirements: {
      authorityStates: ["judgement_product"],
      requirePublicClaimAllowed: true,
      evidenceStatuses: TRUSTED_EVIDENCE_STATUSES,
      requireLedgerEntry: true,
      requireValidEvidence: true,
      runStates: ["CAPTURED", "VERIFIED"],
      harnessStates: ["VERIFIED"],
      provenanceStates: ["AVAILABLE"],
    },
  },
  {
    id: "externally_proven",
    label: "Externally Proven Claim",
    claimClass: "AUTHORITY",
    description:
      "Externally-proven language requires the highest public authority state plus trusted evidence, verified execution, provenance, and a confirmed outcome state.",
    patterns: [/\bexternally proven\b/i, /\bmarket-proven\b/i],
    requirements: {
      authorityStates: ["externally_proven_gold_product"],
      requirePublicClaimAllowed: true,
      evidenceStatuses: TRUSTED_EVIDENCE_STATUSES,
      requireLedgerEntry: true,
      requireValidEvidence: true,
      runStates: ["VERIFIED"],
      harnessStates: ["VERIFIED"],
      provenanceStates: ["AVAILABLE"],
      outcomeStates: ["CONFIRMED_STRONGLY"],
    },
  },
  {
    id: "board_ready",
    label: "Board-Ready Claim",
    claimClass: "EXECUTION",
    description:
      "Board-ready language requires a positive authority state plus trusted run, harness, and provenance support.",
    patterns: [
      /\bboard-ready\b/i,
      /\bboard approved\b/i,
      /\binvestment-ready\b/i,
      /\bboard decision dossier\b/i,
      /\bboardroom-readiness proof\b/i,
    ],
    requirements: {
      authorityStates: POSITIVE_PUBLIC_AUTHORITY_STATES,
      requirePublicClaimAllowed: true,
      evidenceStatuses: TRUSTED_EVIDENCE_STATUSES,
      requireLedgerEntry: true,
      requireValidEvidence: true,
      runStates: ["CAPTURED", "VERIFIED"],
      harnessStates: ["VERIFIED"],
      provenanceStates: ["AVAILABLE"],
    },
  },
  {
    id: "verified_outcome",
    label: "Verified Outcome Claim",
    claimClass: "OUTCOME",
    description:
      "Verified-outcome language requires trusted evidence, verified execution, available provenance, and a strongly confirmed outcome state.",
    patterns: [
      /\bverified outcome\b/i,
      /\boutcome verified\b/i,
      /\bproven outcome\b/i,
    ],
    requirements: {
      authorityStates: POSITIVE_PUBLIC_AUTHORITY_STATES,
      requirePublicClaimAllowed: true,
      evidenceStatuses: TRUSTED_EVIDENCE_STATUSES,
      requireLedgerEntry: true,
      requireValidEvidence: true,
      runStates: ["VERIFIED"],
      harnessStates: ["VERIFIED"],
      provenanceStates: ["AVAILABLE"],
      outcomeStates: ["CONFIRMED_STRONGLY"],
    },
  },
  {
    id: "guaranteed_outcome",
    label: "Guaranteed Outcome Claim",
    claimClass: "OUTCOME",
    description:
      "Guaranteed-outcome language is prohibited because it overstates certainty beyond governed evidence posture.",
    patterns: [
      /\bguaranteed outcomes?\b/i,
      /\bguaranteed results?\b/i,
      /\bguaranteed success\b/i,
    ],
    prohibited: true,
    requirements: {},
  },
];

const CONTROLLED_TRUTH_CLAIM_MAP = new Map(
  CONTROLLED_TRUTH_CLAIMS.map((claim) => [claim.id, claim] as const)
);

export function getControlledTruthClaim(
  claimId: ControlledClaimId
): ControlledClaimDefinition | undefined {
  return CONTROLLED_TRUTH_CLAIM_MAP.get(claimId);
}

export function truthClaimClassRank(claimClass: TruthClaimClass): number {
  return TRUTH_CLAIM_CLASS_ORDER[claimClass];
}

export function claimClassExceedsCeiling(
  claimClass: TruthClaimClass,
  ceiling: TruthClaimClass
): boolean {
  return truthClaimClassRank(claimClass) > truthClaimClassRank(ceiling);
}

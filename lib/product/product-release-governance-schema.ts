import { z } from "zod";

import type {
  EvidenceBoundaryVariant,
  ProductReleaseGovernance,
  ProductReleaseLane,
  ProductReleaseMode,
} from "./product-release-governance";

export const ProductReleaseLaneSchema = z.enum([
  "validated_authority_product",
  "eligible_for_restoration_review",
  "evidence_limited_commercial_product",
  "internal_governance_engine",
  "blocked_claim_unsafe_product",
  "insufficient_information_requires_review",
]);

export const ProductReleaseModeSchema = z.enum([
  "public_sellable",
  "manual_fulfilment_only",
  "internal_only",
  "blocked",
  "review_only",
]);

export const EvidenceBoundaryVariantSchema = z.enum([
  "decision_support",
  "advisory_review",
  "board_facing_draft",
  "diagnostic_pending_authority",
  "validated_authority_instrument",
  "none",
]);

export const ProductReleaseGovernanceSchema = z.object({
  productCode: z.string().min(1),
  productName: z.string().min(1),
  releaseLane: ProductReleaseLaneSchema,
  authorityState: z.string().min(1),
  effectiveAuthorityState: z.enum(["granted", "suppressed", "pending", "unknown"]),
  canGrantAuthority: z.boolean(),
  publicClaimAllowed: z.boolean(),
  commercialClaimAllowed: z.boolean(),
  releaseMode: ProductReleaseModeSchema,
  checkoutAllowed: z.boolean(),
  manualFulfilmentAllowed: z.boolean(),
  requiredBoundaryVariant: EvidenceBoundaryVariantSchema,
  boundaryDescription: z.string(),
  forbiddenClaims: z.array(z.string()),
  allowedClaims: z.array(z.string()),
  requiresFulfilmentAuthorityRecording: z.boolean(),
  fulfilmentMustRecordBoundaryAcceptance: z.boolean(),
  manualReviewRequired: z.boolean(),
  revocationConditions: z.array(z.string()),
  evidenceBasis: z.array(z.string()),
  nextAction: z.string(),
  governanceSnapshot: z.string(),
});

export type ProductReleaseGovernanceDto = z.infer<typeof ProductReleaseGovernanceSchema>;

export const EstateDispositionGovernanceRecordSchema = z.object({
  productCode: z.string().min(1),
  productName: z.string().min(1),
  finalDisposition: z.string().optional(),
  releaseLane: z.string().optional(),
  releaseMode: z.string().optional(),
  authorityBoundary: z.string().optional(),
  commercialClaimAllowed: z.boolean().optional(),
  checkoutAllowed: z.boolean().optional(),
  manualFulfilmentAllowed: z.boolean().optional(),
  publicClaimAllowed: z.boolean().optional(),
  evidencePackage: z.string().optional(),
  nextAction: z.string().optional(),
});

export type EstateDispositionGovernanceRecord = z.infer<
  typeof EstateDispositionGovernanceRecordSchema
>;

function mapReleaseLane(record: EstateDispositionGovernanceRecord): ProductReleaseLane {
  if (record.finalDisposition === "RELEASE_READY_NOW" || record.releaseLane === "RELEASE_READY_NOW") {
    return record.checkoutAllowed
      ? "validated_authority_product"
      : "evidence_limited_commercial_product";
  }
  if (
    record.finalDisposition === "CONTROLLED_RELEASE_READY" ||
    record.releaseLane === "CONTROLLED_RELEASE_READY"
  ) {
    return "eligible_for_restoration_review";
  }
  if (record.finalDisposition === "INTERNAL_ONLY_JUSTIFIED") {
    return "internal_governance_engine";
  }
  if (record.finalDisposition === "MERGED_OR_RETIRED" || record.finalDisposition === "UNRESOLVED") {
    return "blocked_claim_unsafe_product";
  }
  return "insufficient_information_requires_review";
}

function mapReleaseMode(record: EstateDispositionGovernanceRecord): ProductReleaseMode {
  if (record.checkoutAllowed) return "public_sellable";
  if (record.manualFulfilmentAllowed) return "manual_fulfilment_only";
  if (record.finalDisposition === "CONTROLLED_RELEASE_READY") return "review_only";
  if (record.finalDisposition === "INTERNAL_ONLY_JUSTIFIED") return "internal_only";
  if (record.finalDisposition === "MERGED_OR_RETIRED" || record.finalDisposition === "UNRESOLVED") return "blocked";
  return "review_only";
}

function mapBoundaryVariant(record: EstateDispositionGovernanceRecord): EvidenceBoundaryVariant {
  if (record.productCode === "gmi_q2_2026") return "validated_authority_instrument";
  if (record.productCode === "enterprise_assessment") return "advisory_review";
  if (record.productCode === "executive_reporting") return "board_facing_draft";
  if (record.releaseMode?.includes("controlled") || record.finalDisposition === "CONTROLLED_RELEASE_READY") {
    return "advisory_review";
  }
  if (record.productCode.includes("diagnostic") || record.productCode.includes("assessment")) {
    return "decision_support";
  }
  return "none";
}

function mapEffectiveAuthorityState(record: EstateDispositionGovernanceRecord): ProductReleaseGovernance["effectiveAuthorityState"] {
  if (record.finalDisposition === "RELEASE_READY_NOW" && record.publicClaimAllowed) return "granted";
  if (record.finalDisposition === "CONTROLLED_RELEASE_READY") return "pending";
  if (record.finalDisposition === "INTERNAL_ONLY_JUSTIFIED") return "suppressed";
  if (record.finalDisposition === "MERGED_OR_RETIRED" || record.finalDisposition === "UNRESOLVED") {
    return "suppressed";
  }
  return "unknown";
}

function defaultForbiddenClaims(record: EstateDispositionGovernanceRecord): string[] {
  return [
    "certified outcome",
    "guaranteed result",
    "independent verification of submitted facts",
    "regulated professional advice",
    ...(record.checkoutAllowed ? [] : ["self-serve checkout eligibility"]),
  ];
}

function defaultAllowedClaims(record: EstateDispositionGovernanceRecord): string[] {
  if (record.productCode === "fast_diagnostic") {
    return [
      "Public decision signal",
      "Structured perception check from user-supplied context",
      "Bounded operational claims",
      "No independent verification of underlying facts",
    ];
  }
  if (record.finalDisposition === "CONTROLLED_RELEASE_READY") {
    return ["Controlled access", "Human review required", "Bounded claim posture"];
  }
  if (record.checkoutAllowed) {
    return ["Current purchasable edition", "Canonical checkout eligible"];
  }
  return ["Governed public surface", "Bounded operational explanation"];
}

export function adaptEstateDispositionToReleaseGovernance(
  input: unknown,
  options: { governanceSnapshot?: string } = {},
): ProductReleaseGovernance {
  const record = EstateDispositionGovernanceRecordSchema.parse(input);
  const governance: ProductReleaseGovernance = {
    productCode: record.productCode,
    productName: record.productName,
    releaseLane: mapReleaseLane(record),
    authorityState: record.finalDisposition ?? record.releaseLane ?? "UNKNOWN",
    effectiveAuthorityState: mapEffectiveAuthorityState(record),
    canGrantAuthority: false,
    publicClaimAllowed: record.publicClaimAllowed ?? false,
    commercialClaimAllowed: record.commercialClaimAllowed ?? false,
    releaseMode: mapReleaseMode(record),
    checkoutAllowed: record.checkoutAllowed ?? false,
    manualFulfilmentAllowed: record.manualFulfilmentAllowed ?? false,
    requiredBoundaryVariant: mapBoundaryVariant(record),
    boundaryDescription:
      record.authorityBoundary ??
      "Public claims are bounded by product release governance and evidence authority.",
    forbiddenClaims: defaultForbiddenClaims(record),
    allowedClaims: defaultAllowedClaims(record),
    requiresFulfilmentAuthorityRecording: Boolean(record.checkoutAllowed || record.manualFulfilmentAllowed),
    fulfilmentMustRecordBoundaryAcceptance: Boolean(record.manualFulfilmentAllowed),
    manualReviewRequired:
      record.finalDisposition === "CONTROLLED_RELEASE_READY" ||
      record.releaseMode?.includes("controlled") === true,
    revocationConditions: ["authority_blocked", "gate_failure"],
    evidenceBasis: [record.evidencePackage].filter((value): value is string => Boolean(value)),
    nextAction: record.nextAction ?? "Follow product release governance before progression.",
    governanceSnapshot: options.governanceSnapshot ?? new Date().toISOString(),
  };

  return ProductReleaseGovernanceSchema.parse(governance);
}
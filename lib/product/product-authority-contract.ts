/**
 * lib/product/product-authority-contract.ts
 *
 * Product Authority Contract
 *
 * Every product must expose its authority state through this contract.
 * Authority is derived from validation evidence, not from manual assertion,
 * hardcoded registry labels, or surface copy.
 *
 * Core Doctrine:
 * No product may claim authority beyond what its evidence supports.
 * Public language must match the authority state.
 * Authority sources must be deterministic and auditable.
 */

export type ProductAuthorityState =
  | "externally_proven_gold_product"
  | "diagnostic_product"
  | "judgement_product"
  | "legacy_validated_pending_v2_revalidation"
  | "blocked_until_claim_evidenced"
  | "blocked_until_v2_revalidation"
  | "measurement_inconclusive"
  | "pending_reconciliation"
  | "static_reference"
  | "internal_only"
  | "authority_contract_missing";

export type EvidenceSourceType =
  | "generated_evidence"
  | "legacy_evidence"
  | "reported_summary_only"
  | "manual_assertion"
  | "registry_label"
  | "surface_claim";

export interface EvidenceSource {
  sourceType: EvidenceSourceType;
  canGrantAuthority: boolean;
  canonicalLocation?: string;
}

export interface ValidationResults {
  evidenceLedgerV2Present: boolean;
  evidenceLedgerHash?: string;
  scenarioSetHash?: string;
  outputHash?: string;
  renderedOutputCaptured: boolean;
  antiToyPassed: boolean;
  redTeamPassed: boolean;
  genericAiComparisonPassed: boolean;
  marketComparisonPassed: boolean;
  releaseFirewallPassed: boolean;
  constitutionPassed: boolean;
  noMockAuthorityPassed: boolean;
  antiGamingPassed: boolean;
  adversarialValidationPassed: boolean;
}

export interface MeasurementBoundary {
  productChangedThisPass: boolean;
  scorerChangedThisPass: boolean;
  scenarioChangedThisPass: boolean;
  benchmarkChangedThisPass: boolean;
  validationInfrastructureChangedThisPass: boolean;
  gateLogicChangedThisPass: boolean;
  mockAuthorityUsed: boolean;
}

export interface ProductAuthorityContract {
  productCode: string;

  // Claims
  targetClaim: string;
  evidenceSupportedClaim: string;
  currentAuthorityState: ProductAuthorityState;

  // Evidence Source
  evidenceSource: EvidenceSource;

  // Validation Results
  validation: ValidationResults;

  // Measurement Boundary
  boundary: MeasurementBoundary;

  // Blocking Information
  blockingReasons: string[];
  nextEvidenceAction: string;

  // Public Surface Rules
  publicClaimAllowed: boolean;
  publicClaimLanguage: string;

  // Metadata
  contractVersion: "v2";
  lastValidatedAt?: string;
  validationHash?: string;
}

/**
 * Determine if a product can make public claims based on authority state
 */
export function canMakePublicClaim(state: ProductAuthorityState): boolean {
  return state === "externally_proven_gold_product" ||
    state === "diagnostic_product" ||
    state === "judgement_product";
}

/**
 * Get appropriate public language for an authority state
 */
export function getPublicClaimLanguage(
  state: ProductAuthorityState,
  productCode: string
): string {
  switch (state) {
    case "externally_proven_gold_product":
      return `${productCode} is externally proven under v2 evidence validation.`;
    case "diagnostic_product":
      return `${productCode} is a diagnostic product under constitutional validation.`;
    case "judgement_product":
      return `${productCode} is a judgement product under constitutional validation.`;
    case "legacy_validated_pending_v2_revalidation":
      return `${productCode} is legacy validated; pending v2 revalidation.`;
    case "blocked_until_claim_evidenced":
      return `${productCode} is under validation; not currently released as an evidenced product.`;
    case "blocked_until_v2_revalidation":
      return `${productCode} requires v2 revalidation before authority can be restored.`;
    case "measurement_inconclusive":
      return `${productCode} validation is inconclusive; authority is not granted.`;
    case "pending_reconciliation":
      return `${productCode} authority is pending reconciliation between contract, ledger, runtime output, and route evidence.`;
    case "static_reference":
      return `${productCode} is a reference implementation for testing purposes only.`;
    case "internal_only":
      return `${productCode} is available for internal use only.`;
    case "authority_contract_missing":
      return `${productCode} does not yet have a direct authority contract.`;
  }
}

/**
 * Validate contract consistency
 */
export function validateContract(
  contract: ProductAuthorityContract
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if authority state matches evidence source
  if (contract.evidenceSource.canGrantAuthority && !canMakePublicClaim(contract.currentAuthorityState)) {
    errors.push(
      `Authority source allows granting authority but current state does not: ${contract.currentAuthorityState}`
    );
  }

  // Check if public claims exceed evidence support
  if (contract.publicClaimAllowed && contract.validation.evidenceLedgerV2Present !== true) {
    errors.push(
      "Public claims not allowed without v2 evidence ledger"
    );
  }

  // Check blocking reasons
  if (contract.blockingReasons.length > 0 && contract.publicClaimAllowed) {
    errors.push(
      "Cannot make public claims while blocking reasons exist"
    );
  }

  // Check measurement boundary
  if (Object.values(contract.boundary).some(v => v === true)) {
    if (
      contract.currentAuthorityState !== "legacy_validated_pending_v2_revalidation" &&
      contract.currentAuthorityState !== "blocked_until_claim_evidenced" &&
      contract.currentAuthorityState !== "blocked_until_v2_revalidation" &&
      contract.currentAuthorityState !== "measurement_inconclusive" &&
      contract.currentAuthorityState !== "pending_reconciliation"
    ) {
      errors.push(
        "Authority state should remain non-granting when measurement boundary is violated"
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

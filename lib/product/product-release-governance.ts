/**
 * Product Release Governance Contract
 *
 * Central governance layer controlling:
 * - Authority state
 * - Commercial lane
 * - Public claim permissions
 * - Evidence boundary requirements
 * - Checkout/manual fulfillment eligibility
 * - Surface exposure control
 * - Admin fulfillment state
 * - Revocation conditions
 *
 * All commercial surfaces must consume this contract.
 * Commerce emerges from governance, not bypasses it.
 */

export type ProductReleaseLane =
  | "validated_authority_product"
  | "eligible_for_restoration_review"
  | "evidence_limited_commercial_product"
  | "internal_governance_engine"
  | "blocked_claim_unsafe_product"
  | "insufficient_information_requires_review";

export type ProductReleaseMode =
  | "public_sellable"
  | "manual_fulfilment_only"
  | "internal_only"
  | "blocked"
  | "review_only";

export type EvidenceBoundaryVariant =
  | "decision_support"
  | "advisory_review"
  | "board_facing_draft"
  | "diagnostic_pending_authority"
  | "validated_authority_instrument"
  | "none";

export interface ProductReleaseGovernance {
  // Product identity
  productCode: string;
  productName: string;

  // Authority classification
  releaseLane: ProductReleaseLane;
  authorityState: string; // from ProductAuthorityContract
  effectiveAuthorityState: "granted" | "suppressed" | "pending" | "unknown";

  // Authority granting control
  canGrantAuthority: boolean;
  publicClaimAllowed: boolean;
  commercialClaimAllowed: boolean;

  // Sales channel control
  releaseMode: ProductReleaseMode;
  checkoutAllowed: boolean;
  manualFulfilmentAllowed: boolean;

  // Evidence boundary requirements
  requiredBoundaryVariant: EvidenceBoundaryVariant;
  boundaryDescription: string;

  // Claim control
  forbiddenClaims: string[];
  allowedClaims: string[];

  // Fulfillment tracking
  requiresFulfilmentAuthorityRecording: boolean;
  fulfilmentMustRecordBoundaryAcceptance: boolean;
  manualReviewRequired: boolean;

  // Revocation conditions (when commerce must stop)
  revocationConditions: string[];

  // Evidence basis
  evidenceBasis: string[];

  // Next action for improvement
  nextAction: string;

  // Timestamp for governance snapshot
  governanceSnapshot: string;
}

/**
 * Release governance matrix for all products
 * Serves as the source of truth for commercial eligibility
 */
export const PRODUCT_RELEASE_GOVERNANCE: Record<
  string,
  ProductReleaseGovernance
> = {};

/**
 * Can a product be commercially released?
 * All conditions must be true.
 */
export function canReleaseCommercially(
  governance: ProductReleaseGovernance
): {
  allowed: boolean;
  reason: string;
} {
  if (!governance.commercialClaimAllowed) {
    return {
      allowed: false,
      reason: "commercialClaimAllowed is false",
    };
  }

  if (governance.releaseLane === "blocked_claim_unsafe_product") {
    return {
      allowed: false,
      reason: "product is in blocked_claim_unsafe_product lane",
    };
  }

  if (governance.releaseLane === "insufficient_information_requires_review") {
    return {
      allowed: false,
      reason: "product lacks contract entry and classification",
    };
  }

  if (governance.releaseMode === "blocked" || governance.releaseMode === "internal_only") {
    return {
      allowed: false,
      reason: `release mode is ${governance.releaseMode}`,
    };
  }

  return {
    allowed: true,
    reason: "all commercial conditions met",
  };
}

/**
 * Can a product use checkout (automated sales)?
 */
export function canUseCheckout(
  governance: ProductReleaseGovernance
): {
  allowed: boolean;
  reason: string;
} {
  const commercial = canReleaseCommercially(governance);
  if (!commercial.allowed) {
    return {
      allowed: false,
      reason: `not commercially releasable: ${commercial.reason}`,
    };
  }

  if (!governance.checkoutAllowed) {
    return {
      allowed: false,
      reason: "checkoutAllowed is false",
    };
  }

  if (governance.releaseMode === "manual_fulfilment_only") {
    return {
      allowed: false,
      reason: "release mode requires manual fulfillment",
    };
  }

  return {
    allowed: true,
    reason: "checkout enabled",
  };
}

/**
 * Can a product use manual fulfillment?
 */
export function canUseManualFulfilment(
  governance: ProductReleaseGovernance
): {
  allowed: boolean;
  reason: string;
} {
  const commercial = canReleaseCommercially(governance);
  if (!commercial.allowed) {
    return {
      allowed: false,
      reason: `not commercially releasable: ${commercial.reason}`,
    };
  }

  if (!governance.manualFulfilmentAllowed) {
    return {
      allowed: false,
      reason: "manualFulfilmentAllowed is false",
    };
  }

  return {
    allowed: true,
    reason: "manual fulfillment enabled",
  };
}

/**
 * Validate that a surface claim is permitted
 */
export function validateSurfaceClaim(
  governance: ProductReleaseGovernance,
  claim: string
): {
  valid: boolean;
  reason: string;
} {
  if (governance.forbiddenClaims.includes(claim)) {
    return {
      valid: false,
      reason: `claim "${claim}" is forbidden for this product`,
    };
  }

  if (
    governance.allowedClaims.length > 0 &&
    !governance.allowedClaims.includes(claim)
  ) {
    return {
      valid: false,
      reason: `claim "${claim}" is not in allowed claims list`,
    };
  }

  if (!governance.publicClaimAllowed && governance.canGrantAuthority === false) {
    // Authority claims are never allowed for products that don't grant authority
    const authorityPatterns = [
      "validated",
      "verified",
      "certified",
      "authority",
      "proven",
      "board",
    ];
    if (
      authorityPatterns.some((pattern) =>
        claim.toLowerCase().includes(pattern)
      )
    ) {
      return {
        valid: false,
        reason: `authority-bearing claim "${claim}" not allowed while canGrantAuthority is false`,
      };
    }
  }

  return {
    valid: true,
    reason: "claim is permitted",
  };
}

/**
 * Get the required evidence boundary for display
 */
export function getRequiredEvidenceBoundary(
  governance: ProductReleaseGovernance
): string {
  switch (governance.requiredBoundaryVariant) {
    case "decision_support":
      return "This is decision-support material, not independently verified authority evidence. It is designed to structure judgment and expose decision risk; it does not grant validated product authority.";

    case "advisory_review":
      return "This is an advisory decision-support review. It is not independently verified authority evidence and should not be treated as a formal audit, certification, or assurance opinion.";

    case "board_facing_draft":
      return "This is board discussion material prepared to support board review. It is not board-approved, board-certified, or investment-grade authority proof.";

    case "diagnostic_pending_authority":
      return "This diagnostic is evidence-reviewed and pending final authority approval. It should be treated as advisory until authority is formally restored.";

    case "validated_authority_instrument":
      return "This is a validated authority instrument. Evidence chain complete. Use per authority specifications.";

    case "none":
      return "";

    default:
      return "Product release governance variant unknown";
  }
}

/**
 * Should this product recording fulfill acknowledgement of boundaries?
 */
export function requiresFulfilmentBoundaryRecording(
  governance: ProductReleaseGovernance
): boolean {
  return (
    governance.requiresFulfilmentAuthorityRecording &&
    governance.fulfilmentMustRecordBoundaryAcceptance
  );
}

/**
 * Is this product eligible for revocation?
 */
export function isRevocationConditionTriggered(
  governance: ProductReleaseGovernance,
  currentAuthorityState: string,
  currentGateStatus: string
): {
  revoked: boolean;
  reasons: string[];
} {
  const triggers: string[] = [];

  // Check if any revocation condition is met
  if (governance.revocationConditions.includes("authority_blocked")) {
    if (currentAuthorityState.includes("blocked")) {
      triggers.push("product authority is now blocked");
    }
  }

  if (governance.revocationConditions.includes("gate_failure")) {
    if (currentGateStatus.includes("FAILED")) {
      triggers.push("blocking gate has failed");
    }
  }

  return {
    revoked: triggers.length > 0,
    reasons: triggers,
  };
}

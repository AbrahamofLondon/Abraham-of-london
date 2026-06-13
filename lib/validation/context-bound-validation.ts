/**
 * lib/validation/context-bound-validation.ts
 *
 * Validation Protocol for Context-Bound Products
 *
 * Some products are architecturally designed as terminal nodes in diagnostic ladders.
 * They require upstream context (decision objects, evidence graphs, authority state)
 * that cannot be validly tested in isolation.
 *
 * This module defines the protocol for validating such products while maintaining
 * evidence integrity and preventing mock authority.
 */

export type ProductValidationMode =
  | "isolated_product_validation"
  | "context_bound_ladder_validation"
  | "simulation_only_non_granting"
  | "manual_review_non_granting";

export type AuthorityGrantEligibility =
  | "eligible_from_isolated_validation"
  | "eligible_from_full_flow_validation"
  | "blocked_until_full_flow_complete"
  | "blocked_by_synthetic_context"
  | "blocked_pending_architecture_review";

export interface ContextDependency {
  dependencyId: string;
  upstreamProduct: string;
  contextObjectType:
    | "decision_object"
    | "evidence_graph"
    | "authority_state"
    | "diagnostic_result"
    | "ladder_context"
    | "risk_assessment";
  minimumDataRequired: string[];
  hashableContent: string;
  purpose: string;
}

export interface ContextBoundProductValidation {
  productCode: string;
  validationMode: ProductValidationMode;
  canValidateInIsolation: boolean;
  canGrantAuthorityFromSyntheticContext: boolean;
  contextDependencies: ContextDependency[];
  upstreamContextHash?: string;
  upstreamFlowHash?: string;
  renderedOutputHash?: string;
  contextDependencyStatus: "unmapped" | "mapped" | "verified" | "failed";
  authorityGrantEligible: AuthorityGrantEligibility;
  blockingReasons: string[];
  validationPath?: string[];
  minimumFullFlowRequired?: string[];
  lastValidationAttempt?: {
    timestamp: string;
    mode: ProductValidationMode;
    result: "pass" | "fail" | "inconclusive";
    reason?: string;
  };
}

/**
 * Classify a product's validation requirements based on its architecture
 */
export function classifyProductValidationMode(
  productCode: string,
  isLadderTerminalNode: boolean,
  requiresUpstreamContext: boolean,
  upstreamDependencies: string[]
): ContextBoundProductValidation {
  if (!isLadderTerminalNode && upstreamDependencies.length === 0) {
    return {
      productCode,
      validationMode: "isolated_product_validation",
      canValidateInIsolation: true,
      canGrantAuthorityFromSyntheticContext: true,
      contextDependencies: [],
      contextDependencyStatus: "mapped",
      authorityGrantEligible: "eligible_from_isolated_validation",
      blockingReasons: [],
    };
  }

  return {
    productCode,
    validationMode: "context_bound_ladder_validation",
    canValidateInIsolation: false,
    canGrantAuthorityFromSyntheticContext: false,
    contextDependencies: [],
    contextDependencyStatus: "unmapped",
    authorityGrantEligible: "blocked_until_full_flow_complete",
    blockingReasons: [
      "Product is ladder-terminal node",
      "Requires upstream context for valid execution",
      "Isolated testing cannot establish authority",
      "Full ladder flow validation required",
    ],
    minimumFullFlowRequired: upstreamDependencies,
  };
}

/**
 * Validate that upstream context is genuine, not synthetic/mock
 */
export function validateContextOrigin(
  contextObject: unknown,
  expectedOrigin: "live_product" | "generated_flow" | "synthetic_test"
): { valid: boolean; origin: string; reason?: string } {
  // Implementation would check:
  // - Hash signatures from upstream
  // - Timestamps indicating real execution
  // - Deterministic generation paths
  // - Absence of mock/test markers

  if (expectedOrigin === "synthetic_test") {
    return {
      valid: false,
      origin: "synthetic_test",
      reason:
        "Synthetic context cannot grant authority. Use only for harness development.",
    };
  }

  return {
    valid: true,
    origin: expectedOrigin,
  };
}

/**
 * Record in Evidence Ledger that product requires context-bound validation
 */
export function recordContextBoundValidationStatus(
  productCode: string,
  validation: ContextBoundProductValidation,
  authorityUpgradeAttempted: boolean = false
): {
  shouldUpgradeAuthority: boolean;
  blockingReason: string;
  nextStep: string;
} {
  if (!validation.canValidateInIsolation && authorityUpgradeAttempted) {
    return {
      shouldUpgradeAuthority: false,
      blockingReason: `${productCode} is context-bound ladder product. Isolated validation cannot grant authority. Full-flow validation required.`,
      nextStep: `Execute full-flow validation from upstream ladder entry through rendered output capture.`,
    };
  }

  if (validation.canGrantAuthorityFromSyntheticContext === false) {
    return {
      shouldUpgradeAuthority: false,
      blockingReason: `${productCode} cannot use synthetic context for authority. Only live/generated upstream flow accepted.`,
      nextStep: `Complete full-flow validation with actual ladder execution.`,
    };
  }

  return {
    shouldUpgradeAuthority: false,
    blockingReason: `Validation inconclusive for ${productCode}`,
    nextStep: "Review context-bound validation status",
  };
}

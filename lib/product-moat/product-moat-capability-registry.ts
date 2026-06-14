/**
 * Product Moat Capability Registry
 *
 * Defines the canonical capability rules for each moat activation mode.
 * These rules are derived from governance frameworks, not guessed per-product.
 *
 * Activation modes are determined by:
 * - ProductReleaseReadiness (blocked, future-ready, release-ready)
 * - ProductReleaseGovernance (lane, mode, authority restrictions)
 * - EvidencePackageRegistry (if applicable)
 *
 * Capability rules are applied uniformly within each mode.
 * No product-specific override without explicit governance reason.
 */

export type ProductMoatActivationMode =
  | "active_memory_write"
  | "passive_context_read"
  | "prewired_pending_evidence"
  | "audit_only_blocked"
  | "internal_only";

export interface MoatCapabilityRule {
  canReadStrategicTwin: boolean;
  canWriteDecisionMemory: boolean;
  canUpdateStrategicTwin: boolean;
  canTriggerConsequenceVerification: boolean;
  canRunInterventionCalibration: boolean;
  canRecommendNextProduct: boolean;
  canCreateReportingOutput: boolean;
}

/**
 * Canonical capability rules by activation mode
 */
export const PRODUCT_MOAT_CAPABILITY_RULES = {
  active_memory_write: {
    canReadStrategicTwin: true,
    canWriteDecisionMemory: true,
    canUpdateStrategicTwin: true,
    canTriggerConsequenceVerification: true,
    canRunInterventionCalibration: true,
    canRecommendNextProduct: true,
    canCreateReportingOutput: true,
  },
  passive_context_read: {
    canReadStrategicTwin: true,
    canWriteDecisionMemory: false,
    canUpdateStrategicTwin: false,
    canTriggerConsequenceVerification: false,
    canRunInterventionCalibration: false,
    canRecommendNextProduct: false,
    canCreateReportingOutput: false,
  },
  prewired_pending_evidence: {
    canReadStrategicTwin: true,
    canWriteDecisionMemory: false,
    canUpdateStrategicTwin: false,
    canTriggerConsequenceVerification: false,
    canRunInterventionCalibration: false,
    canRecommendNextProduct: false,
    canCreateReportingOutput: false,
  },
  audit_only_blocked: {
    canReadStrategicTwin: false,
    canWriteDecisionMemory: false,
    canUpdateStrategicTwin: false,
    canTriggerConsequenceVerification: false,
    canRunInterventionCalibration: false,
    canRecommendNextProduct: false,
    canCreateReportingOutput: false,
  },
  internal_only: {
    canReadStrategicTwin: true,
    canWriteDecisionMemory: false,
    canUpdateStrategicTwin: false,
    canTriggerConsequenceVerification: false,
    canRunInterventionCalibration: false,
    canRecommendNextProduct: false,
    canCreateReportingOutput: false,
  },
} as const;

/**
 * Get capability rule for an activation mode
 */
export function getCapabilityRule(
  mode: ProductMoatActivationMode
): MoatCapabilityRule {
  return PRODUCT_MOAT_CAPABILITY_RULES[mode];
}

/**
 * Determine activation mode based on readiness and governance
 */
export function resolveActivationMode(
  readinessStatus: string,
  isInternalOnly: boolean
): ProductMoatActivationMode {
  // Internal infrastructure
  if (isInternalOnly) {
    return "internal_only";
  }

  // Blocked
  if (readinessStatus === "blocked") {
    return "audit_only_blocked";
  }

  // Release-ready
  if (readinessStatus === "release_ready_now") {
    return "active_memory_write";
  }

  // Future-ready (prewired)
  if (readinessStatus === "future_ready_for_evidence_path") {
    return "prewired_pending_evidence";
  }

  // Default: passive context read
  return "passive_context_read";
}

/**
 * Invariants
 */
export const CAPABILITY_REGISTRY_INVARIANTS = {
  NO_PRODUCT_OVERRIDE:
    "Capability rules are applied uniformly within activation modes",
  NO_AUTHORITY_GRANT:
    "No capability rule grants authority; authority is a separate gate",
  RULES_DERIVED_FROM_GOVERNANCE:
    "Capability rules are derived from governance frameworks, not invented",
  RULES_ARE_IMMUTABLE:
    "Capability rules cannot be overridden at runtime or per-product",
};

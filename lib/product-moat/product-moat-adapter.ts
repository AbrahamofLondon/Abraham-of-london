/**
 * Product Moat Adapter
 *
 * Universal access control for all 43 products to the Enterprise Decision Operating System.
 *
 * Every product must resolve its moat capability before accessing any moat engine.
 * Capability is determined by:
 * - ProductReleaseReadiness (blocked, future-ready, release-ready)
 * - ProductReleaseGovernance (lane, mode, authority restrictions)
 * - EvidencePackageRegistry (if applicable)
 *
 * No product can bypass this adapter.
 */

import {
  ProductMoatCapability,
  ProductMoatActivationMode,
  MOAT_CAPABILITY_DEFAULTS,
  MoatAccessRequest,
  MoatAccessDecision,
} from "./product-moat-contract";

/**
 * Map a product to its moat activation mode
 */
export function resolveMoatActivationMode(
  productCode: string,
  readinessStatus: string,
  authorityState: string,
  releaseLane: string,
  isInternalOnly: boolean
): ProductMoatActivationMode {
  // Internal infrastructure products
  if (isInternalOnly) {
    return "internal_only";
  }

  // Blocked products
  if (readinessStatus === "blocked") {
    return "audit_only_blocked";
  }

  // Release-ready products
  if (readinessStatus === "release_ready_now") {
    return "active_memory_write";
  }

  // Future-ready products (prewired but not yet active)
  if (readinessStatus === "future_ready_for_evidence_path") {
    return "prewired_pending_evidence";
  }

  // Default: passive context read (observation only)
  return "passive_context_read";
}

/**
 * Build a product moat capability record
 */
export function buildProductMoatCapability(
  productCode: string,
  productName: string,
  readinessStatus: string,
  authorityState: string,
  releaseLane: string,
  releaseMode: string,
  evidencePackageValid?: boolean,
  isInternalOnly?: boolean
): ProductMoatCapability {
  // Determine activation mode
  const activationMode = resolveMoatActivationMode(
    productCode,
    readinessStatus,
    authorityState,
    releaseLane,
    isInternalOnly ?? false
  );

  // Get default capabilities for this mode
  const defaults = MOAT_CAPABILITY_DEFAULTS[activationMode];

  // Build boundary description
  const boundaryDescription = buildBoundaryDescription(
    productCode,
    readinessStatus,
    activationMode,
    authorityState
  );

  // Next activation requirement
  const nextActivationRequirement = getNextActivationRequirement(
    activationMode,
    readinessStatus
  );

  return {
    productCode,
    productName,
    activationMode,
    canReadStrategicTwin: defaults.canReadStrategicTwin ?? false,
    canWriteDecisionMemory: defaults.canWriteDecisionMemory ?? false,
    canUpdateStrategicTwin: defaults.canUpdateStrategicTwin ?? false,
    canTriggerConsequenceVerification:
      defaults.canTriggerConsequenceVerification ?? false,
    canRunInterventionCalibration:
      defaults.canRunInterventionCalibration ?? false,
    canRecommendNextProduct: defaults.canRecommendNextProduct ?? false,
    canCreateReportingOutput: defaults.canCreateReportingOutput ?? false,
    authorityState,
    readinessStatus,
    releaseLane,
    releaseMode,
    evidencePackageValid,
    boundaryRequired: defaults.boundaryRequired ?? false,
    boundaryDescription,
    blockedReason: defaults.blockedReason,
    nextActivationRequirement,
    lastVerifiedAt: new Date().toISOString(),
  };
}

/**
 * Check if a moat access request is allowed
 */
export function checkMoatAccessAllowed(
  capability: ProductMoatCapability,
  request: MoatAccessRequest
): MoatAccessDecision {
  // Check engine-specific access
  let accessGranted = false;
  let reason = "";

  switch (request.requestedEngine) {
    case "decision_memory":
      if (request.requestType === "write") {
        accessGranted = capability.canWriteDecisionMemory;
        reason = accessGranted
          ? "Product may write to decision memory"
          : "Product is not authorized to write to decision memory";
      } else {
        accessGranted =
          capability.canReadStrategicTwin || capability.canWriteDecisionMemory;
        reason = "Product may read decision memory context";
      }
      break;

    case "strategic_twin":
      if (request.requestType === "write") {
        accessGranted = capability.canUpdateStrategicTwin;
        reason = accessGranted
          ? "Product may update Strategic Twin"
          : "Product cannot update Strategic Twin";
      } else {
        accessGranted = capability.canReadStrategicTwin;
        reason = accessGranted
          ? "Product may read Strategic Twin"
          : "Product not authorized to read Strategic Twin";
      }
      break;

    case "consequence_verification":
      accessGranted = capability.canTriggerConsequenceVerification;
      reason = accessGranted
        ? "Product may trigger consequence verification"
        : "Product cannot trigger consequence verification";
      break;

    case "intervention_calibration":
      accessGranted = capability.canRunInterventionCalibration;
      reason = accessGranted
        ? "Product may run intervention calibration"
        : "Product cannot run intervention calibration";
      break;

    case "decision_debt":
      accessGranted =
        capability.canReadStrategicTwin && capability.canWriteDecisionMemory;
      reason = accessGranted
        ? "Product may access decision debt"
        : "Insufficient capability for decision debt access";
      break;

    case "falsification_registry":
      accessGranted = capability.canTriggerConsequenceVerification;
      reason = accessGranted
        ? "Product may record falsification"
        : "Product cannot record falsification";
      break;

    case "external_memory":
      accessGranted = capability.canWriteDecisionMemory;
      reason = accessGranted
        ? "Product may ingest external memory"
        : "Product cannot ingest external memory";
      break;

    case "aggregate_patterns":
      accessGranted = capability.canReadStrategicTwin;
      reason = accessGranted
        ? "Product may read aggregate patterns (anonymized)"
        : "Product cannot read aggregate patterns";
      break;

    case "memory_governance":
      accessGranted =
        capability.readinessStatus === "release_ready_now" ||
        capability.readinessStatus === "future_ready_for_evidence_path";
      reason = accessGranted
        ? "Product may check memory governance"
        : "Insufficient access";
      break;

    case "authority_escrow":
      accessGranted = false; // No product directly accesses authority escrow
      reason = "Authority escrow is accessed through governance gates only";
      break;
  }

  return {
    productCode: capability.productCode,
    requestedEngine: request.requestedEngine,
    accessGranted,
    reason,
    requiresBoundary: capability.boundaryRequired && accessGranted,
    boundaryNotice: capability.boundaryRequired
      ? capability.boundaryDescription
      : undefined,
  };
}

/**
 * Build boundary description for product
 */
function buildBoundaryDescription(
  productCode: string,
  readinessStatus: string,
  activationMode: ProductMoatActivationMode,
  authorityState: string
): string {
  const parts: string[] = [];

  parts.push(`Product: ${productCode}`);
  parts.push(`Activation: ${activationMode}`);
  parts.push(`Readiness: ${readinessStatus}`);
  parts.push(`Authority: ${authorityState}`);

  if (activationMode === "active_memory_write") {
    parts.push(
      "Boundary: Product may write governed memory, update Strategic Twin, and trigger interventions. No authority is granted."
    );
  } else if (activationMode === "passive_context_read") {
    parts.push(
      "Boundary: Product may read context only. Writes are not permitted until readiness is satisfied."
    );
  } else if (activationMode === "prewired_pending_evidence") {
    parts.push(
      "Boundary: Product is prewired for future activation. Write access blocked until evidence gates pass."
    );
  } else if (activationMode === "audit_only_blocked") {
    parts.push(
      "Boundary: Product is blocked. Only audit-safe refusal recording permitted."
    );
  }

  return parts.join(" | ");
}

/**
 * Get the next activation requirement
 */
function getNextActivationRequirement(
  activationMode: ProductMoatActivationMode,
  readinessStatus: string
): string | undefined {
  if (activationMode === "active_memory_write") {
    return undefined; // Already active
  }

  if (activationMode === "prewired_pending_evidence") {
    return "Advance readiness status to release_ready_now or future_ready_for_evidence_path with valid evidence package";
  }

  if (activationMode === "audit_only_blocked") {
    return "Resolve blocking condition; advance readiness status";
  }

  if (activationMode === "passive_context_read") {
    return "Improve readiness status to release_ready_now or future_ready_for_evidence_path";
  }

  return undefined;
}

/**
 * Get moat capability for a product
 * This is called by every moat engine access point
 */
export function getProductMoatCapability(
  productCode: string,
  productName: string,
  readinessStatus: string,
  authorityState: string,
  releaseLane: string,
  releaseMode: string,
  evidencePackageValid?: boolean,
  isInternalOnly?: boolean
): ProductMoatCapability {
  return buildProductMoatCapability(
    productCode,
    productName,
    readinessStatus,
    authorityState,
    releaseLane,
    releaseMode,
    evidencePackageValid,
    isInternalOnly
  );
}

export default {
  getProductMoatCapability,
  buildProductMoatCapability,
  checkMoatAccessAllowed,
  resolveMoatActivationMode,
};

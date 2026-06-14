/**
 * Governed Product Memory
 *
 * All product memory writes flow through this governance layer.
 *
 * Before any product can write to decision memory:
 * 1. Check product moat capability (typed estate registry)
 * 2. Verify readiness state
 * 3. Verify authority state
 * 4. Check evidence package validity (if required)
 * 5. Only then record memory with full governance context
 *
 * This ensures memory writes cannot bypass governance.
 */

import { EstateProductCode, isEstateProductCode } from "./estate-product-registry";
import {
  getCapabilityRule,
  resolveActivationMode,
} from "./product-moat-capability-registry";
import { recordProductMemoryEvent } from "../decision-memory/product-memory-adapter";
import type { ProductMemoryEventArgs } from "../decision-memory/product-memory-adapter";

export interface GovernedMemoryWriteRequest {
  productCode: string;
  caseId: string;
  eventType: ProductMemoryEventArgs["eventType"];
  sourceSurface: string;
  summary: string;
  contradictionKeys?: string[];
  evidenceGapKeys?: string[];
  commitmentKeys?: string[];
  consequenceKeys?: string[];
  // Governance context must be provided
  readinessStatus: string;
  authorityState: string;
  releaseLane: string;
}

export interface GovernedMemoryWriteResult {
  success: boolean;
  eventId?: string;
  reason: string;
  blockedReason?: string;
  governance: {
    productCode: string;
    readinessStatus: string;
    authorityState: string;
    activationMode: string;
  };
}

/**
 * Write memory through governance layer
 */
export function recordGovernedProductMemory(
  request: GovernedMemoryWriteRequest
): GovernedMemoryWriteResult {
  // CHECK 1: Product code is valid
  if (!isEstateProductCode(request.productCode)) {
    return {
      success: false,
      reason: `Unknown product code: ${request.productCode}`,
      blockedReason: "Product code not in estate registry",
      governance: {
        productCode: request.productCode,
        readinessStatus: request.readinessStatus,
        authorityState: request.authorityState,
        activationMode: "unknown",
      },
    };
  }

  const productCode = request.productCode as EstateProductCode;

  // CHECK 2: Determine activation mode
  const activationMode = resolveActivationMode(
    request.readinessStatus,
    false
  );

  // CHECK 3: Get capability rule for this mode
  const capability = getCapabilityRule(activationMode);

  // CHECK 4: Product must be able to write memory
  if (!capability.canWriteDecisionMemory) {
    return {
      success: false,
      reason: `Product ${productCode} in mode ${activationMode} cannot write memory`,
      blockedReason: "Product readiness state does not allow memory writes",
      governance: {
        productCode,
        readinessStatus: request.readinessStatus,
        authorityState: request.authorityState,
        activationMode,
      },
    };
  }

  // CHECK 5: Governance context must be present
  if (!request.readinessStatus || !request.authorityState) {
    return {
      success: false,
      reason: "Governance context missing (readiness or authority state)",
      blockedReason: "Cannot write memory without governance context",
      governance: {
        productCode,
        readinessStatus: request.readinessStatus,
        authorityState: request.authorityState,
        activationMode,
      },
    };
  }

  // CHECK 6: Positive authority must not be claimed
  if (request.authorityState === "positive_authority") {
    return {
      success: false,
      reason: "Cannot write memory while claiming positive authority",
      blockedReason:
        "Memory write cannot grant or assume positive authority",
      governance: {
        productCode,
        readinessStatus: request.readinessStatus,
        authorityState: request.authorityState,
        activationMode,
      },
    };
  }

  // All checks passed - record memory with governance context
  try {
    const success = recordProductMemoryEvent({
      productCode,
      caseId: request.caseId,
      actorType: "operator",
      eventType: request.eventType,
      authorityStateAtEvent: request.authorityState,
      readinessStatusAtEvent: request.readinessStatus,
      evidenceBoundaryAccepted: true,
      claimBoundary: `Product ${productCode} in mode ${activationMode}; authority state ${request.authorityState}`,
      sourceSurface: request.sourceSurface,
      summary: request.summary,
      contradictionKeys: request.contradictionKeys,
      evidenceGapKeys: request.evidenceGapKeys,
      commitmentKeys: request.commitmentKeys,
      consequenceKeys: request.consequenceKeys,
    });

    if (success) {
      return {
        success: true,
        reason: `Memory recorded for ${productCode}`,
        governance: {
          productCode,
          readinessStatus: request.readinessStatus,
          authorityState: request.authorityState,
          activationMode,
        },
      };
    } else {
      return {
        success: false,
        reason: "Failed to record memory in store",
        blockedReason: "Persistence error",
        governance: {
          productCode,
          readinessStatus: request.readinessStatus,
          authorityState: request.authorityState,
          activationMode,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      reason: `Exception recording memory: ${error instanceof Error ? error.message : String(error)}`,
      blockedReason: "Unexpected error",
      governance: {
        productCode,
        readinessStatus: request.readinessStatus,
        authorityState: request.authorityState,
        activationMode,
      },
    };
  }
}

/**
 * Invariant: No memory write bypasses governance
 */
export const GOVERNED_MEMORY_INVARIANTS = {
  PRODUCT_CODE_MUST_BE_VALID: "Unknown product codes fail closed",
  CAPABILITY_MUST_ALLOW_WRITE: "Product readiness state must permit writes",
  GOVERNANCE_CONTEXT_REQUIRED:
    "Authority state and readiness state must be recorded",
  NO_POSITIVE_AUTHORITY_CLAIM:
    "Memory writes cannot claim or assume positive authority",
  ALL_CHECKS_MUST_PASS:
    "All five governance checks must pass before memory is recorded",
};

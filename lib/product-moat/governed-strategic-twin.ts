/**
 * Governed Strategic Twin
 *
 * All Strategic Twin updates flow through this governance layer.
 *
 * Twin updates can only occur from:
 * 1. Governed memory events (already passed governance checks)
 * 2. Products that have write capability
 *
 * Twin updates cannot:
 * - Modify ProductAuthorityContract
 * - Change release lane or mode
 * - Grant authority
 * - Bypass readiness state
 *
 * This ensures Strategic Twin cannot drift into unsupported territory.
 */

import { EstateProductCode, isEstateProductCode } from "./estate-product-registry";
import {
  getCapabilityRule,
  resolveActivationMode,
} from "./product-moat-capability-registry";
import type { StrategicTwinState } from "../strategic-twin/strategic-twin-contract";
import strategicTwinUpdater from "../strategic-twin/strategic-twin-updater";
import strategicTwinLoader from "../strategic-twin/strategic-twin-state-loader";

export interface GovernedTwinUpdateRequest {
  productCode: string;
  caseId: string;
  updateType:
    | "pressure_increased"
    | "contradiction_detected"
    | "evidence_gap_identified"
    | "commitment_recorded"
    | "pattern_detected"
    | "readiness_updated";
  pressureLevel?: "low" | "medium" | "high" | "critical";
  contradictions?: string[];
  evidenceGaps?: string[];
  commitments?: string[];
  reason: string;
  // Governance context
  readinessStatus: string;
  authorityState: string;
}

export interface GovernedTwinUpdateResult {
  success: boolean;
  newState?: StrategicTwinState;
  reason: string;
  blockedReason?: string;
  governance: {
    productCode: string;
    readinessStatus: string;
    activationMode: string;
  };
}

/**
 * Update Strategic Twin through governance layer
 */
export function updateGovernedStrategicTwin(
  request: GovernedTwinUpdateRequest
): GovernedTwinUpdateResult {
  // CHECK 1: Product code is valid
  if (!isEstateProductCode(request.productCode)) {
    return {
      success: false,
      reason: `Unknown product code: ${request.productCode}`,
      blockedReason: "Product code not in estate registry",
      governance: {
        productCode: request.productCode,
        readinessStatus: request.readinessStatus,
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

  // CHECK 3: Product must be able to update twin
  const capability = getCapabilityRule(activationMode);

  if (!capability.canUpdateStrategicTwin) {
    return {
      success: false,
      reason: `Product ${productCode} in mode ${activationMode} cannot update Strategic Twin`,
      blockedReason: "Product readiness state does not allow twin updates",
      governance: {
        productCode,
        readinessStatus: request.readinessStatus,
        activationMode,
      },
    };
  }

  // CHECK 4: Load current twin state
  let currentTwin = strategicTwinLoader.loadTwinState(request.caseId);

  if (!currentTwin) {
    // Initialize if doesn't exist
    currentTwin = strategicTwinUpdater.initializeTwin(
      request.caseId,
      "team"
    );
  }

  // CHECK 5: Apply update based on type
  try {
    let updatedTwin: StrategicTwinState | null = null;

    switch (request.updateType) {
      case "pressure_increased":
        if (request.pressureLevel) {
          updatedTwin = strategicTwinUpdater.updateDecisionPressure(
            request.caseId,
            productCode,
            request.pressureLevel,
            request.reason
          );
        }
        break;

      case "contradiction_detected":
        if (request.contradictions && request.contradictions.length > 0) {
          updatedTwin = strategicTwinUpdater.applyUpdate({
            caseId: request.caseId,
            updatingProductCode: productCode,
            updateAt: new Date().toISOString(),
            updateType: "pattern_detected",
            contradictionChanges: {
              added: request.contradictions,
              resolved: [],
            },
            summary: `Contradictions detected: ${request.contradictions.join(", ")}`,
            reasoning: request.reason,
          });
        }
        break;

      case "evidence_gap_identified":
        if (request.evidenceGaps && request.evidenceGaps.length > 0) {
          updatedTwin = strategicTwinUpdater.applyUpdate({
            caseId: request.caseId,
            updatingProductCode: productCode,
            updateAt: new Date().toISOString(),
            updateType: "evidence_collected",
            evidenceGapChanges: {
              added: request.evidenceGaps,
              resolved: [],
            },
            summary: `Evidence gaps identified: ${request.evidenceGaps.join(", ")}`,
            reasoning: request.reason,
          });
        }
        break;

      case "commitment_recorded":
        if (request.commitments && request.commitments.length > 0) {
          updatedTwin = strategicTwinUpdater.applyUpdate({
            caseId: request.caseId,
            updatingProductCode: productCode,
            updateAt: new Date().toISOString(),
            updateType: "commitment_added",
            commitmentChanges: {
              added: request.commitments,
              completed: [],
              abandoned: [],
            },
            summary: `Commitments recorded: ${request.commitments.join(", ")}`,
            reasoning: request.reason,
          });
        }
        break;

      case "readiness_updated":
        updatedTwin = strategicTwinUpdater.updateInterventionReadiness(
          request.caseId,
          productCode,
          "evidence_needed",
          request.reason
        );
        break;
    }

    if (updatedTwin) {
      return {
        success: true,
        newState: updatedTwin,
        reason: `Twin updated by ${productCode}`,
        governance: {
          productCode,
          readinessStatus: request.readinessStatus,
          activationMode,
        },
      };
    } else {
      return {
        success: false,
        reason: "Twin update did not apply changes",
        blockedReason: "No updates to apply",
        governance: {
          productCode,
          readinessStatus: request.readinessStatus,
          activationMode,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      reason: `Exception updating twin: ${error instanceof Error ? error.message : String(error)}`,
      blockedReason: "Unexpected error",
      governance: {
        productCode,
        readinessStatus: request.readinessStatus,
        activationMode,
      },
    };
  }
}

/**
 * Invariant: Twin updates respect governance
 */
export const GOVERNED_TWIN_INVARIANTS = {
  PRODUCT_CODE_VALID: "Only valid estate products can update twin",
  CAPABILITY_REQUIRED: "Product readiness state must permit updates",
  NO_AUTHORITY_MODIFICATION:
    "Twin updates cannot modify ProductAuthorityContract",
  NO_GOVERNANCE_OVERRIDE:
    "Twin updates cannot change release lane, mode, or authority state",
  UPDATES_FROM_GOVERNED_MEMORY:
    "Twin updates should originate from governed memory events",
};

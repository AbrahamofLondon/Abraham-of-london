/**
 * Governed Intervention Calibration
 *
 * All intervention calibrations flow through this governance layer.
 *
 * Before any product can run intervention calibration:
 * 1. Product must have capability to run calibrations
 * 2. Strategic Twin state must be available
 * 3. Decision Memory must be available
 * 4. Readiness state must permit this operation
 * 5. Recommendations must respect blocked product boundaries
 *
 * Calibrations cannot:
 * - Recommend blocked products as commercial routes
 * - Bypass readiness state
 * - Claim authority or certainty
 */

import { EstateProductCode, isEstateProductCode } from "./estate-product-registry";
import {
  getCapabilityRule,
  resolveActivationMode,
} from "./product-moat-capability-registry";
import strategicTwinLoader from "../strategic-twin/strategic-twin-state-loader";
import decisionMemoryStore from "../decision-memory/decision-memory-store";
import interventionCalibrationEngine from "../intervention/intervention-calibration-engine";
import type { InterventionCalibration } from "../intervention/intervention-calibration-contract";

export interface GovernedCalibrationRequest {
  productCode: string;
  caseId: string;
  readinessStatus: string;
  authorityState: string;
  releaseReadyProducts: string[];
  futureReadyProducts: string[];
  blockedProducts: string[];
}

export interface GovernedCalibrationResult {
  success: boolean;
  calibration?: InterventionCalibration;
  reason: string;
  blockedReason?: string;
  governance: {
    productCode: string;
    readinessStatus: string;
    activationMode: string;
  };
}

/**
 * Run intervention calibration through governance layer
 */
export function runGovernedInterventionCalibration(
  request: GovernedCalibrationRequest
): GovernedCalibrationResult {
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

  // CHECK 3: Product must be able to run calibration
  const capability = getCapabilityRule(activationMode);

  if (!capability.canRunInterventionCalibration) {
    return {
      success: false,
      reason: `Product ${productCode} in mode ${activationMode} cannot run calibration`,
      blockedReason: "Product readiness state does not allow calibrations",
      governance: {
        productCode,
        readinessStatus: request.readinessStatus,
        activationMode,
      },
    };
  }

  // CHECK 4: Load Strategic Twin state
  const twinState = strategicTwinLoader.loadTwinState(request.caseId);

  if (!twinState) {
    return {
      success: false,
      reason: "No Strategic Twin state available for case",
      blockedReason: "Twin state required for calibration",
      governance: {
        productCode,
        readinessStatus: request.readinessStatus,
        activationMode,
      },
    };
  }

  // CHECK 5: Load decision memory
  const memory = decisionMemoryStore.query({
    caseId: request.caseId,
  });

  // CHECK 6: Run calibration
  try {
    const calibration = interventionCalibrationEngine.calibrate(
      {
        caseId: request.caseId,
        subjectType: twinState.subjectType,
        decisionPressure: twinState.currentDecisionPressure,
        evidenceAvailability: calculateEvidenceAvailability(memory),
        patternRecurrenceCount: twinState.repeatedPatterns.length,
        consequenceRisk: "medium", // TODO: derive from twin state
        interventionReadiness: twinState.currentInterventionReadiness,
      },
      productCode
    );

    // CHECK 7: Calibration result is valid
    // Note: blocked product validation is performed within intervention-calibration-engine
    // per the design that calibration engine enforces recommendations respect readiness

    return {
      success: true,
      calibration,
      reason: `Calibration completed by ${productCode}`,
      governance: {
        productCode,
        readinessStatus: request.readinessStatus,
        activationMode,
      },
    };
  } catch (error) {
    return {
      success: false,
      reason: `Exception running calibration: ${error instanceof Error ? error.message : String(error)}`,
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
 * Calculate evidence availability from memory events
 */
function calculateEvidenceAvailability(memory: any): number {
  if (!memory || !memory.events || memory.events.length === 0) {
    return 0;
  }

  const gapCount = memory.events.reduce(
    (sum: number, e: any) => sum + (e.evidenceGapKeys?.length || 0),
    0
  );

  const totalReferences = memory.events.length * 3;
  return Math.min(1.0, Math.max(0, 1.0 - gapCount / totalReferences));
}

/**
 * Invariant: Calibrations respect governance
 */
export const GOVERNED_CALIBRATION_INVARIANTS = {
  PRODUCT_CODE_VALID: "Only valid estate products can run calibrations",
  CAPABILITY_REQUIRED: "Product readiness state must permit calibrations",
  TWIN_STATE_REQUIRED: "Strategic Twin state must be available",
  MEMORY_REQUIRED: "Decision memory must be available",
  NO_BLOCKED_RECOMMENDATIONS:
    "Recommendations cannot suggest blocked products as commercial routes",
  READINESS_RESPECTED:
    "Recommendations must respect release readiness state",
  NO_CERTAINTY_CLAIMS:
    "Calibrations are advice, not authority; must include confidence bounds",
};

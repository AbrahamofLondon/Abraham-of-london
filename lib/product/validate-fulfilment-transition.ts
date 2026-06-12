/**
 * lib/product/validate-fulfilment-transition.ts
 *
 * Universal Fulfilment Transition Validator.
 *
 * No admin action, webhook, or automated generation job should transition
 * fulfilment state without passing this validator.
 *
 * The validator checks:
 * 1. The transition is valid for the product's delivery class
 * 2. All required evidence gates pass
 * 3. No unsafe state is entered
 */

import type { UniversalFulfilmentState, DeliveryClass } from "./universal-fulfilment-state";
import { getFulfilmentStateMap } from "./universal-fulfilment-state";
import {
  checkEvidenceGate,
  checkFulfilmentTransitionEvidence,
  type FulfilmentEvidenceContext,
  type FulfilmentEvidence,
} from "./fulfilment-evidence-gates";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FulfilmentTransitionValidationResult {
  allowed: boolean;
  missingEvidence: string[];
  currentState: UniversalFulfilmentState;
  attemptedNextState: UniversalFulfilmentState;
  blockingReason?: string;
  productCode: string;
  deliveryClass: string;
  isRequiredState: boolean;
  isSkippableState: boolean;
  gateResults: Array<{
    gate: string;
    passed: boolean;
    missing: string[];
  }>;
}

// ─── Validator ────────────────────────────────────────────────────────────────

export function validateFulfilmentTransition(params: {
  productCode: string;
  currentState: UniversalFulfilmentState;
  nextState: UniversalFulfilmentState;
  context: FulfilmentEvidenceContext;
}): FulfilmentTransitionValidationResult {
  const { productCode, currentState, nextState, context } = params;

  // 1. Look up product state map
  const stateMap = getFulfilmentStateMap(productCode);

  if (!stateMap) {
    return {
      allowed: false,
      missingEvidence: [],
      currentState,
      attemptedNextState: nextState,
      blockingReason: `No fulfilment state map found for product "${productCode}".`,
      productCode,
      deliveryClass: "unknown",
      isRequiredState: false,
      isSkippableState: false,
      gateResults: [],
    };
  }

  // 2. Check if the target state is required or skippable
  const isRequiredState = stateMap.requiredStates.includes(nextState);
  const isSkippableState = stateMap.skippableStates.includes(nextState);

  // 3. Check evidence gates
  const gateResults = checkEvidenceGate(currentState, nextState, context);

  const missingEvidence: string[] = [];
  const formattedGateResults = gateResults.map((r) => {
    if (!r.passed) {
      missingEvidence.push(...r.missingEvidence);
    }
    return {
      gate: `${r.gate.from} → ${r.gate.to}`,
      passed: r.passed,
      missing: r.missingEvidence,
    };
  });

  // 4. Determine if transition is allowed
  const blockingGate = gateResults.find((r) => !r.passed && r.gate.blockingIfMissing);
  const allowed = !blockingGate;

  return {
    allowed,
    missingEvidence,
    currentState,
    attemptedNextState: nextState,
    blockingReason: blockingGate?.gate.failureMessage ?? undefined,
    productCode,
    deliveryClass: stateMap.deliveryClass,
    isRequiredState,
    isSkippableState,
    gateResults: formattedGateResults,
  };
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

/**
 * Assert that a fulfilment transition is valid. Throws if not.
 * Use in API routes and webhook handlers.
 */
export function assertFulfilmentTransition(params: {
  productCode: string;
  currentState: UniversalFulfilmentState;
  nextState: UniversalFulfilmentState;
  context: FulfilmentEvidenceContext;
}): void {
  const result = validateFulfilmentTransition(params);
  if (!result.allowed) {
    throw new Error(
      `FULFILMENT_TRANSITION_BLOCKED: Cannot transition ${result.currentState} → ${result.attemptedNextState} for product "${result.productCode}". ` +
      `Reason: ${result.blockingReason ?? "Missing evidence"}. ` +
      `Missing evidence: ${result.missingEvidence.join(", ") || "none"}.`,
    );
  }
}

/**
 * Get user-facing admin message for why a transition is blocked.
 */
export function getAdminBlockingMessage(params: {
  productCode: string;
  currentState: UniversalFulfilmentState;
  nextState: UniversalFulfilmentState;
  context: FulfilmentEvidenceContext;
}): string | null {
  const result = validateFulfilmentTransition(params);
  if (result.allowed) return null;

  // Map evidence keys to user-facing messages
  const evidenceMessages: Record<string, string> = {
    paymentId: "Payment has not been confirmed.",
    customerId: "Customer information is missing.",
    productCode: "Product code is not set.",
    entitlementId: "Customer entitlement has not been created.",
    orderId: "Order record is missing.",
    draftExists: "No draft has been created.",
    artifactId: "No artifact has been registered.",
    adminPreviewUrl: "Admin preview URL has not been generated.",
    operatorApproved: "Operator has not approved this delivery.",
    customerAccessUrl: "Customer access URL has not been generated.",
    customerEmail: "Customer email is missing.",
    customerNotified: "Customer has not been notified.",
    deliveryAuditEventExists: "Delivery audit event has not been recorded.",
    valueInspectionPassed: "The artefact has not passed content-based value inspection.",
    valueReadinessPassed: "The artefact has not passed content-based value inspection.",
  };

  const messages = result.missingEvidence.map((e) => evidenceMessages[e] ?? `Missing: ${e}`);
  return `Cannot ${result.attemptedNextState.replace(/_/g, " ")}: ${messages.join(" ")}`;
}

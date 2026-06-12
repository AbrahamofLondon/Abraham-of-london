/**
 * lib/product/fulfilment-evidence-gates.ts
 *
 * Evidence-gated state transitions for the Universal Fulfilment Spine.
 *
 * Every transition between universal fulfilment states requires specific
 * evidence to be present. If evidence is missing, the transition is blocked.
 *
 * This prevents the system from claiming "generated", "ready", "delivered",
 * or "fulfilled" unless the required evidence actually exists.
 */

import type { UniversalFulfilmentState } from "./universal-fulfilment-state";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FulfilmentEvidenceGate {
  from: UniversalFulfilmentState;
  to: UniversalFulfilmentState;
  /** Keys of required evidence that must be present */
  requiredEvidence: string[];
  /** Whether missing evidence blocks the transition entirely */
  blockingIfMissing: boolean;
  /** Message shown to admin/user when evidence is missing */
  failureMessage: string;
}

export interface FulfilmentEvidenceContext {
  /** Was payment confirmed? (paymentId, stripeSessionId, etc.) */
  paymentConfirmed: boolean;
  /** Does the customer have an entitlement record? */
  entitlementExists: boolean;
  /** Does an internal order/record exist? */
  internalRecordExists: boolean;
  /** Does a draft/case study/dossier exist? */
  draftExists: boolean;
  /** Is there an admin preview URL? */
  adminPreviewUrl: string | null;
  /** Has an operator reviewed and approved? */
  operatorApproved: boolean;
  /** Is there a customer-facing access URL? */
  customerAccessUrl: string | null;
  /** Has the customer been notified? */
  customerNotified: boolean;
  /** Has deliveredAt been set? */
  deliveredAt: Date | null;
  /** Does a delivery audit event exist? */
  deliveryAuditEventExists: boolean;
  /** Product code for context */
  productCode: string;
  /** Order/run ID for context */
  orderId: string;
  /** Customer email */
  customerEmail: string | null;
  /** Artifact ID if one exists */
  artifactId: string | null;
  /** Artifact status if one exists */
  artifactStatus: string | null;
  /** Artifact delivery status if one exists */
  artifactDeliveryStatus: string | null;
}

export interface EvidenceGateResult {
  gate: FulfilmentEvidenceGate;
  passed: boolean;
  missingEvidence: string[];
  presentEvidence: string[];
}

// ─── Universal Evidence Gates ─────────────────────────────────────────────────

export const UNIVERSAL_EVIDENCE_GATES: FulfilmentEvidenceGate[] = [
  // ── Payment → Entitlement ───────────────────────────────────────────────
  {
    from: "payment_confirmed",
    to: "entitlement_created",
    requiredEvidence: ["paymentId", "customerId", "productCode"],
    blockingIfMissing: true,
    failureMessage: "Cannot create entitlement: payment confirmation, customer ID, or product code is missing.",
  },

  // ── Entitlement → Internal Records ──────────────────────────────────────
  {
    from: "entitlement_created",
    to: "internal_records_created",
    requiredEvidence: ["entitlementId", "orderId"],
    blockingIfMissing: true,
    failureMessage: "Cannot create internal records: entitlement or order record is missing.",
  },

  // ── Internal Records → Draft ────────────────────────────────────────────
  {
    from: "internal_records_created",
    to: "draft_created",
    requiredEvidence: ["orderId", "draftExists"],
    blockingIfMissing: true,
    failureMessage: "Cannot mark draft created: no draft record exists.",
  },

  // ── Draft → Admin Preview Ready ─────────────────────────────────────────
  {
    from: "draft_created",
    to: "admin_preview_ready",
    requiredEvidence: ["artifactId", "adminPreviewUrl"],
    blockingIfMissing: true,
    failureMessage: "Cannot mark admin preview ready: artifact ID or admin preview URL is missing.",
  },

  // ── Admin Preview Ready → Awaiting Operator Review ──────────────────────
  {
    from: "admin_preview_ready",
    to: "awaiting_operator_review",
    requiredEvidence: ["adminPreviewUrl"],
    blockingIfMissing: true,
    failureMessage: "Cannot begin operator review: admin preview URL is missing.",
  },

  // ── Awaiting Operator Review → Approved for Delivery ────────────────────
  {
    from: "awaiting_operator_review",
    to: "approved_for_delivery",
    requiredEvidence: ["operatorApproved", "adminPreviewUrl"],
    blockingIfMissing: true,
    failureMessage: "Cannot approve for delivery: operator has not approved or admin preview is missing.",
  },

  // ── Approved for Delivery → Customer Access Created ─────────────────────
  {
    from: "approved_for_delivery",
    to: "customer_access_created",
    requiredEvidence: ["customerAccessUrl", "artifactId"],
    blockingIfMissing: true,
    failureMessage: "Cannot create customer access: customer access URL or artifact ID is missing.",
  },

  // ── Customer Access Created → Customer Notified ─────────────────────────
  {
    from: "customer_access_created",
    to: "customer_notified",
    requiredEvidence: ["customerAccessUrl", "customerEmail", "customerNotified"],
    blockingIfMissing: false,
    failureMessage: "Customer has access but has not been notified. Consider sending delivery email.",
  },

  // ── Customer Access Created / Notified → Delivered ──────────────────────
  {
    from: "customer_access_created",
    to: "delivered",
    requiredEvidence: ["customerAccessUrl", "deliveryAuditEventExists", "customerEmail"],
    blockingIfMissing: true,
    failureMessage: "Cannot mark delivered: customer access URL, delivery audit event, or customer email is missing.",
  },
  {
    from: "customer_notified",
    to: "delivered",
    requiredEvidence: ["customerAccessUrl", "deliveryAuditEventExists", "customerEmail", "customerNotified"],
    blockingIfMissing: true,
    failureMessage: "Cannot mark delivered: customer access URL, delivery audit event, or customer notification is missing.",
  },

  // ── Any → Blocked ───────────────────────────────────────────────────────
  {
    from: "payment_confirmed",
    to: "blocked",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Order blocked.",
  },
  {
    from: "entitlement_created",
    to: "blocked",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Order blocked.",
  },
  {
    from: "internal_records_created",
    to: "blocked",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Order blocked.",
  },
  {
    from: "draft_created",
    to: "blocked",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Order blocked.",
  },
  {
    from: "admin_preview_ready",
    to: "blocked",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Order blocked.",
  },
  {
    from: "awaiting_operator_review",
    to: "blocked",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Order blocked.",
  },
  {
    from: "approved_for_delivery",
    to: "blocked",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Order blocked.",
  },
  {
    from: "customer_access_created",
    to: "blocked",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Order blocked.",
  },
  {
    from: "customer_notified",
    to: "blocked",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Order blocked.",
  },

  // ── Any → Failed ────────────────────────────────────────────────────────
  {
    from: "payment_confirmed",
    to: "failed",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Fulfilment failed.",
  },
  {
    from: "entitlement_created",
    to: "failed",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Fulfilment failed.",
  },
  {
    from: "internal_records_created",
    to: "failed",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Fulfilment failed.",
  },
  {
    from: "draft_created",
    to: "failed",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Fulfilment failed.",
  },
  {
    from: "admin_preview_ready",
    to: "failed",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Fulfilment failed.",
  },
  {
    from: "awaiting_operator_review",
    to: "failed",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Fulfilment failed.",
  },
  {
    from: "approved_for_delivery",
    to: "failed",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Fulfilment failed.",
  },
  {
    from: "customer_access_created",
    to: "failed",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Fulfilment failed.",
  },
  {
    from: "customer_notified",
    to: "failed",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Fulfilment failed.",
  },

  // ── Any → Refunded ──────────────────────────────────────────────────────
  {
    from: "payment_confirmed",
    to: "refunded",
    requiredEvidence: ["paymentId"],
    blockingIfMissing: false,
    failureMessage: "Refund processed.",
  },
  {
    from: "entitlement_created",
    to: "refunded",
    requiredEvidence: ["paymentId"],
    blockingIfMissing: false,
    failureMessage: "Refund processed.",
  },
  {
    from: "internal_records_created",
    to: "refunded",
    requiredEvidence: ["paymentId"],
    blockingIfMissing: false,
    failureMessage: "Refund processed.",
  },
  {
    from: "draft_created",
    to: "refunded",
    requiredEvidence: ["paymentId"],
    blockingIfMissing: false,
    failureMessage: "Refund processed.",
  },
  {
    from: "admin_preview_ready",
    to: "refunded",
    requiredEvidence: ["paymentId"],
    blockingIfMissing: false,
    failureMessage: "Refund processed.",
  },
  {
    from: "awaiting_operator_review",
    to: "refunded",
    requiredEvidence: ["paymentId"],
    blockingIfMissing: false,
    failureMessage: "Refund processed.",
  },
  {
    from: "approved_for_delivery",
    to: "refunded",
    requiredEvidence: ["paymentId"],
    blockingIfMissing: false,
    failureMessage: "Refund processed.",
  },
  {
    from: "customer_access_created",
    to: "refunded",
    requiredEvidence: ["paymentId"],
    blockingIfMissing: false,
    failureMessage: "Refund processed.",
  },
  {
    from: "customer_notified",
    to: "refunded",
    requiredEvidence: ["paymentId"],
    blockingIfMissing: false,
    failureMessage: "Refund processed.",
  },
  {
    from: "delivered",
    to: "refunded",
    requiredEvidence: ["paymentId"],
    blockingIfMissing: false,
    failureMessage: "Refund processed after delivery.",
  },

  // ── Any → Cancelled ─────────────────────────────────────────────────────
  {
    from: "payment_confirmed",
    to: "cancelled",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Order cancelled.",
  },
  {
    from: "entitlement_created",
    to: "cancelled",
    requiredEvidence: [],
    blockingIfMissing: false,
    failureMessage: "Order cancelled.",
  },
];

// ─── Gate Validation ──────────────────────────────────────────────────────────

/**
 * Check whether a transition is allowed based on available evidence.
 * Returns detailed results for every matching gate.
 */
export function checkEvidenceGate(
  from: UniversalFulfilmentState,
  to: UniversalFulfilmentState,
  context: FulfilmentEvidenceContext,
): EvidenceGateResult[] {
  // Find all gates matching this transition
  const matchingGates = UNIVERSAL_EVIDENCE_GATES.filter(
    (g) => g.from === from && g.to === to,
  );

  if (matchingGates.length === 0) {
    // No gate defined — transition is implicitly allowed
    return [];
  }

  return matchingGates.map((gate) => {
    const missingEvidence: string[] = [];
    const presentEvidence: string[] = [];

    for (const evidence of gate.requiredEvidence) {
      const isPresent = checkEvidence(evidence, context);
      if (isPresent) {
        presentEvidence.push(evidence);
      } else {
        missingEvidence.push(evidence);
      }
    }

    const passed = !gate.blockingIfMissing || missingEvidence.length === 0;

    return { gate, passed, missingEvidence, presentEvidence };
  });
}

/**
 * Check if a specific piece of evidence is present in the context.
 */
function checkEvidence(evidence: string, context: FulfilmentEvidenceContext): boolean {
  switch (evidence) {
    case "paymentId":
      return context.paymentConfirmed;
    case "customerId":
      return !!context.customerEmail;
    case "productCode":
      return !!context.productCode;
    case "entitlementId":
      return context.entitlementExists;
    case "orderId":
      return !!context.orderId;
    case "draftExists":
      return context.draftExists;
    case "artifactId":
      return !!context.artifactId;
    case "adminPreviewUrl":
      return !!context.adminPreviewUrl;
    case "operatorApproved":
      return context.operatorApproved;
    case "customerAccessUrl":
      return !!context.customerAccessUrl;
    case "customerEmail":
      return !!context.customerEmail;
    case "customerNotified":
      return context.customerNotified;
    case "deliveryAuditEventExists":
      return context.deliveryAuditEventExists;
    default:
      return false;
  }
}

/**
 * Check if a transition is allowed. Returns true only if all blocking gates pass.
 */
export function isTransitionAllowed(
  from: UniversalFulfilmentState,
  to: UniversalFulfilmentState,
  context: FulfilmentEvidenceContext,
): boolean {
  const results = checkEvidenceGate(from, to, context);

  // No gates = implicitly allowed
  if (results.length === 0) return true;

  // All blocking gates must pass
  return results.every((r) => r.passed);
}

/**
 * Get the blocking reason for a disallowed transition.
 */
export function getBlockingReason(
  from: UniversalFulfilmentState,
  to: UniversalFulfilmentState,
  context: FulfilmentEvidenceContext,
): string | null {
  const results = checkEvidenceGate(from, to, context);

  for (const result of results) {
    if (!result.passed && result.gate.blockingIfMissing) {
      return result.gate.failureMessage;
    }
  }

  return null;
}

// ─── Universal Evidence Interface ────────────────────────────────────────────
// Used by validate-fulfilment-transition.ts for the new typed gate API.

export interface FulfilmentEvidence {
  /** Stripe payment confirmed */
  paymentConfirmed: boolean;
  /** ClientEntitlement ID exists */
  entitlementId: string | null;
  /** ProductArtifact ID */
  artifactId: string | null;
  /** ProductArtifact.status e.g. PENDING | DRAFT | READY | READY_FOR_DELIVERY | DELIVERED */
  artifactStatus: string | null;
  /** Operator has explicitly approved */
  operatorApproved: boolean;
  /** Secure customer access link exists */
  accessLinkCreated: boolean;
  /** deliveredAt timestamp set */
  deliveredAt: Date | null;
  /** Stripe webhook event ID for idempotency */
  webhookEventId: string | null;
}

export interface FulfilmentGateResult {
  allowed: boolean;
  reason: string;
  missingEvidence: string[];
}

/**
 * Check whether a delivery-class-aware transition is permitted.
 * Returns { allowed, reason, missingEvidence } — never throws.
 */
export function checkFulfilmentTransitionEvidence(params: {
  productCode: string;
  deliveryClass: import("./universal-fulfilment-state").DeliveryClass;
  fromState: import("./universal-fulfilment-state").UniversalFulfilmentState;
  toState: import("./universal-fulfilment-state").UniversalFulfilmentState;
  evidence: FulfilmentEvidence;
}): FulfilmentGateResult {
  const { fromState, toState, evidence, deliveryClass } = params;
  const missing: string[] = [];

  // ── Payment required for any non-terminal forward progress ────────────────
  if (
    toState !== "blocked" &&
    toState !== "failed" &&
    toState !== "cancelled" &&
    toState !== "refunded" &&
    deliveryClass !== "inactive_not_sellable" &&
    deliveryClass !== "internal_only"
  ) {
    if (!evidence.paymentConfirmed) {
      missing.push("paymentConfirmed");
    }
  }

  // ── Entitlement required before artifact or access steps ──────────────────
  if (
    toState === "internal_records_created" ||
    toState === "draft_created" ||
    toState === "admin_preview_ready" ||
    toState === "awaiting_operator_review" ||
    toState === "approved_for_delivery" ||
    toState === "customer_access_created" ||
    toState === "customer_notified" ||
    toState === "delivered"
  ) {
    if (!evidence.entitlementId) {
      missing.push("entitlementId");
    }
  }

  // ── Artifact required for review and delivery steps ───────────────────────
  if (
    toState === "admin_preview_ready" ||
    toState === "awaiting_operator_review" ||
    toState === "approved_for_delivery" ||
    toState === "customer_access_created"
  ) {
    if (!evidence.artifactId) {
      missing.push("artifactId");
    }
    // For manual_review_required, artifact must be READY or READY_FOR_DELIVERY
    if (
      deliveryClass === "manual_review_required" &&
      (toState === "approved_for_delivery" || toState === "customer_access_created")
    ) {
      const readyStatuses = ["READY", "READY_FOR_DELIVERY"];
      if (!evidence.artifactStatus || !readyStatuses.includes(evidence.artifactStatus)) {
        missing.push("artifactStatus:READY_or_READY_FOR_DELIVERY");
      }
    }
  }

  // ── Operator approval required before customer access ─────────────────────
  if (
    deliveryClass === "manual_review_required" &&
    (toState === "approved_for_delivery" || toState === "customer_access_created" || toState === "customer_notified" || toState === "delivered")
  ) {
    if (!evidence.operatorApproved) {
      missing.push("operatorApproved");
    }
  }

  // ── Access link required before delivery ──────────────────────────────────
  if (toState === "delivered") {
    if (!evidence.accessLinkCreated) {
      missing.push("accessLinkCreated");
    }
  }

  if (missing.length === 0) {
    return { allowed: true, reason: "All evidence gates passed.", missingEvidence: [] };
  }

  return {
    allowed: false,
    reason: `Transition ${fromState} → ${toState} blocked. Missing: ${missing.join(", ")}.`,
    missingEvidence: missing,
  };
}

/**
 * Get all unsafe admin actions for a given context.
 * Returns messages for actions that should be disabled.
 */
export function getUnsafeAdminActions(
  currentState: UniversalFulfilmentState,
  context: FulfilmentEvidenceContext,
): string[] {
  const unsafe: string[] = [];

  // Check "Mark Delivered" readiness
  if (!isTransitionAllowed(currentState, "delivered", context)) {
    const reason = getBlockingReason(currentState, "delivered", context);
    unsafe.push(reason ?? "Cannot mark delivered: required evidence is missing.");
  }

  // Check "Approve for Delivery" readiness
  if (!isTransitionAllowed(currentState, "approved_for_delivery", context)) {
    const reason = getBlockingReason(currentState, "approved_for_delivery", context);
    unsafe.push(reason ?? "Cannot approve: required evidence is missing.");
  }

  // Check "Generate Customer Access" readiness
  if (!isTransitionAllowed(currentState, "customer_access_created", context)) {
    const reason = getBlockingReason(currentState, "customer_access_created", context);
    unsafe.push(reason ?? "Cannot generate customer access: required evidence is missing.");
  }

  return unsafe;
}

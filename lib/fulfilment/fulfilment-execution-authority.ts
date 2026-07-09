/**
 * lib/fulfilment/fulfilment-execution-authority.ts
 *
 * PR F — Runtime Fulfilment Execution Authority.
 *
 * The single runtime layer that resolves:
 *   canonical product identity
 *       ↓
 *   fulfilment contract
 *       ↓
 *   assurance policy
 *       ↓
 *   runtime handler
 *       ↓
 *   existing domain model
 *       ↓
 *   next valid transition
 *
 * This is NOT a static registry. It is a runtime execution authority that
 * resolves the correct handler for a given product and fulfilment context.
 *
 * Rules:
 * - Reuses existing domain models (BoardroomBriefOrder, ProductArtifact,
 *   ExecutiveReportingRun, ClientEntitlement, etc.)
 * - Does NOT create parallel order or artifact systems.
 * - Does NOT duplicate the contract registry (product-fulfilment-contract.ts)
 *   or assurance policy (product-fulfilment-assurance.ts).
 * - Does NOT perform Stripe writes, catalogue changes, or governance changes.
 */

import { getContractByProductCode, type ProductFulfilmentContract } from "@/lib/product/product-fulfilment-contract";
import { getAssuranceByProductCode, type ProductFulfilmentAssurance, type ProductDeliveryClass } from "@/lib/product/product-fulfilment-assurance";
import { prisma } from "@/lib/prisma.server";

// ── Types ──────────────────────────────────────────────────────────────────

export type FulfilmentOperation =
  | "initiate"
  | "resume"
  | "validate_output"
  | "deliver"
  | "inspect";

export type FulfilmentContext = {
  productCode: string;
  operation: FulfilmentOperation;
  /** The source order/obligation ID (e.g., BoardroomBriefOrder.id, ExecutiveReportingRun.id) */
  sourceId?: string;
  /** The source model type (e.g., "boardroom_brief_order", "executive_report") */
  sourceType?: string;
  /** Checkout Session ID if initiating from payment */
  checkoutSessionId?: string;
  /** Email of the customer */
  email?: string;
  /** User ID if known */
  userId?: string;
};

export type FulfilmentResult = {
  ok: boolean;
  state?: string;
  nextAction?: string;
  error?: string;
  details?: Record<string, unknown>;
};

export type OutputValidationResult = {
  ok: boolean;
  validated: boolean;
  errors: string[];
  warnings: string[];
  humanReviewRequired: boolean;
};

export type DeliveryResult = {
  ok: boolean;
  delivered: boolean;
  deliveryMethod?: string;
  deliveryProof?: string;
  error?: string;
};

export type FulfilmentState = {
  productCode: string;
  deliveryClass: ProductDeliveryClass;
  contract: ProductFulfilmentContract | null;
  assurance: ProductFulfilmentAssurance | null;
  obligationState: string;
  generationState: string | null;
  outputValidationState: string | null;
  deliveryState: string | null;
  deliveryProofState: string | null;
  blocker: string | null;
  nextAction: string;
  retryable: boolean;
  customerVisible: boolean;
  adminVisible: boolean;
};

// ── Canonical fulfilment states ────────────────────────────────────────────

export const FULFILMENT_STATES = {
  PAYMENT_CONFIRMED: "PAYMENT_CONFIRMED",
  OBLIGATION_CREATED: "OBLIGATION_CREATED",
  ENTITLEMENT_GRANTED: "ENTITLEMENT_GRANTED",
  FULFILMENT_QUEUED: "FULFILMENT_QUEUED",
  AWAITING_CUSTOMER_INPUT: "AWAITING_CUSTOMER_INPUT",
  AWAITING_OPERATOR_REVIEW: "AWAITING_OPERATOR_REVIEW",
  IN_PROGRESS: "IN_PROGRESS",
  OUTPUT_GENERATED: "OUTPUT_GENERATED",
  OUTPUT_VALIDATED: "OUTPUT_VALIDATED",
  DELIVERY_PENDING: "DELIVERY_PENDING",
  DELIVERED: "DELIVERED",
  FAILED_RETRYABLE: "FAILED_RETRYABLE",
  FAILED_PERMANENT: "FAILED_PERMANENT",
  MANUAL_REVIEW: "MANUAL_REVIEW",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;

export type CanonicalFulfilmentState = typeof FULFILMENT_STATES[keyof typeof FULFILMENT_STATES];

// ── Fulfilment handler interface ───────────────────────────────────────────

export interface FulfilmentHandler {
  productCode: string;
  deliveryClass: ProductDeliveryClass;

  /** Initiate fulfilment after payment is confirmed */
  initiate(context: FulfilmentContext): Promise<FulfilmentResult>;

  /** Resume a stalled or failed fulfilment */
  resume(context: FulfilmentContext): Promise<FulfilmentResult>;

  /** Validate the generated output before delivery */
  validateOutput(context: FulfilmentContext): Promise<OutputValidationResult>;

  /** Deliver the output to the customer */
  deliver(context: FulfilmentContext): Promise<DeliveryResult>;

  /** Inspect the current fulfilment state */
  inspect(context: FulfilmentContext): Promise<FulfilmentState>;
}

// ── Handler registry ───────────────────────────────────────────────────────

const _handlers = new Map<string, FulfilmentHandler>();

export function registerHandler(handler: FulfilmentHandler): void {
  _handlers.set(handler.productCode, handler);
}

export function getHandler(productCode: string): FulfilmentHandler | undefined {
  return _handlers.get(productCode);
}

export function getAllHandlers(): FulfilmentHandler[] {
  return Array.from(_handlers.values());
}

// ── Runtime resolver ───────────────────────────────────────────────────────

/**
 * Resolve the fulfilment execution path for a product.
 * Returns the contract, assurance policy, and handler (if registered).
 */
export function resolveFulfilmentExecution(productCode: string): {
  contract: ProductFulfilmentContract | undefined;
  assurance: ProductFulfilmentAssurance | undefined;
  handler: FulfilmentHandler | undefined;
} {
  return {
    contract: getContractByProductCode(productCode),
    assurance: getAssuranceByProductCode(productCode),
    handler: getHandler(productCode),
  };
}

/**
 * Execute a fulfilment operation through the correct handler.
 * Returns a structured result or error if no handler is registered.
 */
export async function executeFulfilmentOperation(
  context: FulfilmentContext,
): Promise<FulfilmentResult | OutputValidationResult | DeliveryResult | FulfilmentState> {
  const { handler, contract, assurance } = resolveFulfilmentExecution(context.productCode);

  if (!contract) {
    return { ok: false, error: `No fulfilment contract found for product: ${context.productCode}` };
  }

  if (!handler) {
    return { ok: false, error: `No fulfilment handler registered for product: ${context.productCode}. Delivery class: ${assurance?.deliveryClass ?? "unknown"}` };
  }

  switch (context.operation) {
    case "initiate":
      return handler.initiate(context);
    case "resume":
      return handler.resume(context);
    case "validate_output":
      return handler.validateOutput(context);
    case "deliver":
      return handler.deliver(context);
    case "inspect":
      return handler.inspect(context);
    default:
      return { ok: false, error: `Unknown operation: ${context.operation}` };
  }
}

// ── State normalisation ────────────────────────────────────────────────────

/**
 * Normalise domain-specific states into canonical fulfilment states.
 * This maps existing domain model statuses without erasing domain meaning.
 */
export function normaliseFulfilmentState(
  productCode: string,
  domainStates: {
    paymentStatus?: string | null;
    entitlementStatus?: string | null;
    generationStatus?: string | null;
    deliveryStatus?: string | null;
    reviewStatus?: string | null;
    orderStatus?: string | null;
  },
): CanonicalFulfilmentState {
  const { paymentStatus, entitlementStatus, generationStatus, deliveryStatus, reviewStatus, orderStatus } = domainStates;

  // Terminal states
  if (paymentStatus === "refunded" || orderStatus === "refunded") return FULFILMENT_STATES.REFUNDED;
  if (orderStatus === "cancelled" || paymentStatus === "cancelled") return FULFILMENT_STATES.CANCELLED;

  // Delivery complete
  if (deliveryStatus === "delivered" || deliveryStatus === "DELIVERED") return FULFILMENT_STATES.DELIVERED;

  // Output validated, pending delivery
  if (generationStatus === "READY" || generationStatus === "READY_FOR_DELIVERY") return FULFILMENT_STATES.DELIVERY_PENDING;

  // Output generated, needs validation
  if (generationStatus === "DRAFT" || generationStatus === "AWAITING_REVIEW" || generationStatus === "generated") {
    return FULFILMENT_STATES.OUTPUT_GENERATED;
  }

  // In progress
  if (generationStatus === "GENERATING" || generationStatus === "in_progress") return FULFILMENT_STATES.IN_PROGRESS;

  // Awaiting operator
  if (reviewStatus === "in_review" || reviewStatus === "UNDER_REVIEW") return FULFILMENT_STATES.AWAITING_OPERATOR_REVIEW;

  // Awaiting customer
  if (reviewStatus === "AWAITING_CUSTOMER" || generationStatus === "AWAITING_CUSTOMER_INPUT") {
    return FULFILMENT_STATES.AWAITING_CUSTOMER_INPUT;
  }

  // Queued for fulfilment
  if (paymentStatus === "paid" && generationStatus === "pending") return FULFILMENT_STATES.FULFILMENT_QUEUED;

  // Entitlement granted
  if (entitlementStatus === "active" || entitlementStatus === "granted") return FULFILMENT_STATES.ENTITLEMENT_GRANTED;

  // Obligation created
  if (paymentStatus === "paid") return FULFILMENT_STATES.OBLIGATION_CREATED;

  // Payment confirmed
  if (paymentStatus === "paid" || paymentStatus === "completed") return FULFILMENT_STATES.PAYMENT_CONFIRMED;

  // Failure states
  if (paymentStatus === "failed" || generationStatus === "FAILED") return FULFILMENT_STATES.FAILED_PERMANENT;
  if (deliveryStatus === "failed" || deliveryStatus === "FAILED") return FULFILMENT_STATES.FAILED_RETRYABLE;

  // Default
  return FULFILMENT_STATES.PAYMENT_CONFIRMED;
}

// ── Fulfilment idempotency ─────────────────────────────────────────────────

/**
 * Build a deterministic fulfilment identity key.
 * This prevents duplicate fulfilment initiation from duplicate events.
 */
export function buildFulfilmentIdentityKey(context: {
  productCode: string;
  checkoutSessionId?: string;
  sourceId?: string;
  email?: string;
}): string {
  // Order of precedence: sourceId > checkoutSessionId > email+productCode
  if (context.sourceId) return `fulfilment::${context.productCode}::${context.sourceId}`;
  if (context.checkoutSessionId) return `fulfilment::${context.productCode}::${context.checkoutSessionId}`;
  if (context.email) return `fulfilment::${context.productCode}::${context.email}`;
  return `fulfilment::${context.productCode}::unknown`;
}

// ── Delivery proof contract ────────────────────────────────────────────────

export type DeliveryProof = {
  productCode: string;
  deliveryClass: ProductDeliveryClass;
  sourceId: string;
  customerEmail: string | null;
  /** The actual delivery mechanism used */
  deliveryMechanism: string;
  /** Evidence of delivery (e.g., email send record, admin action timestamp, access log) */
  proofEvidence: string;
  /** When delivery was recorded */
  deliveredAt: string;
  /** Whether delivery is independently verifiable */
  independentlyVerifiable: boolean;
  /** Whether the customer has confirmed receipt */
  customerConfirmed: boolean;
};

// ── Output validation contract ─────────────────────────────────────────────

export type OutputValidationContract = {
  productCode: string;
  expectedOutputType: string;
  requiredFields: string[];
  minimumCompletenessConditions: string[];
  evidenceSourceRequirements: string[];
  prohibitedStates: string[];
  humanReviewRequired: boolean;
  deliveryEligibilityRule: string;
};

const OUTPUT_VALIDATION_CONTRACTS = new Map<string, OutputValidationContract>();

export function registerOutputValidationContract(contract: OutputValidationContract): void {
  OUTPUT_VALIDATION_CONTRACTS.set(contract.productCode, contract);
}

export function getOutputValidationContract(productCode: string): OutputValidationContract | undefined {
  return OUTPUT_VALIDATION_CONTRACTS.get(productCode);
}

export function getAllOutputValidationContracts(): OutputValidationContract[] {
  return Array.from(OUTPUT_VALIDATION_CONTRACTS.values());
}

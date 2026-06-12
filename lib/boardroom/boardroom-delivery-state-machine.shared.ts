/**
 * lib/boardroom/boardroom-delivery-state-machine.shared.ts
 *
 * CLIENT-SAFE Boardroom delivery state machine — shared types, validators, and helpers.
 *
 * This file must NOT import:
 *   - server-only
 *   - governance-event-bus
 *   - auditLogger
 *   - prisma
 *   - requireAdminServer
 *   - NextApiRequest / NextApiResponse
 *   - email sender
 *   - any server-only service
 *
 * It is safe for use in Pages Router pages (React components).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type BoardroomDeliveryStatus =
  | "paid"
  | "case_stubs_created"
  | "draft_generated"
  | "awaiting_operator_review"
  | "approved_for_delivery"
  | "customer_access_ready"
  | "delivered"
  | "blocked"
  | "failed";

export type BoardroomArtifactStatus =
  | "PENDING"
  | "DRAFT"
  | "AWAITING_REVIEW"
  | "READY"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "REVOKED";

export type BoardroomArtifactDeliveryStatus =
  | "PENDING"
  | "AWAITING_REVIEW"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";

export type BoardroomAuditEvent =
  | "boardroom_order_paid"
  | "boardroom_case_stubs_created"
  | "boardroom_draft_generated"
  | "boardroom_operator_review_started"
  | "boardroom_draft_approved"
  | "boardroom_customer_access_created"
  | "boardroom_delivered"
  | "boardroom_delivery_failed"
  | "boardroom_delivery_blocked";

// ─── State Machine ────────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<BoardroomDeliveryStatus, BoardroomDeliveryStatus[]> = {
  paid: ["case_stubs_created", "blocked", "failed"],
  case_stubs_created: ["draft_generated", "blocked", "failed"],
  draft_generated: ["awaiting_operator_review", "blocked", "failed"],
  awaiting_operator_review: ["approved_for_delivery", "draft_generated", "blocked", "failed"],
  approved_for_delivery: ["customer_access_ready", "draft_generated", "blocked", "failed"],
  customer_access_ready: ["delivered", "blocked", "failed"],
  delivered: ["blocked", "failed"],
  blocked: [],
  failed: [],
};

const AUDIT_EVENT_MAP: Record<string, BoardroomAuditEvent> = {
  paid: "boardroom_order_paid",
  case_stubs_created: "boardroom_case_stubs_created",
  draft_generated: "boardroom_draft_generated",
  awaiting_operator_review: "boardroom_operator_review_started",
  approved_for_delivery: "boardroom_draft_approved",
  customer_access_ready: "boardroom_customer_access_created",
  delivered: "boardroom_delivered",
  failed: "boardroom_delivery_failed",
  blocked: "boardroom_delivery_blocked",
};

// ─── Human-readable labels ────────────────────────────────────────────────────

export const DELIVERY_STATUS_LABELS: Record<BoardroomDeliveryStatus, string> = {
  paid: "Paid — awaiting stub creation",
  case_stubs_created: "Stubs created — awaiting draft generation",
  draft_generated: "Draft generated — awaiting operator review",
  awaiting_operator_review: "Awaiting operator review",
  approved_for_delivery: "Approved for delivery — generate customer access",
  customer_access_ready: "Customer access ready — release to customer",
  delivered: "Delivered",
  blocked: "Blocked",
  failed: "Failed",
};

export const DELIVERY_STATUS_COLORS: Record<BoardroomDeliveryStatus, string> = {
  paid: "#f87171",
  case_stubs_created: "#60a5fa",
  draft_generated: "#c9a96e",
  awaiting_operator_review: "#fbbf24",
  approved_for_delivery: "#4ade80",
  customer_access_ready: "#4ade80",
  delivered: "#4ade80",
  blocked: "#ef4444",
  failed: "#ef4444",
};

// ─── Validation ───────────────────────────────────────────────────────────────

export function isValidTransition(
  current: string,
  next: string,
): boolean {
  const allowed = VALID_TRANSITIONS[current as BoardroomDeliveryStatus];
  if (!allowed) return false;
  return allowed.includes(next as BoardroomDeliveryStatus);
}

export function assertValidTransition(
  current: string,
  next: string,
  orderId: string,
): void {
  if (!isValidTransition(current, next)) {
    const allowed = VALID_TRANSITIONS[current as BoardroomDeliveryStatus] ?? [];
    throw new Error(
      `INVALID_TRANSITION: Cannot move BoardroomBriefOrder ${orderId} from "${current}" to "${next}". ` +
      `Allowed transitions from "${current}": ${allowed.join(", ") || "none (terminal state)"}`,
    );
  }
}

// ─── Delivery Readiness Checks ────────────────────────────────────────────────

export interface DeliveryReadinessCheck {
  check: string;
  passed: boolean;
  detail: string;
}

export function checkDeliveryReadiness(params: {
  deliveryStatus: string;
  artifactStatus: string | null;
  artifactDeliveryStatus: string | null;
  adminPreviewUrl: string | null;
  customerAccessUrl: string | null;
  customerEmail: string | null;
  deliveredAt: Date | null;
}): { ready: boolean; checks: DeliveryReadinessCheck[] } {
  const checks: DeliveryReadinessCheck[] = [];

  // 1. ProductArtifact must exist and be in a deliverable state
  checks.push({
    check: "ProductArtifact exists and is READY or READY_FOR_DELIVERY",
    passed: params.artifactStatus === "READY" || params.artifactStatus === "READY_FOR_DELIVERY",
    detail: params.artifactStatus
      ? `Artifact status is "${params.artifactStatus}"`
      : "No ProductArtifact found",
  });

  // 2. adminPreviewUrl must exist
  checks.push({
    check: "adminPreviewUrl is populated",
    passed: !!params.adminPreviewUrl,
    detail: params.adminPreviewUrl ? "adminPreviewUrl exists" : "adminPreviewUrl is null or empty",
  });

  // 3. customerAccessUrl must exist for delivery
  checks.push({
    check: "customerAccessUrl is populated",
    passed: !!params.customerAccessUrl,
    detail: params.customerAccessUrl ? "customerAccessUrl exists" : "customerAccessUrl is null or empty",
  });

  // 4. Customer email must exist
  checks.push({
    check: "Customer email is present",
    passed: !!params.customerEmail,
    detail: params.customerEmail ? `Email: ${params.customerEmail}` : "No customer email",
  });

  // 5. Not already delivered
  checks.push({
    check: "Not already delivered",
    passed: params.deliveryStatus !== "delivered",
    detail: params.deliveryStatus === "delivered" ? "Already marked as delivered" : `Current status: ${params.deliveryStatus}`,
  });

  const ready = checks.every((c) => c.passed);

  return { ready, checks };
}

// ─── Legacy Status Mapping ────────────────────────────────────────────────────

/**
 * Map legacy delivery status values to the new state machine.
 * Used during migration to interpret existing orders.
 */
export function mapLegacyStatus(legacyStatus: string): BoardroomDeliveryStatus {
  switch (legacyStatus) {
    case "requested":
    case "paid":
      return "paid";
    case "in_review":
      return "awaiting_operator_review";
    case "dossier_generated":
      return "draft_generated";
    case "delivered":
      return "delivered";
    case "follow_up_due":
      return "delivered";
    case "blocked":
      return "blocked";
    case "failed":
      return "failed";
    default:
      return "paid";
  }
}

/**
 * Map new state machine status back to legacy values for backward compatibility.
 */
export function toLegacyStatus(status: BoardroomDeliveryStatus): string {
  switch (status) {
    case "paid":
    case "case_stubs_created":
      return "paid";
    case "draft_generated":
    case "awaiting_operator_review":
      return "in_review";
    case "approved_for_delivery":
    case "customer_access_ready":
      return "dossier_generated";
    case "delivered":
      return "delivered";
    case "blocked":
      return "blocked";
    case "failed":
      return "failed";
  }
}

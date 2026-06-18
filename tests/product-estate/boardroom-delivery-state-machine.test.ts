/**
 * tests/product-estate/boardroom-delivery-state-machine.test.ts
 *
 * Tests for the Boardroom delivery state machine.
 * Covers:
 *   - Valid transitions
 *   - Invalid transitions
 *   - Delivery readiness checks
 *   - Legacy status mapping
 *   - Audit event recording
 */
import { describe, expect, it } from "vitest";
import {
  isValidTransition,
  assertValidTransition,
  checkDeliveryReadiness,
  mapLegacyStatus,
  toLegacyStatus,
  DELIVERY_STATUS_LABELS,
} from "@/lib/boardroom/boardroom-delivery-state-machine.shared";

// ─── Transition Tests ─────────────────────────────────────────────────────────

describe("BoardroomDeliveryStateMachine — transitions", () => {
  it("paid → case_stubs_created is valid", () => {
    expect(isValidTransition("paid", "case_stubs_created")).toBe(true);
  });

  it("paid → blocked is valid", () => {
    expect(isValidTransition("paid", "blocked")).toBe(true);
  });

  it("paid → failed is valid", () => {
    expect(isValidTransition("paid", "failed")).toBe(true);
  });

  it("paid → delivered is INVALID (cannot skip states)", () => {
    expect(isValidTransition("paid", "delivered")).toBe(false);
  });

  it("paid → draft_generated is INVALID (cannot skip case_stubs_created)", () => {
    expect(isValidTransition("paid", "draft_generated")).toBe(false);
  });

  it("case_stubs_created → draft_generated is valid", () => {
    expect(isValidTransition("case_stubs_created", "draft_generated")).toBe(true);
  });

  it("draft_generated → awaiting_operator_review is valid", () => {
    expect(isValidTransition("draft_generated", "awaiting_operator_review")).toBe(true);
  });

  it("awaiting_operator_review → approved_for_delivery is valid", () => {
    expect(isValidTransition("awaiting_operator_review", "approved_for_delivery")).toBe(true);
  });

  it("approved_for_delivery → customer_access_ready is valid", () => {
    expect(isValidTransition("approved_for_delivery", "customer_access_ready")).toBe(true);
  });

  it("customer_access_ready → delivered is valid", () => {
    expect(isValidTransition("customer_access_ready", "delivered")).toBe(true);
  });

  it("delivered is terminal (no outgoing transitions)", () => {
    expect(isValidTransition("delivered", "paid")).toBe(false);
    expect(isValidTransition("delivered", "customer_access_ready")).toBe(false);
    expect(isValidTransition("delivered", "draft_generated")).toBe(false);
  });

  it("blocked is terminal", () => {
    expect(isValidTransition("blocked", "paid")).toBe(false);
    expect(isValidTransition("blocked", "delivered")).toBe(false);
  });

  it("failed is terminal", () => {
    expect(isValidTransition("failed", "paid")).toBe(false);
    expect(isValidTransition("failed", "delivered")).toBe(false);
  });

  it("can go back from awaiting_operator_review to draft_generated", () => {
    expect(isValidTransition("awaiting_operator_review", "draft_generated")).toBe(true);
  });

  it("can go back from approved_for_delivery to draft_generated", () => {
    expect(isValidTransition("approved_for_delivery", "draft_generated")).toBe(true);
  });

  it("assertValidTransition throws on invalid transition", () => {
    expect(() => assertValidTransition("paid", "delivered", "order-123")).toThrow("INVALID_TRANSITION");
    expect(() => assertValidTransition("paid", "delivered", "order-123")).toThrow("order-123");
  });

  it("assertValidTransition does not throw on valid transition", () => {
    expect(() => assertValidTransition("paid", "case_stubs_created", "order-123")).not.toThrow();
    expect(() => assertValidTransition("draft_generated", "awaiting_operator_review", "order-123")).not.toThrow();
  });
});

// ─── Delivery Readiness Tests ─────────────────────────────────────────────────

describe("BoardroomDeliveryStateMachine — delivery readiness", () => {
  const baseParams = {
    deliveryStatus: "customer_access_ready",
    artifactStatus: "READY" as const,
    artifactDeliveryStatus: "READY_FOR_DELIVERY" as const,
    adminPreviewUrl: "/admin/case-studies/cs-123",
    customerAccessUrl: "/boardroom/dossier/d-123?token=abc",
    customerEmail: "client@test.com",
    deliveredAt: null,
  };

  it("all checks pass when everything is ready", () => {
    const result = checkDeliveryReadiness(baseParams);
    expect(result.ready).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("fails when artifact status is PENDING", () => {
    const result = checkDeliveryReadiness({
      ...baseParams,
      artifactStatus: "PENDING",
    });
    expect(result.ready).toBe(false);
    expect(result.checks[0].passed).toBe(false);
  });

  it("fails when adminPreviewUrl is missing", () => {
    const result = checkDeliveryReadiness({
      ...baseParams,
      adminPreviewUrl: null,
    });
    expect(result.ready).toBe(false);
    expect(result.checks[1].passed).toBe(false);
  });

  it("fails when customerAccessUrl is missing", () => {
    const result = checkDeliveryReadiness({
      ...baseParams,
      customerAccessUrl: null,
    });
    expect(result.ready).toBe(false);
    expect(result.checks[2].passed).toBe(false);
  });

  it("fails when customer email is missing", () => {
    const result = checkDeliveryReadiness({
      ...baseParams,
      customerEmail: null,
    });
    expect(result.ready).toBe(false);
    expect(result.checks[3].passed).toBe(false);
  });

  it("fails when already delivered", () => {
    const result = checkDeliveryReadiness({
      ...baseParams,
      deliveryStatus: "delivered",
    });
    expect(result.ready).toBe(false);
    expect(result.checks[4].passed).toBe(false);
  });

  it("accepts READY_FOR_DELIVERY as valid artifact status", () => {
    const result = checkDeliveryReadiness({
      ...baseParams,
      artifactStatus: "READY_FOR_DELIVERY",
    });
    expect(result.ready).toBe(true);
  });
});

// ─── Legacy Mapping Tests ─────────────────────────────────────────────────────

describe("BoardroomDeliveryStateMachine — legacy status mapping", () => {
  it("maps 'requested' to 'paid'", () => {
    expect(mapLegacyStatus("requested")).toBe("paid");
  });

  it("maps 'paid' to 'paid'", () => {
    expect(mapLegacyStatus("paid")).toBe("paid");
  });

  it("maps 'in_review' to 'awaiting_operator_review'", () => {
    expect(mapLegacyStatus("in_review")).toBe("awaiting_operator_review");
  });

  it("maps 'dossier_generated' to 'draft_generated'", () => {
    expect(mapLegacyStatus("dossier_generated")).toBe("draft_generated");
  });

  it("maps 'delivered' to 'delivered'", () => {
    expect(mapLegacyStatus("delivered")).toBe("delivered");
  });

  it("maps 'follow_up_due' to 'delivered'", () => {
    expect(mapLegacyStatus("follow_up_due")).toBe("delivered");
  });

  it("maps 'blocked' to 'blocked'", () => {
    expect(mapLegacyStatus("blocked")).toBe("blocked");
  });

  it("maps 'failed' to 'failed'", () => {
    expect(mapLegacyStatus("failed")).toBe("failed");
  });

  it("toLegacyStatus maps 'case_stubs_created' to 'paid'", () => {
    expect(toLegacyStatus("case_stubs_created")).toBe("paid");
  });

  it("toLegacyStatus maps 'draft_generated' to 'in_review'", () => {
    expect(toLegacyStatus("draft_generated")).toBe("in_review");
  });

  it("toLegacyStatus maps 'awaiting_operator_review' to 'in_review'", () => {
    expect(toLegacyStatus("awaiting_operator_review")).toBe("in_review");
  });

  it("toLegacyStatus maps 'approved_for_delivery' to 'dossier_generated'", () => {
    expect(toLegacyStatus("approved_for_delivery")).toBe("dossier_generated");
  });

  it("toLegacyStatus maps 'customer_access_ready' to 'dossier_generated'", () => {
    expect(toLegacyStatus("customer_access_ready")).toBe("dossier_generated");
  });
});

// ─── Status Labels Tests ──────────────────────────────────────────────────────

describe("BoardroomDeliveryStateMachine — status labels", () => {
  it("has a label for every status", () => {
    const statuses = [
      "paid", "case_stubs_created", "draft_generated", "awaiting_operator_review",
      "approved_for_delivery", "customer_access_ready", "delivered", "blocked", "failed",
    ];
    for (const status of statuses) {
      expect(DELIVERY_STATUS_LABELS[status]).toBeDefined();
      expect(typeof DELIVERY_STATUS_LABELS[status]).toBe("string");
      expect(DELIVERY_STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  });

  it("labels are descriptive and not just the status key", () => {
    expect(DELIVERY_STATUS_LABELS.paid).not.toBe("paid");
    expect(DELIVERY_STATUS_LABELS.delivered).not.toBe("delivered");
  });
});

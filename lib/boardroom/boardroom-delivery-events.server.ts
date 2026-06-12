/**
 * lib/boardroom/boardroom-delivery-events.server.ts
 *
 * SERVER-ONLY Boardroom delivery event recording.
 *
 * This file imports "server-only" and the governance event bus.
 * It must only be imported by API routes / server code — never by Pages Router pages.
 */

import "server-only";

import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";

// ─── Audit Event Map ──────────────────────────────────────────────────────────

const AUDIT_EVENT_MAP: Record<string, string> = {
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

// ─── Event Recording ──────────────────────────────────────────────────────────

export async function recordBoardroomDeliveryEvent(params: {
  orderId: string;
  fromStatus: string;
  toStatus: string;
  actorEmail: string;
  note?: string;
}): Promise<void> {
  const auditEvent = AUDIT_EVENT_MAP[params.toStatus];
  if (!auditEvent) {
    console.warn(`[BOARDROOM_DELIVERY_STATE] No audit event mapped for status: ${params.toStatus}`);
    return;
  }

  await routeGovernanceEvent({
    eventType: auditEvent.toUpperCase().replace(/\s+/g, "_"),
    sourceSurface: "boardroom-mode",
    canonicalRecordType: "BoardroomBriefOrder",
    canonicalRecordId: params.orderId,
    actorEmail: params.actorEmail,
    severity: params.toStatus === "delivered" ? "HIGH" : params.toStatus === "blocked" || params.toStatus === "failed" ? "HIGH" : "MEDIUM",
    payload: {
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      note: params.note ?? null,
    },
    shouldWriteAudit: true,
    shouldWriteLineage: true,
  });
}

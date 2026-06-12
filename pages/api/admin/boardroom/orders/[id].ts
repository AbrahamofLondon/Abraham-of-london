/**
 * pages/api/admin/boardroom/orders/[id].ts
 *
 * GET  — single Boardroom Brief order with all stubs and audit trail
 * PATCH — update deliveryStatus using governed state machine
 *
 * Admin-guarded. Delivery requires a separate governed delivery flow —
 * use the /deliver endpoint for controlled delivery.
 *
 * State machine (governed):
 *   paid → case_stubs_created → draft_generated → awaiting_operator_review
 *   → approved_for_delivery → customer_access_ready → delivered
 *
 * Legacy status values are mapped to the new state machine:
 *   "in_review" → "awaiting_operator_review"
 *   "dossier_generated" → "draft_generated"
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import {
  assertValidTransition,
  mapLegacyStatus,
  toLegacyStatus,
  type BoardroomDeliveryStatus,
} from "@/lib/boardroom/boardroom-delivery-state-machine.shared";
import { recordBoardroomDeliveryEvent } from "@/lib/boardroom/boardroom-delivery-events.server";

// Legacy transition map for backward compatibility
const LEGACY_TRANSITIONS: Record<string, string[]> = {
  requested: ["in_review", "paid"],
  paid: ["in_review", "case_stubs_created"],
  in_review: ["dossier_generated", "draft_generated"],
  dossier_generated: ["delivered"],
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminServer(req, res, { routeKey: "admin-boardroom-order-detail" });
  if (!session) return;

  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ ok: false, error: "INVALID_ID" });

  if (req.method === "GET") {
    return handleGet(id, res);
  }
  if (req.method === "PATCH") {
    return handlePatch(id, req, res, session.user?.email ?? "admin");
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
}

async function handleGet(id: string, res: NextApiResponse) {
  try {
    const order = await prisma.boardroomBriefOrder.findUnique({
      where: { id },
    });

    if (!order) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    const [artifact, falsification, hypothesis, entitlement, auditLogs] = await Promise.all([
      prisma.productArtifact.findFirst({
        where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: id },
      }),
      prisma.falsificationEntry.findFirst({
        where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: id },
      }),
      prisma.outcomeHypothesis.findFirst({
        where: { sourceRunId: id },
      }),
      prisma.clientEntitlement.findFirst({
        where: { email: order.email, productCode: "boardroom-brief" },
        orderBy: { createdAt: "desc" },
        select: { productCode: true, tier: true, createdAt: true },
      }),
      prisma.accessAuditLog.findMany({
        where: { targetKey: id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }).catch(() => []),
    ]);

    const meta = (order.metadata as Record<string, unknown> | null) ?? {};
    const proofMode = meta.proofMode === "true" || meta.proofMode === true;
    const deliveryDeadline = new Date(order.createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString();

    // Map legacy status to new state machine for response
    const mappedStatus = mapLegacyStatus(order.deliveryStatus);

    return res.status(200).json({
      ok: true,
      order: {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        deliveredAt: order.deliveredAt?.toISOString() ?? null,
        proofMode,
        deliveryDeadline,
        mappedStatus, // New state machine status
        statusLabel: mappedStatus, // For backward compat
      },
      artifact: artifact
        ? { ...artifact, createdAt: artifact.createdAt.toISOString(), updatedAt: artifact.updatedAt.toISOString() }
        : null,
      falsification: falsification
        ? { ...falsification, createdAt: falsification.createdAt.toISOString(), updatedAt: falsification.updatedAt.toISOString() }
        : null,
      hypothesis: hypothesis
        ? { ...hypothesis, createdAt: hypothesis.createdAt.toISOString(), updatedAt: hypothesis.updatedAt.toISOString() }
        : null,
      entitlement: entitlement
        ? { ...entitlement, createdAt: entitlement.createdAt.toISOString() }
        : null,
      auditLogs: auditLogs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[admin-boardroom-order-get]", error);
    return res.status(500).json({ ok: false, error: "FETCH_FAILED" });
  }
}

async function handlePatch(id: string, req: NextApiRequest, res: NextApiResponse, adminEmail: string) {
  const { nextStatus } = req.body || {};
  if (typeof nextStatus !== "string") {
    return res.status(400).json({ ok: false, error: "NEXT_STATUS_REQUIRED" });
  }

  try {
    const order = await prisma.boardroomBriefOrder.findUnique({
      where: { id },
      select: { id: true, deliveryStatus: true },
    });

    if (!order) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    const currentStatus = order.deliveryStatus;

    // Try the new state machine first, fall back to legacy transitions
    let transitionValid = false;

    try {
      assertValidTransition(currentStatus, nextStatus, id);
      transitionValid = true;
    } catch {
      // Check legacy transitions
      const allowed = LEGACY_TRANSITIONS[currentStatus] ?? [];
      transitionValid = allowed.includes(nextStatus);
    }

    if (!transitionValid) {
      // Build allowed list from both state machines
      const newAllowed = (() => {
        try {
          const { isValidTransition } = require("@/lib/boardroom/boardroom-delivery-state-machine.shared");
          const allStates: BoardroomDeliveryStatus[] = [
            "paid", "case_stubs_created", "draft_generated", "awaiting_operator_review",
            "approved_for_delivery", "customer_access_ready", "delivered", "blocked", "failed",
          ];
          return allStates.filter((s) => isValidTransition(currentStatus, s));
        } catch { return []; }
      })();

      const legacyAllowed = LEGACY_TRANSITIONS[currentStatus] ?? [];
      const allAllowed = [...new Set([...newAllowed, ...legacyAllowed])];

      return res.status(422).json({
        ok: false,
        error: "INVALID_TRANSITION",
        current: currentStatus,
        requested: nextStatus,
        allowed: allAllowed,
      });
    }

    // Delivery requires a separate governed delivery flow — persist deliveredAt only on "delivered"
    const extra: Record<string, unknown> = {};
    if (nextStatus === "delivered") {
      extra.deliveredAt = new Date();
    }

    const updated = await prisma.boardroomBriefOrder.update({
      where: { id },
      data: { deliveryStatus: nextStatus, ...extra },
      select: { id: true, deliveryStatus: true, deliveredAt: true, updatedAt: true },
    });

    // Record audit event for the transition
    await recordBoardroomDeliveryEvent({
      orderId: id,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      actorEmail: adminEmail,
      note: `Admin transition via PATCH: ${currentStatus} → ${nextStatus}`,
    }).catch((err) => {
      console.warn("[BOARDROOM_DELIVERY_AUDIT_FAILED]", err);
    });

    console.info("[ADMIN_BOARDROOM_ORDER_STATUS_UPDATED]", {
      orderId: id,
      from: currentStatus,
      to: nextStatus,
      by: adminEmail,
    });

    return res.status(200).json({
      ok: true,
      order: {
        ...updated,
        deliveredAt: updated.deliveredAt?.toISOString() ?? null,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[admin-boardroom-order-patch]", error);
    return res.status(500).json({ ok: false, error: "UPDATE_FAILED" });
  }
}
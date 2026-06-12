/**
 * pages/api/admin/boardroom/orders/[id]/approve.ts
 *
 * Approve a Boardroom dossier draft for delivery.
 * Moves the order from draft_generated/awaiting_operator_review → approved_for_delivery.
 *
 * Updates:
 * - ProductArtifact status from DRAFT → READY
 * - ProductArtifact deliveryStatus from AWAITING_REVIEW → READY_FOR_DELIVERY
 * - Records audit trail
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";
import {
  assertValidTransition,
  recordBoardroomDeliveryEvent,
} from "@/lib/boardroom/boardroom-delivery-state-machine";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-boardroom-approve-dossier" });
  if (!session) return;

  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ ok: false, error: "INVALID_ID" });

  try {
    const order = await prisma.boardroomBriefOrder.findUnique({
      where: { id },
      select: { id: true, deliveryStatus: true, metadata: true },
    });

    if (!order) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    // Validate transition: draft_generated or awaiting_operator_review → approved_for_delivery
    assertValidTransition(order.deliveryStatus, "approved_for_delivery", id);

    // Update ProductArtifact
    const artifactId = `pa_boardroom_${id}`;
    await prisma.productArtifact.upsert({
      where: { artifactId },
      create: {
        artifactId,
        productCode: "boardroom-brief",
        sourceEntityType: "boardroom_brief_order",
        sourceEntityId: id,
        status: "READY",
        deliveryStatus: "READY_FOR_DELIVERY",
      },
      update: {
        status: "READY",
        deliveryStatus: "READY_FOR_DELIVERY",
      },
    });

    // Update order status
    const updated = await prisma.boardroomBriefOrder.update({
      where: { id },
      data: {
        deliveryStatus: "approved_for_delivery",
        metadata: {
          ...(order.metadata as Record<string, unknown> ?? {}),
          approvedAt: new Date().toISOString(),
          approvedBy: session.user?.email ?? "admin",
        },
      },
      select: { id: true, deliveryStatus: true, deliveredAt: true, updatedAt: true },
    });

    // Record audit event
    await recordBoardroomDeliveryEvent({
      orderId: id,
      fromStatus: order.deliveryStatus,
      toStatus: "approved_for_delivery",
      actorEmail: session.user?.email ?? "admin",
      note: "Dossier approved for delivery by admin.",
    });

    // Emit governance event
    await routeGovernanceEvent({
      eventType: "BOARDROOM_DOSSIER_APPROVED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomBriefOrder",
      canonicalRecordId: id,
      actorEmail: session.user?.email ?? "admin",
      severity: "HIGH",
      payload: {},
      shouldWriteAudit: true,
      shouldWriteLineage: true,
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
    console.error("[admin-boardroom-approve-dossier]", error);
    const message = error instanceof Error ? error.message : "APPROVAL_FAILED";
    return res.status(422).json({ ok: false, error: message });
  }
}

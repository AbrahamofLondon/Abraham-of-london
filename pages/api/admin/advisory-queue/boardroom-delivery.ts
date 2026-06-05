/* pages/api/admin/advisory-queue/boardroom-delivery.ts — Update Boardroom Brief delivery status */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

type Response = { ok: true } | { ok: false; error: string };

const VALID_STATUSES = ["in_review", "dossier_generated", "delivered", "follow_up_due", "failed", "refunded"];

async function recordBoardroomOrderEvent(input: {
  orderId: string;
  actorEmail?: string | null;
  eventType: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  note?: string | null;
}) {
  await prisma.accessAuditLog.create({
    data: {
      actorType: "ADMIN",
      actorEmail: input.actorEmail ?? null,
      action: "boardroom_brief_order.delivery_status_changed",
      targetType: "boardroom_brief_order",
      targetKey: input.orderId,
      success: true,
      reason: input.eventType,
      metadata: {
        previousStatus: input.previousStatus ?? null,
        newStatus: input.newStatus ?? null,
        note: input.note ?? null,
      },
    },
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-advisory-boardroom-delivery" });
  if (!session) return;

  const { orderId, deliveryStatus, note } = req.body || {};
  if (!orderId || !deliveryStatus || !VALID_STATUSES.includes(deliveryStatus)) {
    return res.status(400).json({ ok: false, error: "INVALID_PARAMS" });
  }

  try {
    const existing = await prisma.boardroomBriefOrder.findUnique({
      where: { id: orderId },
      select: { id: true, deliveryStatus: true },
    });
    if (!existing) {
      return res.status(404).json({ ok: false, error: "ORDER_NOT_FOUND" });
    }

    const updateData: any = {
      deliveryStatus,
      updatedAt: new Date(),
    };

    if (deliveryStatus === "delivered") {
      updateData.deliveredAt = new Date();
    }

    await prisma.boardroomBriefOrder.update({
      where: { id: orderId },
      data: updateData,
    });

    await recordBoardroomOrderEvent({
      orderId,
      actorEmail: session.user?.email || null,
      eventType: "admin.delivery_status_changed",
      previousStatus: existing.deliveryStatus,
      newStatus: deliveryStatus,
      note: typeof note === "string" ? note.slice(0, 1000) : null,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[boardroom-delivery]", error);
    return res.status(500).json({ ok: false, error: "UPDATE_FAILED" });
  }
}

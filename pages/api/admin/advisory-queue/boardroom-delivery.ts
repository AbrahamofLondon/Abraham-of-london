/* pages/api/admin/advisory-queue/boardroom-delivery.ts — Update Boardroom Brief delivery status */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

type Response = { ok: true } | { ok: false; error: string };

const VALID_STATUSES = ["in_review", "dossier_generated", "delivered", "follow_up_due"];

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await getServerSession(req, res, authOptions);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  if (!session?.user?.email || session.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(403).json({ ok: false, error: "ADMIN_REQUIRED" });
  }

  const { orderId, deliveryStatus } = req.body || {};
  if (!orderId || !deliveryStatus || !VALID_STATUSES.includes(deliveryStatus)) {
    return res.status(400).json({ ok: false, error: "INVALID_PARAMS" });
  }

  try {
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

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[boardroom-delivery]", error);
    return res.status(500).json({ ok: false, error: "UPDATE_FAILED" });
  }
}

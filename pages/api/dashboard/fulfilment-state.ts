// pages/api/dashboard/fulfilment-state.ts
// Returns Boardroom Brief delivery pipeline state.
// Zero-safe: returns zeros when no orders exist.
// No PII exposed — all counts only.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

export type FulfilmentStateData = {
  paidOrders: number;
  generatedDossiers: number;  // deliveryStatus IN (dossier_generated, delivered)
  approvedDossiers: number;   // BoardroomDossier.status IN (APPROVED, DELIVERED)
  deliveredDossiers: number;  // deliveryStatus = delivered
  overdueDeliveries: number;  // paid, not delivered, created > 48h ago
  generatedAt: string;
};

// 48 hours in milliseconds — target delivery window
const DELIVERY_WINDOW_MS = 48 * 60 * 60 * 1000;

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<FulfilmentStateData | { error: string }>,
) {
  try {
    const overdueThreshold = new Date(Date.now() - DELIVERY_WINDOW_MS);

    const [
      paidOrders,
      generatedDossiers,
      approvedDossiers,
      deliveredDossiers,
      overdueDeliveries,
    ] = await Promise.all([
      prisma.boardroomBriefOrder.count({
        where: { paymentStatus: "paid" },
      }),
      prisma.boardroomBriefOrder.count({
        where: {
          paymentStatus: "paid",
          deliveryStatus: { in: ["dossier_generated", "delivered"] },
        },
      }),
      prisma.boardroomDossier.count({
        where: { status: { in: ["APPROVED", "DELIVERED"] } },
      }),
      prisma.boardroomBriefOrder.count({
        where: { deliveryStatus: "delivered" },
      }),
      prisma.boardroomBriefOrder.count({
        where: {
          paymentStatus: "paid",
          deliveryStatus: { notIn: ["delivered", "follow_up_due"] },
          createdAt: { lt: overdueThreshold },
        },
      }),
    ]);

    return res.status(200).json({
      paidOrders,
      generatedDossiers,
      approvedDossiers,
      deliveredDossiers,
      overdueDeliveries,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DASHBOARD_FULFILMENT_STATE_ERROR]", error);
    return res.status(500).json({ error: "Failed to load fulfilment state data" });
  }
}

// pages/api/dashboard/boardroom-funnel.ts
// Returns Boardroom Brief conversion funnel metrics.
// All data sourced from PressureSignalEvent and BoardroomBriefOrder — never synthetic.
// Zero-safe: returns zeros when tables are empty, never throws on missing data.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

export type BoardroomFunnelData = {
  pressureSignalStarts: number;
  checkoutAttempts: number;   // any BoardroomBriefOrder record (initiated checkout)
  completedPayments: number;  // paymentStatus = "paid"
  deliveredDossiers: number;  // deliveryStatus = "delivered"
  generatedAt: string;        // ISO timestamp of this response
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<BoardroomFunnelData | { error: string }>,
) {
  try {
    const [
      pressureSignalStarts,
      checkoutAttempts,
      completedPayments,
      deliveredDossiers,
    ] = await Promise.all([
      prisma.pressureSignalEvent.count(),
      prisma.boardroomBriefOrder.count(),
      prisma.boardroomBriefOrder.count({
        where: { paymentStatus: "paid" },
      }),
      prisma.boardroomBriefOrder.count({
        where: { deliveryStatus: "delivered" },
      }),
    ]);

    return res.status(200).json({
      pressureSignalStarts,
      checkoutAttempts,
      completedPayments,
      deliveredDossiers,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DASHBOARD_BOARDROOM_FUNNEL_ERROR]", error);
    return res.status(500).json({ error: "Failed to load boardroom funnel data" });
  }
}

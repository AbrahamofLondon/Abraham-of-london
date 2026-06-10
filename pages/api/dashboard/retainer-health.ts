// pages/api/dashboard/retainer-health.ts
// Returns retainer contract health and oversight review cycle state.
// Zero-safe: returns zeros when no contracts or cycles exist.
// No PII exposed — counts and status only.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

export type RetainerHealthData = {
  activeContracts: number;
  openReviewCycles: number;     // OversightReviewCycle status IN (OPEN, UNDER_REVIEW)
  overdueReviewCycles: number;  // OPEN and periodEnd < now
  completedReviewCycles: number;
  generatedAt: string;
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<RetainerHealthData | { error: string }>,
) {
  try {
    const now = new Date();

    const [
      activeContracts,
      openReviewCycles,
      overdueReviewCycles,
      completedReviewCycles,
    ] = await Promise.all([
      prisma.retainerContract.count({
        where: { status: "ACTIVE" },
      }),
      prisma.oversightReviewCycle.count({
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      }),
      prisma.oversightReviewCycle.count({
        where: {
          status: "OPEN",
          periodEnd: { lt: now },
        },
      }),
      prisma.oversightReviewCycle.count({
        where: { status: "COMPLETED" },
      }),
    ]);

    return res.status(200).json({
      activeContracts,
      openReviewCycles,
      overdueReviewCycles,
      completedReviewCycles,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DASHBOARD_RETAINER_HEALTH_ERROR]", error);
    return res.status(500).json({ error: "Failed to load retainer health data" });
  }
}

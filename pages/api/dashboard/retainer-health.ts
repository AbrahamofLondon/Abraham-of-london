// pages/api/dashboard/retainer-health.ts
// Returns retainer pipeline health across all stages.
// Zero-safe: returns zeros when no records exist.
// No PII exposed — counts and status only.
// CANDIDATES are not counted as active contracts. REVIEW_READY is not revenue.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

export type RetainerHealthData = {
  // Pre-contract pipeline
  readinessCandidates: number;     // readinessClass = CANDIDATE
  reviewReadyCandidates: number;   // readinessClass = REVIEW_READY
  approvedOffers: number;          // readinessClass = APPROVED (no contract yet)
  // Active contracts
  activeContracts: number;         // RetainerContract status = ACTIVE
  pausedContracts: number;
  // Review cycles
  openReviewCycles: number;        // OversightReviewCycle status IN (OPEN, UNDER_REVIEW)
  overdueReviewCycles: number;     // OPEN and periodEnd < now
  completedCyclesThisMonth: number;
  generatedAt: string;
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<RetainerHealthData | { error: string }>,
) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      readinessCandidates,
      reviewReadyCandidates,
      approvedOffers,
      activeContracts,
      pausedContracts,
      openReviewCycles,
      overdueReviewCycles,
      completedCyclesThisMonth,
    ] = await Promise.all([
      prisma.retainerReadinessEvaluation.count({ where: { readinessClass: "CANDIDATE" } }),
      prisma.retainerReadinessEvaluation.count({ where: { readinessClass: "REVIEW_READY" } }),
      prisma.retainerReadinessEvaluation.count({ where: { readinessClass: "APPROVED" } }),
      prisma.retainerContract.count({ where: { status: "ACTIVE" } }),
      prisma.retainerContract.count({ where: { status: "PAUSED" } }),
      prisma.oversightReviewCycle.count({
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      }),
      prisma.oversightReviewCycle.count({
        where: { status: "OPEN", periodEnd: { lt: now } },
      }),
      prisma.oversightReviewCycle.count({
        where: { status: "COMPLETED", reviewedAt: { gte: startOfMonth } },
      }),
    ]);

    return res.status(200).json({
      readinessCandidates,
      reviewReadyCandidates,
      approvedOffers,
      activeContracts,
      pausedContracts,
      openReviewCycles,
      overdueReviewCycles,
      completedCyclesThisMonth,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[DASHBOARD_RETAINER_HEALTH_ERROR]", error);
    return res.status(500).json({ error: "Failed to load retainer health data" });
  }
}

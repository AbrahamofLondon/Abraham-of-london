// pages/api/dashboard/operational-summary.ts
// Aggregated operational queue for the command-centre DO FIRST / WATCH / HEALTHY view.
// Zero-safe: returns zeros when all tables are empty.
// No PII exposed — counts and status labels only.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

export type OperationalSummaryData = {
  // DO FIRST — requires immediate operator attention
  overdueDeliveries: number;       // paid briefs not delivered within 48h
  overdueReviewCycles: number;     // oversight cycles past periodEnd, still OPEN
  pendingReadinessApprovals: number; // retainer readiness evals awaiting admin sign-off
  // WATCH — in progress, not yet overdue
  undeliveredPaidOrders: number;   // paid, not yet delivered, within window
  openReviewCycles: number;        // oversight cycles OPEN or UNDER_REVIEW, not overdue
  candidateReadinessEvals: number; // readiness class CANDIDATE or REVIEW_READY
  // HEALTHY — closed / no action required
  deliveredThisWeek: number;
  completedReviewCyclesThisMonth: number;
  approvedReadinessEvals: number;
  generatedAt: string;
};

const DELIVERY_WINDOW_MS = 48 * 60 * 60 * 1000;

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<OperationalSummaryData | { error: string }>,
) {
  try {
    const now = new Date();
    const overdueThreshold = new Date(now.getTime() - DELIVERY_WINDOW_MS);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      overdueDeliveries,
      overdueReviewCycles,
      pendingReadinessApprovals,
      undeliveredPaidOrders,
      openReviewCycles,
      candidateReadinessEvals,
      deliveredThisWeek,
      completedReviewCyclesThisMonth,
      approvedReadinessEvals,
    ] = await Promise.all([
      // DO FIRST
      prisma.boardroomBriefOrder.count({
        where: {
          paymentStatus: "paid",
          deliveryStatus: { notIn: ["delivered", "follow_up_due"] },
          createdAt: { lt: overdueThreshold },
        },
      }),
      prisma.oversightReviewCycle.count({
        where: { status: "OPEN", periodEnd: { lt: now } },
      }),
      prisma.retainerReadinessEvaluation.count({
        where: {
          adminApprovalRequired: true,
          adminApprovedAt: null,
          readinessClass: { in: ["CANDIDATE", "REVIEW_READY"] },
        },
      }),
      // WATCH
      prisma.boardroomBriefOrder.count({
        where: {
          paymentStatus: "paid",
          deliveryStatus: { notIn: ["delivered", "follow_up_due"] },
          createdAt: { gte: overdueThreshold },
        },
      }),
      prisma.oversightReviewCycle.count({
        where: {
          status: { in: ["OPEN", "UNDER_REVIEW"] },
          periodEnd: { gte: now },
        },
      }),
      prisma.retainerReadinessEvaluation.count({
        where: { readinessClass: { in: ["CANDIDATE", "REVIEW_READY"] } },
      }),
      // HEALTHY
      prisma.boardroomBriefOrder.count({
        where: { deliveryStatus: "delivered", updatedAt: { gte: weekAgo } },
      }),
      prisma.oversightReviewCycle.count({
        where: { status: "COMPLETED", updatedAt: { gte: monthAgo } },
      }),
      prisma.retainerReadinessEvaluation.count({
        where: { readinessClass: "APPROVED", adminApprovedAt: { not: null } },
      }),
    ]);

    return res.status(200).json({
      overdueDeliveries,
      overdueReviewCycles,
      pendingReadinessApprovals,
      undeliveredPaidOrders,
      openReviewCycles,
      candidateReadinessEvals,
      deliveredThisWeek,
      completedReviewCyclesThisMonth,
      approvedReadinessEvals,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[DASHBOARD_OPERATIONAL_SUMMARY_ERROR]", error);
    return res.status(500).json({ error: "Failed to load operational summary" });
  }
}

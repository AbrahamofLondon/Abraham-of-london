// pages/api/dashboard/oversight-reviews.ts
// Returns the oversight review cycle queue — counts by status and urgency tier.
// Zero-safe: returns zeros when no cycles exist.
// No PII — counts, status labels, and aggregate drift data only.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

export type OversightReviewsData = {
  totalCycles: number;
  openCycles: number;
  underReviewCycles: number;
  completedCycles: number;
  skippedCycles: number;
  overdueCycles: number;            // OPEN and periodEnd < now
  criticalDrift: number;            // driftCategory = CRITICAL
  highDrift: number;                // driftCategory = HIGH
  clientsOnWatch: number;           // clientHealthStatus = WATCH or DETERIORATING or CRITICAL
  interventionsThisMonth: number;   // total interventionCount across cycles updated in last 30d
  generatedAt: string;
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<OversightReviewsData | { error: string }>,
) {
  try {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCycles,
      openCycles,
      underReviewCycles,
      completedCycles,
      skippedCycles,
      overdueCycles,
      criticalDrift,
      highDrift,
      clientsOnWatch,
      recentCycles,
    ] = await Promise.all([
      prisma.oversightReviewCycle.count(),
      prisma.oversightReviewCycle.count({ where: { status: "OPEN" } }),
      prisma.oversightReviewCycle.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.oversightReviewCycle.count({ where: { status: "COMPLETED" } }),
      prisma.oversightReviewCycle.count({ where: { status: "SKIPPED" } }),
      prisma.oversightReviewCycle.count({
        where: { status: "OPEN", periodEnd: { lt: now } },
      }),
      prisma.oversightReviewCycle.count({ where: { driftCategory: "CRITICAL" } }),
      prisma.oversightReviewCycle.count({ where: { driftCategory: "HIGH" } }),
      prisma.oversightReviewCycle.count({
        where: {
          clientHealthStatus: { in: ["WATCH", "DETERIORATING", "CRITICAL"] },
        },
      }),
      prisma.oversightReviewCycle.findMany({
        where: { updatedAt: { gte: monthAgo } },
        select: { interventionCount: true },
      }),
    ]);

    const interventionsThisMonth = recentCycles.reduce(
      (sum, c) => sum + (c.interventionCount ?? 0),
      0,
    );

    return res.status(200).json({
      totalCycles,
      openCycles,
      underReviewCycles,
      completedCycles,
      skippedCycles,
      overdueCycles,
      criticalDrift,
      highDrift,
      clientsOnWatch,
      interventionsThisMonth,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[DASHBOARD_OVERSIGHT_REVIEWS_ERROR]", error);
    return res.status(500).json({ error: "Failed to load oversight reviews data" });
  }
}

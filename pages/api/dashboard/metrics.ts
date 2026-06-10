// pages/api/dashboard/metrics.ts
// Aggregates key decision infrastructure metrics from Prisma models.
// All data already exists in PressureSignalEvent, BoardroomBriefOrder,
// ClientEntitlement, OutcomeVerificationRecord, ReturnBriefResponse.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

type DashboardMetrics = {
  totalPressureSignals: number;
  pressureSignalsToday: number;
  pressureSignalsThisWeek: number;
  conversionRateFreeToPaid: number; // 0–100
  activeBoardroomBriefs: number;
  monthlyRecurringRevenue: number; // GBP
  averageDecisionOutcomeScore: number; // 0–5
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<DashboardMetrics | { error: string }>,
) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // ── Pressure signals ──────────────────────────────────────────────────────
    const [totalPressureSignals, pressureSignalsToday, pressureSignalsThisWeek] =
      await Promise.all([
        prisma.pressureSignalEvent.count(),
        prisma.pressureSignalEvent.count({
          where: { createdAt: { gte: startOfToday } },
        }),
        prisma.pressureSignalEvent.count({
          where: { createdAt: { gte: startOfWeek } },
        }),
      ]);

    // ── Boardroom Brief orders ────────────────────────────────────────────────
    const [totalBoardroomOrders, paidBoardroomOrders] = await Promise.all([
      prisma.boardroomBriefOrder.count(),
      prisma.boardroomBriefOrder.count({
        where: { paymentStatus: "paid" },
      }),
    ]);

    // ── Conversion rate: pressure signals → paid Boardroom Brief ──────────────
    // If there are no pressure signals yet, rate is 0.
    const conversionRateFreeToPaid =
      totalPressureSignals > 0
        ? parseFloat(
            (
              (paidBoardroomOrders / Math.max(1, totalPressureSignals)) *
              100
            ).toFixed(1),
          )
        : 0;

    // ── Active briefs (paid + in_review or dossier_generated) ─────────────────
    const activeBoardroomBriefs = await prisma.boardroomBriefOrder.count({
      where: {
        paymentStatus: "paid",
        deliveryStatus: { in: ["in_review", "dossier_generated", "delivered"] },
      },
    });

    // ── Monthly recurring revenue ─────────────────────────────────────────────
    // Sum of Professional subscription entitlements that are active.
    // Each Professional monthly = £59, annual = £590/12 ≈ £49.17/mo.
    // We use a simplified model: count active Professional entitlements.
    const activeProfessionalEntitlements = await prisma.clientEntitlement.findMany({
      where: {
        productCode: { in: ["professional", "professional_annual"] },
        status: "active",
        AND: [
          { startsAt: { lte: now } },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      select: { productCode: true },
    });

    let monthlyRecurringRevenue = 0;
    for (const ent of activeProfessionalEntitlements) {
      if (ent.productCode === "professional_annual") {
        monthlyRecurringRevenue += 49; // ~£49/mo annual equivalent
      } else {
        monthlyRecurringRevenue += 59; // £59/mo monthly
      }
    }

    // Add one-time Boardroom Brief revenue (amortised as a rough contribution)
    // Only count orders from the last 30 days to smooth the metric.
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentBoardroomRevenue = await prisma.boardroomBriefOrder.count({
      where: {
        paymentStatus: "paid",
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    monthlyRecurringRevenue += recentBoardroomRevenue * 99;

    // ── Average decision outcome score ────────────────────────────────────────
    // From OutcomeVerificationRecord.effectivenessScore (0–5 scale).
    const outcomeAgg = await prisma.outcomeVerificationRecord.aggregate({
      _avg: { effectivenessScore: true },
    });
    const averageDecisionOutcomeScore =
      outcomeAgg._avg.effectivenessScore != null
        ? parseFloat(outcomeAgg._avg.effectivenessScore.toFixed(1))
        : 0;

    return res.status(200).json({
      totalPressureSignals,
      pressureSignalsToday,
      pressureSignalsThisWeek,
      conversionRateFreeToPaid,
      activeBoardroomBriefs,
      monthlyRecurringRevenue,
      averageDecisionOutcomeScore,
    });
  } catch (error) {
    console.error("[DASHBOARD_METRICS_ERROR]", error);
    return res.status(500).json({ error: "Failed to aggregate dashboard metrics" });
  }
}

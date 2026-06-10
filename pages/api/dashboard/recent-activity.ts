// pages/api/dashboard/recent-activity.ts
// Returns the most recent decision infrastructure events:
// pressure signals, boardroom brief orders, return brief submissions.
// All data exists in Prisma models.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

type RecentActivityItem = {
  id: string;
  type: "pressure_signal" | "boardroom_brief_order" | "return_brief_submitted";
  title: string;
  timestamp: string; // ISO
  userRole?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RecentActivityItem[] | { error: string }>,
) {
  try {
    const limitParam = req.query.limit;
    const limit = typeof limitParam === "string" ? parseInt(limitParam, 10) : 10;
    const clampedLimit = Math.max(1, Math.min(50, Number.isFinite(limit) ? limit : 10));

    // Fetch recent events from three sources in parallel
    const [recentSignals, recentOrders, recentReturnBriefs] = await Promise.all([
      prisma.pressureSignalEvent.findMany({
        take: clampedLimit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          pressureLevel: true,
          recommendedProduct: true,
          createdAt: true,
        },
      }),
      prisma.boardroomBriefOrder.findMany({
        take: clampedLimit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          paymentStatus: true,
          deliveryStatus: true,
          riskLevel: true,
          createdAt: true,
          email: true,
        },
      }),
      prisma.returnBriefResponse.findMany({
        take: clampedLimit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          outcomeClass: true,
          createdAt: true,
          submittedByEmail: true,
        },
      }),
    ]);

    // Build activity items
    const activities: RecentActivityItem[] = [];

    for (const signal of recentSignals) {
      activities.push({
        id: `signal-${signal.id}`,
        type: "pressure_signal",
        title: `Pressure signal: ${signal.pressureLevel} — routed to ${signal.recommendedProduct}`,
        timestamp: signal.createdAt.toISOString(),
      });
    }

    for (const order of recentOrders) {
      const statusLabel =
        order.paymentStatus === "paid"
          ? order.deliveryStatus === "delivered"
            ? "Delivered"
            : "Paid"
          : order.paymentStatus === "failed"
            ? "Payment failed"
            : "Pending";
      activities.push({
        id: `order-${order.id}`,
        type: "boardroom_brief_order",
        title: `Boardroom Brief ${statusLabel}${order.riskLevel ? ` — risk: ${order.riskLevel}` : ""}`,
        timestamp: order.createdAt.toISOString(),
      });
    }

    for (const rb of recentReturnBriefs) {
      activities.push({
        id: `return-brief-${rb.id}`,
        type: "return_brief_submitted",
        title: `Return Brief submitted — outcome: ${rb.outcomeClass}`,
        timestamp: rb.createdAt.toISOString(),
      });
    }

    // Sort by timestamp descending and take the top N
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const sliced = activities.slice(0, clampedLimit);

    return res.status(200).json(sliced);
  } catch (error) {
    console.error("[DASHBOARD_RECENT_ACTIVITY_ERROR]", error);
    return res.status(500).json({ error: "Failed to load recent activity" });
  }
}

// GET /api/admin/intelligence-foundry/brief-orders
// Lists Decision Brief Orders for the admin fulfilment queue.
// Supports ?metrics=true to return aggregate commercial metrics.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const tier = url.searchParams.get("tier");
    const includeMetrics = url.searchParams.get("metrics") === "true";

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (tier && tier !== "all") where.tier = tier;

    const orders = await prisma.decisionBriefOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    let metrics = null;
    if (includeMetrics) {
      const allOrders = await prisma.decisionBriefOrder.findMany();
      const paidOrders = allOrders.filter(o => o.status !== "pending" && o.status !== "cancelled");
      const revenueByTier: Record<string, number> = {};
      const ordersByStatus: Record<string, number> = {};
      const decisionTypeCount: Record<string, number> = {};
      const failurePointCount: Record<string, number> = {};

      for (const o of allOrders) {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
        if (o.tier) revenueByTier[o.tier] = (revenueByTier[o.tier] || 0) + o.price;
        if (o.decisionType) decisionTypeCount[o.decisionType] = (decisionTypeCount[o.decisionType] || 0) + 1;
        if (o.primaryFailurePoint) failurePointCount[o.primaryFailurePoint] = (failurePointCount[o.primaryFailurePoint] || 0) + 1;
      }

      const totalRevenue = Object.values(revenueByTier).reduce((a, b) => a + b, 0);
      const constrainedRescueCount = allOrders.filter(o => o.directive === "CONSTRAINED_RESCUE" || o.directive === "ESCALATE").length;

      metrics = {
        totalOrders: allOrders.length,
        paidOrders: paidOrders.length,
        pendingOrders: allOrders.filter(o => o.status === "pending").length,
        totalRevenue,
        totalRevenueFormatted: `£${(totalRevenue / 100).toFixed(0)}`,
        revenueByTier,
        ordersByStatus,
        decisionTypeCount,
        failurePointCount,
        constrainedRescueCount,
      };
    }

    return NextResponse.json({ ok: true, orders, metrics });
  } catch (error) {
    console.error("[BRIEF_ORDERS_GET]", error);
    return NextResponse.json({ ok: false, error: "FAILED" }, { status: 500 });
  }
}
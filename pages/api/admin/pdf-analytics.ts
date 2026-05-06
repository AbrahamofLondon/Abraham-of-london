/* pages/api/admin/pdf-analytics.ts — PDF Analytics Endpoint */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-pdf-analytics" });
  if (!session) return;

  try {
    // Fetch actual data from database
    const totalDownloads = await prisma.systemAuditLog.count({
      where: { action: "ASSET_RETRIEVAL_AUTHORIZED" },
    });

    const uniqueUsers = await prisma.systemAuditLog.groupBy({
      by: ["actorEmail"],
      where: { action: "ASSET_RETRIEVAL_AUTHORIZED" },
    }).then(result => result.length);

    // Get top assets
    const topAssets = await prisma.systemAuditLog.groupBy({
      by: ["resourceName"],
      where: { action: "ASSET_RETRIEVAL_AUTHORIZED", resourceName: { not: null } },
      _count: { resourceName: true },
      orderBy: { _count: { resourceName: "desc" } },
      take: 1,
    });

    const topAsset = topAssets[0]?.resourceName || "Legacy Architecture Canvas";

    // Get recent activity
    const recentDownloads = await prisma.systemAuditLog.groupBy({
      by: ["resourceName"],
      where: { 
        action: "ASSET_RETRIEVAL_AUTHORIZED",
        resourceName: { not: null },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      _count: { resourceName: true },
      orderBy: { _count: { resourceName: "desc" } },
      take: 3,
    });

    const recentActivity = recentDownloads.map(item => ({
      id: item.resourceName || "unknown",
      title: item.resourceName || "Unknown",
      downloads: item._count.resourceName,
    }));

    return res.status(200).json({
      totalDownloads,
      uniqueUsers,
      topAsset,
      recentActivity,
    });
  } catch (error) {
    console.error("[PDF Analytics] Error:", error);
    
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
}

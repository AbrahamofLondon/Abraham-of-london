// pages/api/premium/content/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withInnerCircleAccess } from "@/lib/server/with-inner-circle-access";
import { createDownloadToken } from "@/lib/premium/download-token";

const PREMIUM_CONTENT = {
  reports: [
    {
      id: "report-001",
      title: "Global Market Intelligence Report Q4 2024",
      description: "Exclusive analysis of global market movements and predictions",
      category: "market-intelligence",
      confidentialLevel: "high",
      fileSize: "15.2 MB",
      pages: 42,
      publishedDate: "2024-01-15",
      expiresAt: "2026-12-31",
      tags: ["global", "intelligence", "quarterly", "exclusive"],
    },
    {
      id: "report-002",
      title: "Industry Disruption Analysis: Tech Sector",
      description: "In-depth analysis of upcoming disruptions in technology",
      category: "industry-analysis",
      confidentialLevel: "medium",
      fileSize: "8.7 MB",
      pages: 28,
      publishedDate: "2024-01-10",
      tags: ["tech", "disruption", "analysis", "forecast"],
    },
  ],
};

function notExpired(r: any) {
  if (!r.expiresAt) return true;
  return new Date(r.expiresAt).getTime() > Date.now();
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const access = (req as any).innerCircleAccess;
  const { id } = req.query;

  if (req.method !== "GET") return res.status(405).end();

  // Single report
  if (typeof id === "string") {
    const report = PREMIUM_CONTENT.reports.find((r) => r.id === id);
    if (!report) return res.status(404).json({ error: "not_found" });
    if (!notExpired(report)) return res.status(410).json({ error: "expired", expiresAt: report.expiresAt });

    const token = createDownloadToken({
      reportId: report.id,
      memberId: access.memberId || "unknown",
      tier: access.tier || "member",
      ttlMinutes: 15,
    });

    return res.status(200).json({
      success: true,
      data: report,
      download: {
        url: `/api/premium/content/download/${report.id}?token=${encodeURIComponent(token)}`,
        expiresInMinutes: 15,
      },
      viewer: { tier: access.tier, memberId: access.memberId },
    });
  }

  // List
  const reports = PREMIUM_CONTENT.reports.filter(notExpired).map((r) => ({
    ...r,
  }));

  return res.status(200).json({
    success: true,
    data: { reports },
    viewer: { tier: access.tier, memberId: access.memberId },
  });
}

export default withInnerCircleAccess(handler, { requireAuth: true, requireTier: ["patron", "founder"] });
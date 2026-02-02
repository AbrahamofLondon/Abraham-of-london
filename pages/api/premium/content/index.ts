// pages/api/premium/content/index.ts — GATED REPORT ENGINE
import type { NextApiRequest, NextApiResponse } from "next";
import { withInnerCircleAccess } from "@/lib/server/with-inner-circle-access";
import { createDownloadToken } from "@/lib/premium/download-token";

const PREMIUM_CONTENT = {
  reports: [
    {
      id: "report-001",
      title: "Global Market Intelligence Report Q1 2026",
      description: "Exclusive analysis of global market movements.",
      category: "market-intelligence",
      confidentialLevel: "high",
      fileSize: "15.2 MB",
      expiresAt: "2026-12-31",
      tags: ["global", "exclusive"],
    }
  ],
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const access = (req as any).innerCircleAccess;
  const { id } = req.query;

  if (req.method !== "GET") return res.status(405).end();

  // Handling Single Report + Secure Token Generation
  if (typeof id === "string") {
    const report = PREMIUM_CONTENT.reports.find((r) => r.id === id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    // Expiry Check
    if (report.expiresAt && new Date(report.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ error: "Report archived/expired" });
    }

    // Generate a short-lived (15m) JWE/JWT for the download route
    const token = createDownloadToken({
      reportId: report.id,
      sessionId: access.sessionId, // Linked to Postgres session
      tier: access.tier,
      ttlMinutes: 15,
    });

    return res.status(200).json({
      success: true,
      data: report,
      download: {
        url: `/api/premium/content/download/${report.id}?token=${encodeURIComponent(token)}`,
        expiresIn: "15m",
      },
      identity: { tier: access.tier }
    });
  }

  // Bulk List View
  return res.status(200).json({
    success: true,
    data: PREMIUM_CONTENT.reports,
    viewer: { tier: access.tier }
  });
}

// Strictly gating to higher-tier members
export default withInnerCircleAccess(handler, { 
  requireAuth: true, 
  requireTier: ["inner-circle", "private"] 
});
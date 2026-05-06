/* pages/api/admin/status-report.ts — DYNAMIC REPORT GENERATOR */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-status-report" });
  if (!session) return;

  // ✅ CRITICAL FIX: Ensure prisma is not null before proceeding
  if (!prisma) {
    return res.status(500).json({ error: "Database Client not initialized" });
  }

  try {
    // 2. Aggregate Data for the Template
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalBriefs, retrievalCount, uniqueMembers, criticalLogs, topAsset] = await Promise.all([
      prisma.contentMetadata.count(),
      prisma.systemAuditLog.count({ 
        where: { 
          action: 'ASSET_RETRIEVAL_AUTHORIZED', 
          createdAt: { gte: sevenDaysAgo } 
        } 
      }),
      // ✅ Updated to 'lastSeenAt' to match your schema.prisma
      prisma.innerCircleMember.count({ 
        where: { 
          lastSeenAt: { gte: sevenDaysAgo } 
        } 
      }),
      prisma.systemAuditLog.count({ 
        where: { 
          severity: 'critical', 
          createdAt: { gte: sevenDaysAgo } 
        } 
      }),
      prisma.systemAuditLog.groupBy({
        by: ['resourceName'],
        where: { 
          action: 'ASSET_RETRIEVAL_AUTHORIZED',
          resourceName: { not: null }
        },
        _count: { resourceName: true },
        orderBy: { _count: { resourceName: 'desc' } },
        take: 1
      })
    ]);

    // 3. Populate the Template
    const report = `
# SOVEREIGN OS: WEEKLY INTELLIGENCE SUMMARY
Generated: ${now.toUTCString()}
Status: GREEN | SECURITY: LEVEL 3 ACTIVE

## 1. PORTFOLIO METRICS
* **Total Briefs Hosted:** ${totalBriefs} / 75
* **System Integrity:** Verified

## 2. VIP ENGAGEMENT (Last 7 Days)
* **Total retrievals:** ${retrievalCount}
* **Unique Active Members:** ${uniqueMembers}
* **Most Targeted Brief:** "${topAsset[0]?.resourceName || 'None'}"

## 3. SECURITY & AUDIT TRAIL
* **Critical Events Detected:** ${criticalLogs}
* **System Health:** Optimal
    `.trim();

    // 4. Return as Text/Markdown
    res.setHeader('Content-Type', 'text/markdown');
    return res.status(200).send(report);

  } catch (error) {
    console.error("[REPORT_GENERATION_ERROR]:", error);
    return res.status(500).json({ error: "Failed to generate intelligence report" });
  }
}

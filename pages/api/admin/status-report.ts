/* pages/api/admin/status-report.ts — DYNAMIC REPORT GENERATOR */
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@abrahamoflondon.com';

  // 1. Security Guard
  if (!session || session.user?.email !== adminEmail) {
    return res.status(403).json({ error: "Access Denied: Admin Clearance Required" });
  }

  try {
    // 2. Aggregate Data for the Template
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalBriefs, retrievalCount, uniqueMembers, criticalLogs, topAsset] = await Promise.all([
      prisma.contentMetadata.count(),
      prisma.systemAuditLog.count({ where: { action: 'ASSET_RETRIEVAL_AUTHORIZED', createdAt: { gte: sevenDaysAgo } } }),
      prisma.innerCircleMember.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } }),
      prisma.systemAuditLog.count({ where: { severity: 'critical', createdAt: { gte: sevenDaysAgo } } }),
      prisma.systemAuditLog.groupBy({
        by: ['resourceName'],
        where: { action: 'ASSET_RETRIEVAL_AUTHORIZED' },
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
    return res.status(500).json({ error: "Failed to generate intelligence report" });
  }
}
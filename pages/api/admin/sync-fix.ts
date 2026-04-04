/* pages/api/admin/sync-fix.ts — WITH GOVERNANCE LOGGING */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { normalizeUserTier } from "@/lib/access/tier-policy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const members = await prisma.innerCircleMember.findMany({
      where: { userId: { not: null } },
      include: { user: { select: { id: true, tier: true } } }
    });

    const updates = [];
    let fixCount = 0;

    for (const member of members) {
      const icTier = normalizeUserTier(member.tier);
      const globalTier = normalizeUserTier(member.user?.tier);

      if (icTier !== globalTier && member.userId) {
        updates.push(prisma.user.update({
          where: { id: member.userId },
          data: { tier: icTier }
        }));
        fixCount++;
      }
    }

    if (updates.length > 0) {
      // Execute Fix AND Log Governance Event in one transaction
      await prisma.$transaction([
        ...updates,
        prisma.governanceLog.create({
          data: {
            action: "SYNC_FIX",
            performedBy: "ADMIN_SYSTEM_COMMAND",
            target: "GLOBAL_USER_TABLE",
            details: { accountsFixed: fixCount, timestamp: new Date().toISOString() }
          }
        })
      ]);
    }

    return res.status(200).json({ ok: true, fixed: fixCount });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
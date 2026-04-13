/* pages/api/admin/users/upgrade.ts — Tier Elevation Engine */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/db/prisma";
import { auditLogger } from "@/lib/server/db/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  
  // Ensure only high-level Admins can perform upgrades
  if ((session as any)?.aol?.tier !== "admin" && (session as any)?.aol?.tier !== "root") {
    return res.status(403).json({ message: "Unauthorized: Insufficient Clearance" });
  }

  const { userId, newTier, requestId } = req.body;

  try {
    const result = await prisma.$transaction([
      // 1. Update the Member's Tier
      prisma.innerCircleMember.update({
        where: { id: userId },
        data: { tier: newTier }
      }),
      // 2. Mark the Request as Resolved in Audit Logs
      prisma.systemAuditLog.update({
        where: { id: requestId },
        data: { status: "approved" }
      })
    ]);

    // 3. Log the Administrative Action
    await auditLogger.log({
      action: "USER_TIER_UPGRADE",
      severity: "info",
      actorId: session?.user?.id,
      resourceId: userId,
      status: "success",
      metadata: { newTier, approvedBy: session?.user?.email }
    });

    return res.status(200).json({ ok: true, user: result[0] });
  } catch (error) {
    console.error("[UPGRADE_ERROR]", error);
    return res.status(500).json({ ok: false, message: "Upgrade failed." });
  }
}
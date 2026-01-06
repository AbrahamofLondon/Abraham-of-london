/* pages/api/cron/clean-keys.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. GATEKEEPING: Verify Secret Token
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "POST required." });
  }

  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 180);

    // 2. TRANSACTIONAL HYGIENE
    const result = await prisma.$transaction([
      // Revoke Expired
      prisma.innerCircleKey.updateMany({
        where: { status: "active", expiresAt: { lt: new Date() } },
        data: { status: "expired", revokedAt: new Date(), revokedReason: "Auto-expiry" },
      }),
      // Revoke Stale
      prisma.innerCircleKey.updateMany({
        where: { 
          status: "active", 
          lastUsedAt: { lt: thresholdDate }, 
          createdAt: { lt: thresholdDate } 
        },
        data: { status: "revoked", revokedAt: new Date(), revokedReason: "180-day inactivity" },
      }),
    ]);

    // 3. AUDIT LOG
    await prisma.systemAuditLog.create({
      data: {
        actorType: "SYSTEM",
        action: "CRON_CLEANUP",
        resourceType: "ACCESS_KEYS",
        status: "success",
        newValue: JSON.stringify({ expired: result[0].count, stale: result[1].count })
      }
    });

    return res.status(200).json({ 
      success: true, 
      processed: { expired: result[0].count, stale: result[1].count } 
    });

  } catch (error) {
    console.error("[CRON_ERROR]", error);
    return res.status(500).json({ success: false, error: "Maintenance failed." });
  }
}


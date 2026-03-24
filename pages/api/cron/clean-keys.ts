/* pages/api/cron/clean-keys.ts — SYNCHRONIZED MAINTENANCE */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. GATEKEEPING: Verify Secret Token
  const authHeader = req.headers.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: "Unauthorized Elevation." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "POST Protocol Required." });
  }

  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 180);

    // 2. TRANSACTIONAL HYGIENE: Atomic cleanup
    const result = await prisma.$transaction([
      // Revoke Expired Keys
      prisma.innerCircleKey.updateMany({
        where: { status: "active", expiresAt: { lt: new Date() } },
        data: { 
          status: "expired", 
          revokedAt: new Date(), 
          revokedReason: "AUTO_EXPIRY_THRESHOLD" 
        },
      }),
      // Revoke Stale Access (> 180 days)
      prisma.innerCircleKey.updateMany({
        where: { 
          status: "active", 
          lastUsedAt: { lt: thresholdDate }, 
          createdAt: { lt: thresholdDate } 
        },
        data: { 
          status: "revoked", 
          revokedAt: new Date(), 
          revokedReason: "DORMANCY_POLICY_180_DAYS" 
        },
      }),
    ]);

    // 3. ENHANCED AUDIT LOG: Schema-Aligned Field Mapping
    await prisma.systemAuditLog.create({
      data: {
        action: "MAINTENANCE_CLEANUP",
        severity: "info",
        actorType: "system", // Schema uses lowercase 'system' default
        resourceType: "ACCESS_KEYS",
        status: "success",
        metadata: { // FIXED: matching Prisma Schema field name
          expiredCount: result[0].count, 
          staleCount: result[1].count,
          threshold: "180_DAYS",
          timestamp: new Date().toISOString()
        }
      }
    });

    return res.status(200).json({ 
      success: true, 
      processed: { expired: result[0].count, stale: result[1].count } 
    });

  } catch (error) {
    console.error("[CRON_ERROR_MAINTENANCE]:", error);
    return res.status(500).json({ success: false, error: "Institutional maintenance failed." });
  }
}
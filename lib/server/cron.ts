/* lib/server/cron.ts */
import prisma from "@/lib/prisma";
import { logAuditEvent } from "./audit";

export async function executeInstitutionalHygiene() {
  const now = new Date();
  
  try {
    // 1. REVOKE EXPIRED KEYS
    // Principled Analysis: We filter by 'active' status and the expiry timestamp.
    const expiredKeys = await prisma.innerCircleKey.updateMany({
      where: {
        status: "active",
        expiresAt: { lt: now }
      },
      data: {
        status: "revoked",
        revokedAt: now,
        // Ensure this field exists in your schema.prisma; 
        // if not, remove the line below until schema is updated.
        // revocationReason: "temporal_expiry" 
      }
    });

    if (expiredKeys.count > 0) {
      await logAuditEvent({
        actorType: "system",
        action: "AUTO_REVOCATION_EXPIRY",
        resourceType: "inner_circle_key",
        status: "success",
        details: { count: expiredKeys.count }
      });
    }

    // 2. IDENTIFY SECURITY BREACH PATTERNS
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const securityThreats = await prisma.systemAuditLog.groupBy({
      by: ['ipAddress'],
      where: {
        action: "RATE_LIMIT_EXCEEDED",
        createdAt: { gte: yesterday }
      },
      _count: { ipAddress: true },
      having: {
        ipAddress: {
          _count: { gt: 5 }
        }
      }
    });

    // 3. LOG THREATS
    for (const threat of securityThreats) {
      if (threat.ipAddress) {
        await logAuditEvent({
          actorType: "system",
          action: "SECURITY_THREAT_DETECTED",
          resourceType: "ip_perimeter",
          status: "warning",
          details: { ip: threat.ipAddress, breachCount: threat._count.ipAddress },
          ipAddress: threat.ipAddress
        });
      }
    }

    return { success: true, expiredRevoked: expiredKeys.count, threatsDetected: securityThreats.length };
  } catch (error) {
    console.error("[CRON_FAILURE] Institutional hygiene failed:", error);
    return { success: false, error: String(error) };
  }
}

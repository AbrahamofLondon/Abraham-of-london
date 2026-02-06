/* lib/security/anomaly-monitor.ts */
import { prisma } from "@/lib/prisma";
import { notifyPrincipalOfSecurityAction } from "@/lib/intelligence/notification-delegate";

/**
 * THRESHOLD CONFIGURATION
 * 10 Briefs in 60 Minutes = Immediate Suspension
 */
const VELOCITY_LIMIT = 10;
const TIME_WINDOW_MINUTES = 60;

export async function detectAnomalousActivity(memberId: string) {
  const lookbackPeriod = new Date(Date.now() - TIME_WINDOW_MINUTES * 60 * 1000);

  // 1. Calculate Velocity of Exports
  const recentExports = await prisma.downloadAuditEvent.count({
    where: {
      memberId,
      eventType: "EXPORT",
      createdAt: { gte: lookbackPeriod }
    }
  });

  // 2. Threshold Breach Protocol
  if (recentExports >= VELOCITY_LIMIT) {
    return await executeAutomaticLockout(memberId, recentExports);
  }

  return { status: "SAFE", count: recentExports };
}

async function executeAutomaticLockout(memberId: string, count: number) {
  // ATOMIC LOCKOUT: Member status and Key revocation
  const [member] = await prisma.$transaction([
    prisma.innerCircleMember.update({
      where: { id: memberId },
      data: { status: "suspended" }
    }),
    prisma.innerCircleKey.updateMany({
      where: { memberId, status: "active" },
      data: { 
        status: "revoked", 
        revokedAt: new Date(), 
        revokedReason: "VELOCITY_EXCEEDED" 
      }
    }),
    prisma.systemAuditLog.create({
      data: {
        action: "SECURITY_AUTO_LOCK",
        severity: "CRITICAL",
        resourceId: memberId,
        metadata: { exports: count, window: `${TIME_WINDOW_MINUTES}m` }
      }
    })
  ]);

  // Notify the Principal and Backup Emails
  await notifyPrincipalOfSecurityAction(member, "SUSPENSION_VELOCITY");

  return { status: "LOCKED", count };
}
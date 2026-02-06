/* lib/security/watchdog-delegate.ts */
import { prisma } from "@/lib/prisma";
import { notifyPrincipalOfSecurityAction } from "@/lib/intelligence/notification-delegate";

export async function executeSecuritySweep() {
  const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Identify Dormant Principals
  const dormantMembers = await prisma.innerCircleMember.findMany({
    where: {
      status: "active",
      lastSeenAt: { lt: THIRTY_DAYS_AGO },
      role: { not: "ADMIN" } // Prevent self-lockout
    },
    include: { keys: true }
  });

  const results = { suspended: 0, revokedKeys: 0 };

  for (const member of dormantMembers) {
    // 2. Atomic Suspension
    await prisma.$transaction([
      // Suspend the member profile
      prisma.innerCircleMember.update({
        where: { id: member.id },
        data: { status: "suspended" }
      }),
      // Revoke all active institutional keys
      prisma.innerCircleKey.updateMany({
        where: { memberId: member.id, status: "active" },
        data: { 
          status: "revoked", 
          revokedAt: new Date(),
          revokedReason: "Dormancy_Security_Policy"
        }
      }),
      // Log the event for the Command Wall
      prisma.systemAuditLog.create({
        data: {
          action: "WATCHDOG_SUSPENSION",
          severity: "high",
          actorType: "system",
          resourceId: member.id,
          metadata: { reason: "Dormancy > 30 Days" }
        }
      })
    ]);

    // 3. Notify Backups (Optional: Notify the Principal their access is paused)
    await notifyPrincipalOfSecurityAction(member, "SUSPENSION_DORMANCY");
    
    results.suspended++;
    results.revokedKeys += member.keys.length;
  }

  return results;
}
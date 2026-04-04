import { prisma } from "@/lib/prisma";
import { normalizeUserTier } from "@/lib/access/tier-policy";

/**
 * PROJECT AUDIT: Verifies Synchronization across all layers.
 * Checks if Global User Tiers match Inner Circle Member Tiers.
 */
export async function auditActiveAccess() {
  console.log("🚀 Starting Global Access Audit...");

  const activeSessions = await prisma.session.findMany({
    where: { status: "active" },
    include: {
      member: {
        select: {
          id: true,
          email: true,
          tier: true, // Inner Circle Tier
          userId: true,
          user: {
            select: {
              id: true,
              tier: true, // Global User Tier (NextAuth)
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const report = activeSessions.map(s => {
    const member = s.member;
    const globalUser = member?.user;

    const icTier = normalizeUserTier(member?.tier ?? "public");
    const globalTier = normalizeUserTier(globalUser?.tier ?? "public");
    
    // THE SYNC CHECK: Does the institutional tier match the global one?
    const isSynced = icTier === globalTier;

    return {
      sessionId: `${s.sessionId.slice(0, 10)}...`,
      email: member?.email || "anonymous",
      innerCircleTier: icTier,
      globalUserTier: globalTier,
      syncStatus: isSynced ? "✅ SYNCED" : "❌ DRIFT DETECTED",
      lastSeen: s.createdAt.toISOString()
    };
  });

  console.table(report);

  const drifts = report.filter(r => r.syncStatus.includes("DRIFT"));
  if (drifts.length > 0) {
    console.warn(`⚠️ Warning: Found ${drifts.length} drifted accounts!`);
  } else {
    console.log("✨ All active sessions are perfectly synchronized.");
  }

  return report;
}
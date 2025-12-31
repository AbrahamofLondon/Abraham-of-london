/* lib/server/analytics.ts */
import prisma from "@/lib/prisma";

export type StrategicHealthReport = {
  summary: {
    totalMembers: number;
    activeKeys: number;
    recentIntakes: number;
    perimeterBreaches: number;
  };
  engagement: Array<{
    shortSlug: string;
    viewCount: number;
    uniquePrincipals: number;
  }>;
  auditTrends: Array<{
    action: string;
    _count: number;
  }>;
};

/**
 * INSTITUTIONAL HEALTH REPORT
 * Principled Analysis: Aggregates behavioral and security data for Board review.
 * Outcome: Provides high-gravity trends without leaking individual PII.
 */
export async function getStrategicHealthReport(): Promise<StrategicHealthReport> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const [
      memberCount,
      keyCount,
      intakeCount,
      breachCount,
      engagementStats,
      auditStats
    ] = await Promise.all([
      // 1. Total Principals
      prisma.innerCircleMember.count({ where: { status: "active" } }),
      
      // 2. Total Active Keys
      prisma.innerCircleKey.count({ where: { status: "active" } }),
      
      // 3. Recent Strategy Room Intakes (30 Days)
      prisma.strategyRoomIntake.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),

      // 4. Perimeter Breaches (Rate Limit Exceeded events)
      prisma.systemAuditLog.count({
        where: { 
          action: "RATE_LIMIT_EXCEEDED",
          createdAt: { gte: thirtyDaysAgo }
        }
      }),

      // 5. Content Engagement Trends
      prisma.shortInteraction.groupBy({
        by: ['shortSlug'],
        where: { action: 'view' },
        _count: {
          _all: true,
          memberId: true // Count unique principals
        },
        orderBy: {
          _count: { shortSlug: 'desc' }
        },
        take: 10
      }),

      // 6. Security & System Action Distribution
      prisma.systemAuditLog.groupBy({
        by: ['action'],
        _count: true,
        orderBy: {
          _count: { action: 'desc' }
        },
        take: 5
      })
    ]);

    return {
      summary: {
        totalMembers: memberCount,
        activeKeys: keyCount,
        recentIntakes: intakeCount,
        perimeterBreaches: breachCount,
      },
      engagement: engagementStats.map(stat => ({
        shortSlug: stat.shortSlug,
        viewCount: stat._count._all,
        uniquePrincipals: stat._count.memberId || 0
      })),
      auditTrends: auditStats.map(stat => ({
        action: stat.action,
        _count: stat._count
      }))
    };
  } catch (error) {
    console.error("[ANALYTICS_FAILURE] Could not aggregate Board Intelligence:", error);
    throw new Error("Institutional Analytics subsystem offline.");
  }
}

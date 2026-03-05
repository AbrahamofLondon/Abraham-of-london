/* lib/server/analytics.ts */
import "server-only";

import { prisma } from "@/lib/prisma.server";

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
    uniquePrincipals: number; // computed as distinct memberIds per slug
  }>;
  auditTrends: Array<{
    action: string;
    _count: number;
  }>;
};

/**
 * INSTITUTIONAL HEALTH REPORT
 * - Uses only models that exist in your current Prisma schema:
 *   InnerCircleMember, InnerCircleKey, StrategyIntake, SystemAuditLog, PageView
 * - No PII leakage; only aggregate signals.
 */
export async function getStrategicHealthReport(): Promise<StrategicHealthReport> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    const [
      memberCount,
      keyCount,
      intakeCount,
      breachCount,
      // PageView aggregates
      viewsBySlug,
      uniqueBySlugMember,
      auditStats,
    ] = await Promise.all([
      // 1) Total active members
      prisma.innerCircleMember.count({
        where: { status: "active" },
      }),

      // 2) Total active keys
      prisma.innerCircleKey.count({
        where: { status: "active" },
      }),

      // 3) Recent Strategy Intakes (30 days)
      prisma.strategyIntake.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      // 4) Perimeter breaches / rate limit hits (30 days)
      prisma.systemAuditLog.count({
        where: {
          action: "RATE_LIMIT_EXCEEDED",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // 5a) Total views per short slug (top 10)
      prisma.pageView.groupBy({
        by: ["slug"],
        where: {
          createdAt: { gte: thirtyDaysAgo },
          slug: { not: null },
          path: { startsWith: "/shorts/" },
        },
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 10,
      }),

      // 5b) Unique principals per short slug:
      // group by (slug, memberId) then count the groups per slug
      prisma.pageView.groupBy({
        by: ["slug", "memberId"],
        where: {
          createdAt: { gte: thirtyDaysAgo },
          slug: { not: null },
          memberId: { not: null },
          path: { startsWith: "/shorts/" },
        },
        _count: { _all: true },
      }),

      // 6) Action distribution (top 5)
      prisma.systemAuditLog.groupBy({
        by: ["action"],
        _count: { _all: true },
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { _count: { _all: "desc" } },
        take: 5,
      }),
    ]);

    // Build a map slug -> unique principals
    const uniqueMap = new Map<string, number>();
    for (const row of uniqueBySlugMember) {
      const slug = row.slug ?? "";
      if (!slug) continue;
      uniqueMap.set(slug, (uniqueMap.get(slug) ?? 0) + 1);
    }

    return {
      summary: {
        totalMembers: memberCount,
        activeKeys: keyCount,
        recentIntakes: intakeCount,
        perimeterBreaches: breachCount,
      },
      engagement: viewsBySlug.map((stat) => {
        const slug = stat.slug ?? "unknown";
        return {
          shortSlug: slug,
          viewCount: stat._count._all,
          uniquePrincipals: uniqueMap.get(slug) ?? 0,
        };
      }),
      auditTrends: auditStats.map((stat) => ({
        action: stat.action,
        _count: stat._count._all,
      })),
    };
  } catch (error) {
    console.error("[ANALYTICS_FAILURE] Could not aggregate Board Intelligence:", error);
    throw new Error("Institutional Analytics subsystem offline.");
  }
}
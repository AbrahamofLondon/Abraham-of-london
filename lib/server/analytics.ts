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
    uniquePrincipals: number;
  }>;
  auditTrends: Array<{
    action: string;
    _count: number;
  }>;
};

const SHORTS_PATH_PREFIX = "/shorts/";

/**
 * INSTITUTIONAL HEALTH REPORT
 * Aligned to actual schema:
 * - PageView stores `path` + `createdAt` (short slug is embedded in path)
 * - SystemAuditLog uses createdAt
 * - StrategyIntake exists
 */
export async function getStrategicHealthReport(): Promise<StrategicHealthReport> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    const [
      memberCount,
      keyCount,
      intakeCount,
      breachCount,
      viewsByPath,
      uniqueByPathMember,
      auditStats,
    ] = await Promise.all([
      prisma.innerCircleMember.count({
        where: { status: "active" },
      }),

      prisma.innerCircleKey.count({
        where: {
          status: "active",
          expiresAt: { gt: new Date() },
        },
      }),

      prisma.strategyIntake.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      prisma.systemAuditLog.count({
        where: {
          action: "RATE_LIMIT_EXCEEDED",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      prisma.pageView.groupBy({
        by: ["path"],
        where: {
          createdAt: { gte: thirtyDaysAgo },
          path: { startsWith: SHORTS_PATH_PREFIX },
        },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),

      prisma.pageView.groupBy({
        by: ["path", "memberId"],
        where: {
          createdAt: { gte: thirtyDaysAgo },
          memberId: { not: null },
          path: { startsWith: SHORTS_PATH_PREFIX },
        },
        _count: { _all: true },
      }),

      prisma.systemAuditLog.groupBy({
        by: ["action"],
        _count: { action: true },
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { _count: { action: "desc" } },
        take: 5,
      }),
    ]);

    const uniqueMap = new Map<string, number>();
    for (const row of uniqueByPathMember) {
      const slug = row.path.replace(SHORTS_PATH_PREFIX, "");
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
      engagement: viewsByPath.map((stat) => {
        const slug = stat.path.replace(SHORTS_PATH_PREFIX, "") || "unknown";
        return {
          shortSlug: slug,
          viewCount: stat._count._all,
          uniquePrincipals: uniqueMap.get(slug) ?? 0,
        };
      }),
      auditTrends: auditStats.map((stat) => ({
        action: stat.action,
        _count: stat._count.action,
      })),
    };
  } catch (error) {
    console.error("[ANALYTICS_FAILURE] Could not aggregate Board Intelligence:", error);
    throw new Error("Institutional Analytics subsystem offline.");
  }
}
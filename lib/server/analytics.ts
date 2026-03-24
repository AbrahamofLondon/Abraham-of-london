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

type PageViewBySlugRow = {
  slug: string | null;
  _count: { slug: number };
};

type PageViewBySlugMemberRow = {
  slug: string | null;
  memberId: string | null;
  _count: { _all: number };
};

type AuditActionRow = {
  action: string;
  _count: { action: number };
};

/**
 * INSTITUTIONAL HEALTH REPORT
 * Aligned to actual schema:
 * - PageView uses viewedAt, not createdAt
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
      viewsBySlugRaw,
      uniqueBySlugMemberRaw,
      auditStatsRaw,
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
        by: ["slug"],
        where: {
          viewedAt: { gte: thirtyDaysAgo },
          slug: { not: null },
          path: { startsWith: "/shorts/" },
        },
        _count: { slug: true },
        orderBy: { _count: { slug: "desc" } },
        take: 10,
      }),

      prisma.pageView.groupBy({
        by: ["slug", "memberId"],
        where: {
          viewedAt: { gte: thirtyDaysAgo },
          slug: { not: null },
          memberId: { not: null },
          path: { startsWith: "/shorts/" },
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

    const viewsBySlug = viewsBySlugRaw as unknown as PageViewBySlugRow[];
    const uniqueBySlugMember =
      uniqueBySlugMemberRaw as unknown as PageViewBySlugMemberRow[];
    const auditStats = auditStatsRaw as unknown as AuditActionRow[];

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
          viewCount: stat._count.slug,
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
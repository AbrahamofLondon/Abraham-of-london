import "server-only";

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type MetricSummary = {
  totalRequests: number;
  uniqueUsers: number;
  errorRate: number;
  shieldBlockRate: number;
  conversionRate: number;
  topRoutes: Array<{ route: string; count: number }>;
  topErrors: Array<{ action: string; count: number }>;
};

export type FunnelSummary = {
  pageViews: number;
  diagnosticStarts: number;
  signalShown: number;
  commitments: number;
  completions: number;
  checkouts: number;
  downloads: number;
  dropoffPoints: Array<{ stage: string; users: number; dropoffPercent: number }>;
};

// ─────────────────────────────────────────────────────────────────────────────
// METRICS
// ─────────────────────────────────────────────────────────────────────────────

export async function getMetricSummary(opts: {
  since: Date;
  until?: Date;
}): Promise<MetricSummary> {
  const until = opts.until ?? new Date();
  const baseWhere = {
    category: "observability" as const,
    createdAt: { gte: opts.since, lte: until },
  };

  const [totalRequests, shieldBlocks, errors, conversions, topRoutes, topErrors, uniqueUsers] =
    await Promise.all([
      prisma.systemAuditLog.count({ where: baseWhere }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "shield_block" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, severity: "error" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "conversion" },
      }),
      prisma.systemAuditLog.groupBy({
        by: ["resourceName"],
        where: baseWhere,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.systemAuditLog.groupBy({
        by: ["action"],
        where: { ...baseWhere, severity: "error" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.systemAuditLog.groupBy({
        by: ["actorId"],
        where: { ...baseWhere, actorId: { not: null } },
        _count: { id: true },
      }),
    ]);

  return {
    totalRequests,
    uniqueUsers: uniqueUsers.length,
    errorRate: totalRequests > 0 ? (errors / totalRequests) * 100 : 0,
    shieldBlockRate: totalRequests > 0 ? (shieldBlocks / totalRequests) * 100 : 0,
    conversionRate: totalRequests > 0 ? (conversions / totalRequests) * 100 : 0,
    topRoutes: topRoutes.map((r) => ({
      route: r.resourceName ?? "unknown",
      count: r._count.id,
    })),
    topErrors: topErrors.map((e) => ({
      action: e.action,
      count: e._count.id,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNNEL
// ─────────────────────────────────────────────────────────────────────────────

export async function getFunnelSummary(opts: {
  since: Date;
  until?: Date;
}): Promise<FunnelSummary> {
  const until = opts.until ?? new Date();
  const baseWhere = {
    category: "observability" as const,
    createdAt: { gte: opts.since, lte: until },
  };

  const [pageViews, starts, signals, commitments, completions, checkouts, downloads] =
    await Promise.all([
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "page_view" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "diagnostic_start" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "signal_shown" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "commitment_made" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "diagnostic_complete" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "checkout_completed" },
      }),
      prisma.systemAuditLog.count({
        where: { ...baseWhere, subCategory: "download_success" },
      }),
    ]);

  const stages = [
    { stage: "page_view", users: pageViews },
    { stage: "diagnostic_start", users: starts },
    { stage: "signal_shown", users: signals },
    { stage: "commitment", users: commitments },
    { stage: "diagnostic_complete", users: completions },
    { stage: "checkout", users: checkouts },
    { stage: "download", users: downloads },
  ];

  const dropoffPoints = [];
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1]!.users;
    const curr = stages[i]!.users;
    const dropoffPercent = prev > 0 ? ((prev - curr) / prev) * 100 : 0;
    dropoffPoints.push({
      stage: stages[i]!.stage,
      users: curr,
      dropoffPercent: Math.round(dropoffPercent * 10) / 10,
    });
  }

  return {
    pageViews,
    diagnosticStarts: starts,
    signalShown: signals,
    commitments,
    completions,
    checkouts,
    downloads,
    dropoffPoints,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIELD HEALTH
// ─────────────────────────────────────────────────────────────────────────────

export async function getShieldHealth(opts: {
  since: Date;
  until?: Date;
}): Promise<{
  totalBlocks: number;
  blocksByReason: Array<{ reason: string; count: number }>;
  falsePositiveRate: number;
  challengeRate: number;
}> {
  const until = opts.until ?? new Date();
  const baseWhere = {
    category: "observability" as const,
    subCategory: "shield_block",
    createdAt: { gte: opts.since, lte: until },
  };

  const [totalBlocks, blocksByReason, totalRequests] = await Promise.all([
    prisma.systemAuditLog.count({ where: baseWhere }),
    prisma.systemAuditLog.groupBy({
      by: ["action"],
      where: baseWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    }),
    prisma.systemAuditLog.count({
      where: {
        category: "observability",
        createdAt: { gte: opts.since, lte: until },
      },
    }),
  ]);

  return {
    totalBlocks,
    blocksByReason: blocksByReason.map((b) => ({
      reason: b.action,
      count: b._count.id,
    })),
    falsePositiveRate: 0, // requires manual review to calculate
    challengeRate: totalRequests > 0 ? (totalBlocks / totalRequests) * 100 : 0,
  };
}

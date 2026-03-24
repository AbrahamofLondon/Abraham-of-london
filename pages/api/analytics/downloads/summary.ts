// pages/api/analytics/downloads/summary.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { isRateLimited } from "@/lib/server/rate-limit-unified";
import { validateAdminAccess } from "@/lib/server/validation";
import { cacheResponse, getCacheKey } from "@/lib/server/cache";
import { logAuditEvent } from "@/lib/audit";

type DownloadSummary = {
  slug: string;
  contentType: string;
  eventType: string;
  count: number;
  uniqueUsers: number;
  lastDownload: string | null;
  totalSize: string;
  avgLatency: number | null;
  successRate: number;
  byTier?: Record<string, number>;
  byCountry?: Record<string, number>;
};

type AnalyticsResponse = {
  ok: boolean;
  data?: {
    summary: {
      totalDownloads: number;
      uniqueContent: number;
      uniqueUsers: number;
      totalSize: string;
      avgSuccessRate: number;
      byPeriod: Array<{ date: string; count: number }>;
    };
    topContent: DownloadSummary[];
    byContentType: Record<string, number>;
    byEventType: Record<string, number>;
    byTier: Record<string, number>;
    byCountry: Record<string, number>;
    dailyTrends: Array<{ date: string; downloads: number; users: number }>;
  };
  meta: {
    generatedAt: string;
    cacheKey?: string;
    query: {
      since: string;
      until: string;
      days: number;
      filters: Record<string, string[]>;
    };
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
};

const MAX_DAYS = 365;
const DEFAULT_DAYS = 30;
const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 1000;
const CACHE_TTL = 60;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsResponse | { ok: false; error: string }>,
) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const adminAuth = await validateAdminAccess(req);
    if (!adminAuth.valid) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const rateLimitKey = `analytics:${adminAuth.userId || "anon"}`;
    const limited = await isRateLimited({ key: "ADMIN", id: rateLimitKey });

    if (limited) {
      return res.status(429).json({ ok: false, error: "Rate limit exceeded" });
    }

    const { since, until, days, filters, page, limit } = validateQuery(req.query);

    const cacheKey = getCacheKey("analytics:downloads:summary", {
      since: since.toISOString(),
      until: until.toISOString(),
      filters: JSON.stringify(filters),
      page,
      limit,
    });

    const result = await cacheResponse<AnalyticsResponse>(
      cacheKey,
      async () => {
        const [
          summaryStats,
          topContent,
          byContentType,
          byEventType,
          byTier,
          dailyTrends,
          totalCount,
        ] = await Promise.all([
          getSummaryStats(since, until, filters),
          getTopContent(since, until, filters, page, limit),
          getGroupedCounts(since, until, filters, "contentType"),
          getGroupedCounts(since, until, filters, "eventType"),
          getTierCounts(since, until, filters),
          getDailyTrends(since, until, filters),
          getTotalContentCount(since, until, filters),
        ]);

        const enrichedTopContent = await enrichContentBreakdowns(
          since,
          until,
          filters,
          topContent,
        );

        return {
          ok: true,
          data: {
            summary: summaryStats,
            topContent: enrichedTopContent,
            byContentType,
            byEventType,
            byTier,
            byCountry: {},
            dailyTrends,
          },
          meta: {
            generatedAt: timestamp,
            cacheKey,
            query: {
              since: since.toISOString(),
              until: until.toISOString(),
              days,
              filters,
            },
            pagination: {
              page,
              limit,
              total: totalCount,
              pages: Math.ceil(totalCount / limit),
            },
          },
        };
      },
      { ttl: CACHE_TTL },
    );

    await logAuditEvent({
      actorType: "admin",
      actorId: adminAuth.userId,
      action: "analytics_query",
      resourceType: "downloads",
      status: "success",
      details: { responseTime: Date.now() - startTime },
    });

    res.setHeader("X-Response-Time", `${Date.now() - startTime}ms`);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Analytics API Error:", error);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}

function validateQuery(query: Record<string, unknown>) {
  const days = Math.min(MAX_DAYS, Math.max(1, Number(query.days) || DEFAULT_DAYS));
  const until = query.until ? new Date(String(query.until)) : new Date();
  const since = query.since
    ? new Date(String(query.since))
    : new Date(until.getTime() - days * 86400000);

  const filters: Record<string, string[]> = {};
  if (query.contentType) {
    filters.contentType = Array.isArray(query.contentType)
      ? query.contentType.map(String)
      : [String(query.contentType)];
  }
  if (query.eventType) {
    filters.eventType = Array.isArray(query.eventType)
      ? query.eventType.map(String)
      : [String(query.eventType)];
  }

  return {
    since,
    until,
    days,
    filters,
    page: Math.max(1, Number(query.page) || 1),
    limit: Math.min(MAX_PAGE_SIZE, Number(query.limit) || PAGE_SIZE),
  };
}

function toIsoDate(v: unknown): string {
  const d = new Date(String(v));
  const iso = d.toISOString();
  return iso.split("T")[0] || iso.slice(0, 10);
}

function buildWhere(since: Date, until: Date, filters: Record<string, string[]>) {
  const where: Record<string, unknown> = {
    createdAt: { gte: since, lte: until },
  };

  if (filters.contentType?.length) {
    where.contentType = { in: filters.contentType };
  }
  if (filters.eventType?.length) {
    where.eventType = { in: filters.eventType };
  }

  return where;
}

async function getSummaryStats(
  since: Date,
  until: Date,
  filters: Record<string, string[]>,
) {
  const where = buildWhere(since, until, filters);

  const [total, success, size, uniqueContent, uniqueUsers] = await Promise.all([
    prisma.downloadAuditEvent.count({ where }),
    prisma.downloadAuditEvent.count({ where: { ...where, success: true } }),
    prisma.downloadAuditEvent.aggregate({ where, _sum: { fileSize: true } }),
    prisma.downloadAuditEvent.groupBy({ by: ["slug"], where }),
    prisma.downloadAuditEvent.groupBy({
      by: ["emailHash"],
      where: { ...where, emailHash: { not: null } },
    }),
  ]);

  const byPeriod = (await prisma.$queryRaw`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM download_audit_events
    WHERE created_at BETWEEN ${since} AND ${until}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `) as Array<{ date: Date; count: bigint | number }>;

  return {
    totalDownloads: total,
    uniqueContent: uniqueContent.length,
    uniqueUsers: uniqueUsers.length,
    totalSize: size._sum.fileSize?.toString() || "0",
    avgSuccessRate: total > 0 ? (success / total) * 100 : 0,
    byPeriod: byPeriod.map((r) => ({
      date: toIsoDate(r.date),
      count: Number(r.count),
    })),
  };
}

async function getTopContent(
  since: Date,
  until: Date,
  filters: Record<string, string[]>,
  page: number,
  limit: number,
): Promise<DownloadSummary[]> {
  const offset = (page - 1) * limit;
  const rows = (await prisma.$queryRaw`
    SELECT
      slug,
      COALESCE(content_type::text, 'OTHER') as content_type,
      COALESCE(event_type::text, 'PREVIEW') as event_type,
      COUNT(*) as count,
      COUNT(DISTINCT email_hash) as unique_users,
      MAX(created_at) as last_download,
      COALESCE(SUM(file_size), 0) as total_size,
      AVG(latency_ms) as avg_latency,
      (SUM(CASE WHEN success = true THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) as success_rate
    FROM download_audit_events
    WHERE created_at BETWEEN ${since} AND ${until}
    GROUP BY slug, content_type, event_type
    ORDER BY count DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as Array<{
    slug: string;
    content_type: string;
    event_type: string;
    count: bigint | number;
    unique_users: bigint | number;
    last_download: Date | null;
    total_size: bigint | number | null;
    avg_latency: number | null;
    success_rate: number | null;
  }>;

  const filtered = rows.filter((row) => {
    const contentTypePass =
      !filters.contentType?.length || filters.contentType.includes(row.content_type);
    const eventTypePass =
      !filters.eventType?.length || filters.eventType.includes(row.event_type);
    return contentTypePass && eventTypePass;
  });

  return filtered.map((r) => ({
    slug: r.slug,
    contentType: r.content_type,
    eventType: r.event_type,
    count: Number(r.count),
    uniqueUsers: Number(r.unique_users),
    lastDownload: r.last_download ? new Date(r.last_download).toISOString() : null,
    totalSize: r.total_size?.toString() || "0",
    avgLatency: typeof r.avg_latency === "number" ? Number(r.avg_latency) : null,
    successRate: typeof r.success_rate === "number" ? Number(r.success_rate) : 0,
  }));
}

async function getGroupedCounts(
  since: Date,
  until: Date,
  filters: Record<string, string[]>,
  column: "contentType" | "eventType",
) {
  const where = buildWhere(since, until, filters);
  const res = await prisma.downloadAuditEvent.groupBy({
    by: [column],
    where,
    _count: { _all: true },
  });

  return Object.fromEntries(res.map((r) => [String(r[column]), r._count._all]));
}

async function getTierCounts(
  since: Date,
  until: Date,
  filters: Record<string, string[]>,
) {
  const where = buildWhere(since, until, filters);

  const rows = await prisma.downloadAuditEvent.findMany({
    where: {
      ...where,
      memberId: { not: null },
    },
    select: {
      member: {
        select: {
          tier: true,
        },
      },
    },
  });

  const out: Record<string, number> = {};
  for (const row of rows) {
    const tier = row.member?.tier ? String(row.member.tier) : "unknown";
    out[tier] = (out[tier] || 0) + 1;
  }
  return out;
}

async function getDailyTrends(
  since: Date,
  until: Date,
  _filters: Record<string, string[]>,
) {
  const rows = (await prisma.$queryRaw`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as downloads,
      COUNT(DISTINCT email_hash) as users
    FROM download_audit_events
    WHERE created_at BETWEEN ${since} AND ${until}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `) as Array<{ date: Date; downloads: bigint | number; users: bigint | number }>;

  return rows.map((r) => ({
    date: toIsoDate(r.date),
    downloads: Number(r.downloads),
    users: Number(r.users),
  }));
}

async function getTotalContentCount(
  since: Date,
  until: Date,
  filters: Record<string, string[]>,
) {
  const where = buildWhere(since, until, filters);
  const res = await prisma.downloadAuditEvent.groupBy({
    by: ["slug"],
    where,
  });
  return res.length;
}

async function enrichContentBreakdowns(
  since: Date,
  until: Date,
  filters: Record<string, string[]>,
  top: DownloadSummary[],
) {
  if (!top.length) return [];

  const slugs = top.map((t) => t.slug);

  const rows = await prisma.downloadAuditEvent.findMany({
    where: {
      ...buildWhere(since, until, filters),
      slug: { in: slugs },
      memberId: { not: null },
    },
    select: {
      slug: true,
      member: {
        select: {
          tier: true,
        },
      },
    },
  });

  return top.map((t) => {
    const forSlug = rows.filter((r) => r.slug === t.slug);
    const byTier: Record<string, number> = {};

    for (const row of forSlug) {
      const tier = row.member?.tier ? String(row.member.tier) : "unknown";
      byTier[tier] = (byTier[tier] || 0) + 1;
    }

    return {
      ...t,
      byTier,
      byCountry: {},
    };
  });
}
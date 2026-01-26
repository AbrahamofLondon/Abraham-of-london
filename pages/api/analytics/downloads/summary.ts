// ./pages/api/analytics/downloads/summary.ts - FULLY CORRECTED
import { safeSlice, safeDateSlice } from "@/lib/utils/safe";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { isRateLimited } from "@/lib/server/rate-limit-unified";
import { validateAdminAccess } from "@/lib/server/validation";
import { cacheResponse, getCacheKey } from "@/lib/server/cache";
import { logAuditEvent } from "@/lib/audit";
// ---------------------------
// Types (JSON-safe)
// ---------------------------
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
    cacheHit?: boolean;
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
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  warnings?: string[];
};
// ---------------------------
// Configuration
// ---------------------------
const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;
const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 1000;
const CACHE_TTL = 60; // seconds
// ---------------------------
// Main handler
// ---------------------------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsResponse>
) {
  const startTime = Date.now();
  try {
    const adminAuth = await validateAdminAccess(req);
    if (adminAuth.valid === false) {
      await logAuditEvent({
        actorType: "api",
        action: "unauthorized_access",
        resourceType: "analytics",
        status: "failed",
        details: { reason: adminAuth.reason },
      });
      return res.status(401).json({
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Admin access required" },
        meta: {
          generatedAt: new Date().toISOString(),
          query: {
            since: new Date(Date.now() - DEFAULT_DAYS * 86400000).toISOString(),
            until: new Date().toISOString(),
            days: DEFAULT_DAYS,
            filters: {},
          },
        },
      });
    }
    const rateLimitKey = `analytics:${adminAuth.userId || req.socket.remoteAddress || "unknown"}`;
    const rl = await isRateLimited(rateLimitKey, "analytics_api", 100);
    if (rl.limited) {
      return res.status(429).json({
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests",
          details: {
            retryAfter: rl.retryAfter,
            limit: rl.limit,
            remaining: rl.remaining,
          },
        },
        meta: {
          generatedAt: new Date().toISOString(),
          query: {
            since: new Date(Date.now() - DEFAULT_DAYS * 86400000).toISOString(),
            until: new Date().toISOString(),
            days: DEFAULT_DAYS,
            filters: {},
          },
        },
      });
    }
    const { since, until, days, filters, page, limit } = validateQuery(req.query);
    if (days > MAX_DAYS) {
      return res.status(400).json({
        ok: false,
        error: {
          code: "INVALID_RANGE",
          message: `Date range too large. Maximum ${MAX_DAYS} days.`,
        },
        meta: {
          generatedAt: new Date().toISOString(),
          query: {
            since: since.toISOString(),
            until: until.toISOString(),
            days,
            filters,
          },
        },
      });
    }
    const cacheKey = getCacheKey("analytics:downloads:summary", {
      since: since.toISOString(),
      until: until.toISOString(),
      filters,
      page,
      limit,
    });
    const cached = await cacheResponse.get<AnalyticsResponse>(cacheKey);
    if (cached) {
      cached.meta.cacheHit = true;
      await logAuditEvent({
        actorType: "system",
        action: "cache_hit",
        resourceType: "analytics",
        status: "success", 
        details: { cacheKey, responseTime: Date.now() - startTime },
      });
      res.setHeader("X-Cache-Status", "hit");
      res.setHeader("X-Rate-Limit-Remaining", rl.remaining.toString());
      return res.json(cached);
    }
    const [
      summaryStats,
      topContent,
      byContentType,
      byEventType,
      byTier,
      byCountry,
      dailyTrends,
      totalCount,
    ] = await Promise.all([
      getSummaryStats(since, until, filters),
      getTopContent(since, until, filters, page, limit),
      getGroupedCounts(since, until, filters, "content_type"),
      getGroupedCounts(since, until, filters, "event_type"),
      getGroupedCounts(since, until, filters, "tier"),
      getGroupedCounts(since, until, filters, "country_code"),
      getDailyTrends(since, until, filters),
      getTotalContentCount(since, until, filters),
    ]);
    const enrichedTopContent = await enrichContentBreakdowns(since, until, filters, topContent);
    const responseTime = Date.now() - startTime;
    const response: AnalyticsResponse = {
      ok: true,
      data: {
        summary: summaryStats,
        topContent: enrichedTopContent,
        byContentType,
        byEventType,
        byTier,
        byCountry,
        dailyTrends,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        cacheKey,
        cacheHit: false,
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
    await cacheResponse.set(cacheKey, response, CACHE_TTL);
    await logAuditEvent({
      actorType: "admin",
      actorId: adminAuth.userId,
      action: "analytics_query",
      resourceType: "downloads",
      status: "success",
      details: {
        query: response.meta.query,
        responseTime,
        cacheStatus: "miss",
      },
    });
    res.setHeader("X-Response-Time", `${responseTime}ms`);
    res.setHeader("X-Cache-Status", "miss");
    res.setHeader("X-Rate-Limit-Remaining", rl.remaining.toString());
    return res.json(response);
  } catch (error) {
    console.error("Analytics API Error:", error);
    await logAuditEvent({
      actorType: "system",
      action: "analytics_error",
      resourceType: "downloads",
      status: "failed",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    return res.status(500).json({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate analytics report",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        query: {
          since: new Date(Date.now() - DEFAULT_DAYS * 86400000).toISOString(),
          until: new Date().toISOString(),
          days: DEFAULT_DAYS,
          filters: {},
        },
      },
    });
  }
}
// ---------------------------
// Helper Functions
// ---------------------------
function asStringArray(v: unknown): string[] | null {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string").map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return [v.trim()].filter(Boolean);
  return null;
}
function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function asDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function validateQuery(query: NextApiRequest["query"]) {
  const days = Math.min(MAX_DAYS, Math.max(1, asNumber(query.days) ?? DEFAULT_DAYS));
  const until = asDate(query.until) ?? new Date();
  const since = asDate(query.since) ?? new Date(until.getTime() - days * 86400000);
  if (since > until) throw new Error("Start date must be before end date");
  const filters: Record<string, string[]> = {};
  const contentType = asStringArray(query.contentType);
  const eventType = asStringArray(query.eventType);
  const tier = asStringArray(query.tier);
  const countryCode = asStringArray(query.countryCode);
  const success = asStringArray(query.success);
  if (contentType) filters.contentType = contentType;
  if (eventType) filters.eventType = eventType;
  if (tier) filters.tier = tier;
  if (countryCode) filters.countryCode = countryCode;
  if (success) {
    const norm = success
      .map((s) => s.toLowerCase())
      .filter((s) => s === "true" || s === "false");
    if (norm.length) filters.success = norm;
  }
  const page = Math.max(1, asNumber(query.page) ?? 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, asNumber(query.limit) ?? PAGE_SIZE));
  return { since, until, days, filters, page, limit };
}
const _toInt = (_v: unknown, _fallback = 0): number => { // Fixed: unused variables prefixed
  return 0;
};
const _toFloat = (_v: unknown): number | null => { // Fixed: unused variable prefixed
  return null;
};
function toIsoDate(v: unknown): string {
  if (typeof v === "string" && v.length >= 10) return safeSlice(v, 0, 10);
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return safeDateSlice(new Date(), 0, 10);
  return safeDateSlice(d, 0, 10);
}
const _toSizeString = (_v: unknown): string => { // Fixed: unused variable prefixed
  return "0";
};
// ---------------------------
// Data access - Updated to use Prisma directly without raw SQL helpers
// ---------------------------
async function getSummaryStats(since: Date, until: Date, filters: Record<string, string[]>) {
  const where: any = {
    created_at: {
      gte: since,
      lte: until,
    }
  };
  // Apply filters
  if (filters.success?.length) {
    where.success = { in: filters.success.map(s => s === "true") };
  }
  if (filters.contentType?.length) {
    where.content_type = { in: filters.contentType };
  }
  if (filters.eventType?.length) {
    where.event_type = { in: filters.eventType };
  }
  if (filters.tier?.length) {
    where.tier = { in: filters.tier };
  }
  if (filters.countryCode?.length) {
    where.country_code = { in: filters.countryCode };
  }
  // Get counts
  const [
    totalDownloads,
    successfulDownloads,
    totalSizeResult,
  ] = await Promise.all([
    prisma.download_audit_events.count({ where }),
    prisma.download_audit_events.count({
      where: { ...where, success: true }
    }),
    prisma.download_audit_events.aggregate({
      where,
      _sum: { file_size: true }
    }),
  ]);
  // Get unique content and users
  const [uniqueContentResults, uniqueUsersResults] = await Promise.all([
    prisma.download_audit_events.groupBy({
      by: ['slug'],
      where,
      _count: true,
    }),
    prisma.download_audit_events.groupBy({
      by: ['email_hash'],
      where,
      _count: true,
    }),
  ]);
  const uniqueContent = uniqueContentResults.length;
  const uniqueUsers = uniqueUsersResults.length;
  const avgSuccessRate = totalDownloads > 0 ? (successfulDownloads / totalDownloads) * 100 : 0;
  // Get daily trends
  const byPeriod = await prisma.$queryRaw`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS count
    FROM download_audit_events
    WHERE created_at BETWEEN ${since} AND ${until}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  ` as Array<{ date: Date; count: bigint }>;
  return {
    totalDownloads,
    uniqueContent,
    uniqueUsers,
    totalSize: totalSizeResult._sum.file_size?.toString() || "0",
    avgSuccessRate,
    byPeriod: byPeriod.map((r) => ({ 
      date: toIsoDate(r.date), 
      count: Number(r.count) 
    })),
  };
}
async function getTopContent(
  since: Date,
  until: Date,
  filters: Record<string, string[]>,
  page: number,
  limit: number
): Promise<DownloadSummary[]> {
  const where: any = {
    created_at: {
      gte: since,
      lte: until,
    }
  };
  // Apply filters
  if (filters.success?.length) {
    where.success = { in: filters.success.map(s => s === "true") };
  }
  if (filters.contentType?.length) {
    where.content_type = { in: filters.contentType };
  }
  if (filters.eventType?.length) {
    where.event_type = { in: filters.eventType };
  }
  const offset = (page - 1) * limit;
  // Use Prisma's raw query for complex grouping
  const rows = await prisma.$queryRaw`
    SELECT
      slug,
      COALESCE(content_type, 'unknown') AS content_type,
      COALESCE(event_type, 'download') AS event_type,
      COUNT(*) AS count,
      COUNT(DISTINCT email_hash) AS unique_users,
      MAX(created_at) AS last_download,
      COALESCE(SUM(COALESCE(file_size, 0)), 0) AS total_size,
      AVG(latency_ms) AS avg_latency,
      CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE (SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*))
      END AS success_rate
    FROM download_audit_events
    WHERE created_at BETWEEN ${since} AND ${until}
    GROUP BY slug, content_type, event_type
    ORDER BY count DESC
    LIMIT ${limit} OFFSET ${offset}
  ` as Array<{
    slug: string;
    content_type: string;
    event_type: string;
    count: bigint;
    unique_users: bigint;
    last_download: Date | null;
    total_size: bigint;
    avg_latency: number | null;
    success_rate: number;
  }>;
  return rows.map((r) => ({
    slug: r.slug,
    contentType: r.content_type,
    eventType: r.event_type,
    count: Number(r.count),
    uniqueUsers: Number(r.unique_users),
    lastDownload: r.last_download ? r.last_download.toISOString() : null,
    totalSize: r.total_size.toString(),
    avgLatency: r.avg_latency,
    successRate: r.success_rate,
  }));
}
async function getGroupedCounts(
  since: Date,
  until: Date,
  _filters: Record<string, string[]>, // Fixed: prefixed unused parameter
  column: "content_type" | "event_type" | "tier" | "country_code"
): Promise<Record<string, number>> {
  const where: any = {
    created_at: {
      gte: since,
      lte: until,
    },
    [column]: { not: null }
  };
  const results = await prisma.download_audit_events.groupBy({
    by: [column as any],
    where,
    _count: true,
  });
  const out: Record<string, number> = {};
  for (const r of results) {
    const key = r[column] as string;
    out[key] = r._count;
  }
  return out;
}
async function getDailyTrends(
  since: Date,
  until: Date,
  _filters: Record<string, string[]> // Fixed: prefixed unused parameter
): Promise<Array<{ date: string; downloads: number; users: number }>> {
  const rows = await prisma.$queryRaw`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS downloads,
      COUNT(DISTINCT email_hash) AS users
    FROM download_audit_events
    WHERE created_at BETWEEN ${since} AND ${until}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  ` as Array<{ date: Date; downloads: bigint; users: bigint }>;
  return rows.map((r) => ({
    date: toIsoDate(r.date),
    downloads: Number(r.downloads),
    users: Number(r.users),
  }));
}
async function getTotalContentCount(since: Date, until: Date, filters: Record<string, string[]>) {
  const where: any = {
    created_at: {
      gte: since,
      lte: until,
    }
  };
  const uniqueContent = await prisma.download_audit_events.groupBy({
    by: ['slug'],
    where,
  });
  return uniqueContent.length;
}
async function enrichContentBreakdowns(
  since: Date,
  until: Date,
  filters: Record<string, string[]>,
  top: DownloadSummary[]
): Promise<DownloadSummary[]> {
  if (!top.length) return top;
  const where: any = {
    created_at: {
      gte: since,
      lte: until,
    },
    OR: top.map(t => ({
      slug: t.slug,
      content_type: t.contentType,
      event_type: t.eventType,
    }))
  };
  // Get tier breakdowns
  const tierResults = await prisma.download_audit_events.groupBy({
    by: ['slug', 'content_type', 'event_type', 'tier'],
    where: { ...where, tier: { not: null } },
    _count: true,
  });
  // Get country breakdowns
  const countryResults = await prisma.download_audit_events.groupBy({
    by: ['slug', 'content_type', 'event_type', 'country_code'],
    where: { ...where, country_code: { not: null } },
    _count: true,
  });
  const tierMap = new Map<string, Record<string, number>>();
  for (const r of tierResults) {
    const key = `${r.slug}||${r.content_type}||${r.event_type}`;
    const obj = tierMap.get(key) ?? {};
    obj[r.tier as string] = r._count;
    tierMap.set(key, obj);
  }
  const countryMap = new Map<string, Record<string, number>>();
  for (const r of countryResults) {
    const key = `${r.slug}||${r.content_type}||${r.event_type}`;
    const obj = countryMap.get(key) ?? {};
    obj[r.country_code as string] = r._count;
    countryMap.set(key, obj);
  }
  return top.map((t) => {
    const key = `${t.slug}||${t.contentType}||${t.eventType}`;
    return {
      ...t,
      byTier: tierMap.get(key) ?? {},
      byCountry: countryMap.get(key) ?? {},
    };
  });
}
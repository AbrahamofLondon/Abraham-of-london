// pages/api/analytics/downloads/summary.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { isRateLimited } from "@/lib/server/rate-limit";
import { validateAdminAccess } from "@/lib/server/validation";
import { cacheResponse, getCacheKey } from "@/lib/server/cache";
import { logAuditEvent } from "@/lib/server/audit";
import { Prisma } from "@prisma/client";

/**
 * ENTERPRISE NOTES:
 * - SQLite + Prisma: use parameterized SQL for DISTINCT counts + date bucketing + safe IN filters.
 * - JSON: never return bigint (convert to string).
 */

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
  totalSize: string; // bigint -> string for JSON safety
  avgLatency: number | null;
  successRate: number; // 0..100
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
      totalSize: string; // bigint -> string
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
    // 1) Admin auth - FIXED: Use explicit type checking
    const adminAuth = await validateAdminAccess(req);
    
    // Check if valid is false explicitly
    if (adminAuth.valid === false) {
      // TypeScript now knows adminAuth has 'reason' property
      await logAuditEvent({
        actorType: "api",
        action: "unauthorized_access",
        resourceType: "analytics",
        status: "failed",
        details: { reason: adminAuth.reason }, // ✅ Fixed
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

    // 2) Rate limiting (compat wrapper)
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

    // 3) Query validation
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

    // 4) Cache
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
        details: { cacheKey, responseTime: Date.now() - startTime },
      });

      res.setHeader("X-Cache-Status", "hit");
      res.setHeader("X-Rate-Limit-Remaining", rl.remaining.toString());
      return res.json(cached);
    }

    // 5) Fetch data (safe SQL + batching)
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

    // Enrich top content with tier/country distributions (batch, not N+1)
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
    // eslint-disable-next-line no-console
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
// Query parsing (typed, safe)
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

  // Normalize success to "true"/"false" only
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

// ---------------------------
// SQL helpers (safe composition)
// ---------------------------

function whereSql(since: Date, until: Date, filters: Record<string, string[]>) {
  const parts: Prisma.Sql[] = [
    Prisma.sql`created_at BETWEEN ${since} AND ${until}`,
  ];

  if (filters.success?.length) {
    const bools = filters.success.map((s) => (s === "true" ? 1 : 0));
    parts.push(Prisma.sql`success IN (${Prisma.join(bools)})`);
  }

  if (filters.contentType?.length) parts.push(Prisma.sql`content_type IN (${Prisma.join(filters.contentType)})`);
  if (filters.eventType?.length) parts.push(Prisma.sql`event_type IN (${Prisma.join(filters.eventType)})`);
  if (filters.tier?.length) parts.push(Prisma.sql`tier IN (${Prisma.join(filters.tier)})`);
  if (filters.countryCode?.length) parts.push(Prisma.sql`country_code IN (${Prisma.join(filters.countryCode)})`);

  // FIXED: Use string " AND " instead of Prisma.sql` AND `
  return Prisma.join(parts, " AND ");
}

function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toFloat(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toIsoDate(v: unknown): string {
  // raw SQLite DATE() returns "YYYY-MM-DD"
  if (typeof v === "string" && v.length >= 10) return v.slice(0, 10);
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function toSizeString(v: unknown): string {
  // SUM(file_size) may come back as number | bigint | string depending on driver
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return Math.trunc(v).toString();
  if (typeof v === "string" && v.trim()) {
    // some drivers return numeric strings
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n).toString();
    return v;
  }
  return "0";
}

// ---------------------------
// Data access
// ---------------------------

async function getSummaryStats(since: Date, until: Date, filters: Record<string, string[]>) {
  const where = whereSql(since, until, filters);

  const row = await prisma.$queryRaw<
    Array<{
      total_downloads: unknown;
      unique_content: unknown;
      unique_users: unknown;
      successful_downloads: unknown;
      total_size: unknown;
    }>
  >(Prisma.sql`
    SELECT
      COUNT(*) AS total_downloads,
      COUNT(DISTINCT slug) AS unique_content,
      COUNT(DISTINCT email_hash) AS unique_users,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS successful_downloads,
      COALESCE(SUM(COALESCE(file_size, 0)), 0) AS total_size
    FROM download_audit_events
    WHERE ${where}
  `);

  const stats = row[0] ?? {
    total_downloads: 0,
    unique_content: 0,
    unique_users: 0,
    successful_downloads: 0,
    total_size: 0,
  };

  const totalDownloads = toInt(stats.total_downloads);
  const successfulDownloads = toInt(stats.successful_downloads);
  const avgSuccessRate = totalDownloads > 0 ? (successfulDownloads / totalDownloads) * 100 : 0;

  const byPeriod = await prisma.$queryRaw<
    Array<{ date: unknown; count: unknown }>
  >(Prisma.sql`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS count
    FROM download_audit_events
    WHERE ${where}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `);

  return {
    totalDownloads,
    uniqueContent: toInt(stats.unique_content),
    uniqueUsers: toInt(stats.unique_users),
    totalSize: toSizeString(stats.total_size),
    avgSuccessRate,
    byPeriod: byPeriod.map((r) => ({ date: toIsoDate(r.date), count: toInt(r.count) })),
  };
}

async function getTopContent(
  since: Date,
  until: Date,
  filters: Record<string, string[]>,
  page: number,
  limit: number
): Promise<DownloadSummary[]> {
  const where = whereSql(since, until, filters);
  const offset = (page - 1) * limit;

  const rows = await prisma.$queryRaw<
    Array<{
      slug: string;
      content_type: string;
      event_type: string;
      count: unknown;
      unique_users: unknown;
      last_download: unknown;
      total_size: unknown;
      avg_latency: unknown;
      success_rate: unknown; // 0..100 float
    }>
  >(Prisma.sql`
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
    WHERE ${where}
    GROUP BY slug, content_type, event_type
    ORDER BY count DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return rows.map((r) => ({
    slug: r.slug,
    contentType: r.content_type,
    eventType: r.event_type,
    count: toInt(r.count),
    uniqueUsers: toInt(r.unique_users),
    lastDownload: r.last_download ? new Date(String(r.last_download)).toISOString() : null,
    totalSize: toSizeString(r.total_size),
    avgLatency: toFloat(r.avg_latency),
    successRate: toFloat(r.success_rate) ?? 0,
  }));
}

async function getGroupedCounts(
  since: Date,
  until: Date,
  filters: Record<string, string[]>,
  column: "content_type" | "event_type" | "tier" | "country_code"
): Promise<Record<string, number>> {
  const where = whereSql(since, until, filters);

  const rows = await prisma.$queryRaw<Array<{ key: unknown; count: unknown }>>(
    Prisma.sql`
      SELECT ${Prisma.raw(column)} AS key, COUNT(*) AS count
      FROM download_audit_events
      WHERE ${where} AND ${Prisma.raw(column)} IS NOT NULL
      GROUP BY ${Prisma.raw(column)}
    `
  );

  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = typeof r.key === "string" ? r.key : String(r.key);
    out[k] = toInt(r.count);
  }
  return out;
}

async function getDailyTrends(
  since: Date,
  until: Date,
  filters: Record<string, string[]>
): Promise<Array<{ date: string; downloads: number; users: number }>> {
  const where = whereSql(since, until, filters);

  const rows = await prisma.$queryRaw<
    Array<{ date: unknown; downloads: unknown; users: unknown }>
  >(Prisma.sql`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS downloads,
      COUNT(DISTINCT email_hash) AS users
    FROM download_audit_events
    WHERE ${where}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `);

  return rows.map((r) => ({
    date: toIsoDate(r.date),
    downloads: toInt(r.downloads),
    users: toInt(r.users),
  }));
}

async function getTotalContentCount(since: Date, until: Date, filters: Record<string, string[]>) {
  const where = whereSql(since, until, filters);

  const rows = await prisma.$queryRaw<Array<{ total: unknown }>>(Prisma.sql`
    SELECT COUNT(*) AS total FROM (
      SELECT 1
      FROM download_audit_events
      WHERE ${where}
      GROUP BY slug, content_type, event_type
    ) t
  `);

  return toInt(rows[0]?.total);
}
/**
 * Batch breakdowns for the current page of topContent:
 * - byTier + byCountry per (slug, contentType, eventType) key.
 * This avoids N+1 while staying SQLite-friendly.
 */
async function enrichContentBreakdowns(
  since: Date,
  until: Date,
  filters: Record<string, string[]>,
  top: DownloadSummary[]
): Promise<DownloadSummary[]> {
  if (!top.length) return top;

  const where = whereSql(since, until, filters);

  // Build a list of composite keys to restrict breakdown queries to just the current page
  // SQLite doesn't have tuple IN nicely, so we OR-chunk safely.
  const orParts: Prisma.Sql[] = top.map((t) => Prisma.sql`
    (slug = ${t.slug} AND COALESCE(content_type,'unknown') = ${t.contentType} AND COALESCE(event_type,'download') = ${t.eventType})
  `);

  // FIXED: Use string " OR " instead of Prisma.sql` OR `
  const scope = Prisma.join(orParts, " OR ");

  const tierRows = await prisma.$queryRaw<
    Array<{ slug: string; content_type: string; event_type: string; tier: string | null; count: unknown }>
  >(Prisma.sql`
    SELECT
      slug,
      COALESCE(content_type,'unknown') AS content_type,
      COALESCE(event_type,'download') AS event_type,
      tier,
      COUNT(*) AS count
    FROM download_audit_events
    WHERE ${where} AND (${scope}) AND tier IS NOT NULL
    GROUP BY slug, content_type, event_type, tier
  `);

  const countryRows = await prisma.$queryRaw<
    Array<{ slug: string; content_type: string; event_type: string; country_code: string | null; count: unknown }>
  >(Prisma.sql`
    SELECT
      slug,
      COALESCE(content_type,'unknown') AS content_type,
      COALESCE(event_type,'download') AS event_type,
      country_code,
      COUNT(*) AS count
    FROM download_audit_events
    WHERE ${where} AND (${scope}) AND country_code IS NOT NULL
    GROUP BY slug, content_type, event_type, country_code
  `);

  const tierMap = new Map<string, Record<string, number>>();
  for (const r of tierRows) {
    const key = `${r.slug}||${r.content_type}||${r.event_type}`;
    const obj = tierMap.get(key) ?? {};
    obj[r.tier ?? "unknown"] = toInt(r.count);
    tierMap.set(key, obj);
  }

  const countryMap = new Map<string, Record<string, number>>();
  for (const r of countryRows) {
    const key = `${r.slug}||${r.content_type}||${r.event_type}`;
    const obj = countryMap.get(key) ?? {};
    obj[r.country_code ?? "??"] = toInt(r.count);
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

// Keep config (fine)
export const config = {
  api: {
    responseLimit: false,
    bodyParser: { sizeLimit: "10mb" },
  },
};
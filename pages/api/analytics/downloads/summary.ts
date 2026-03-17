// ./pages/api/analytics/downloads/summary.ts - FINAL COMPILE FIX
import { safeSlice, safeDateSlice } from "@/lib/utils/safe";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { isRateLimited } from "@/lib/server/rate-limit-unified";
import { validateAdminAccess } from "@/lib/server/validation";
import { cacheResponse, getCacheKey } from "@/lib/server/cache";
import { logAuditEvent } from "@/lib/audit";

// ---------------------------
// Types
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
};

const MAX_DAYS = 365;
const DEFAULT_DAYS = 30;
const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 1000;
const CACHE_TTL = 60;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
          byCountry,
          dailyTrends,
          totalCount,
        ] = await Promise.all([
          getSummaryStats(since, until),
          getTopContent(since, until, page, limit),
          getGroupedCounts(since, until, "contentType"),
          getGroupedCounts(since, until, "eventType"),
          getGroupedCounts(since, until, "tier"),
          getGroupedCounts(since, until, "countryCode"),
          getDailyTrends(since, until),
          getTotalContentCount(since, until),
        ]);

        const enrichedTopContent = await enrichContentBreakdowns(since, until, topContent);

        return {
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
            generatedAt: timestamp,
            cacheKey,
            query: { since: since.toISOString(), until: until.toISOString(), days, filters },
            pagination: {
              page,
              limit,
              total: totalCount,
              pages: Math.ceil(totalCount / limit),
            },
          },
        };
      },
      { ttl: CACHE_TTL }
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

  } catch (error: any) {
    console.error("Analytics API Error:", error);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}

// --- HELPERS ---

function validateQuery(query: any) {
  const days = Math.min(MAX_DAYS, Math.max(1, Number(query.days) || DEFAULT_DAYS));
  const until = query.until ? new Date(query.until) : new Date();
  const since = query.since ? new Date(query.since) : new Date(until.getTime() - days * 86400000);
  
  const filters: Record<string, string[]> = {};
  if (query.contentType) filters.contentType = Array.isArray(query.contentType) ? query.contentType : [query.contentType];
  
  return { 
    since, 
    until, 
    days, 
    filters, 
    page: Math.max(1, Number(query.page) || 1), 
    limit: Math.min(MAX_PAGE_SIZE, Number(query.limit) || PAGE_SIZE) 
  };
}

function toIsoDate(v: any): string {
  const d = new Date(v);
  const iso = d.toISOString();
  return iso.split('T')[0] || iso.slice(0, 10);
}

// --- DATA ACCESS ---

async function getSummaryStats(since: Date, until: Date) {
  // ✅ FIXED: Using createdAt instead of created_at based on Type Error
  const where = { createdAt: { gte: since, lte: until } };
  const [total, success, size] = await Promise.all([
    prisma.downloadAuditEvent.count({ where }),
    prisma.downloadAuditEvent.count({ where: { ...where, success: true } }),
    prisma.downloadAuditEvent.aggregate({ where, _sum: { fileSize: true } }),
  ]);

  const uniqueContent = await prisma.downloadAuditEvent.groupBy({ by: ['slug'], where });
  const uniqueUsers = await prisma.downloadAuditEvent.groupBy({ by: ['emailHash'], where });

  const byPeriod = await prisma.$queryRaw`
    SELECT DATE(created_at) as date, COUNT(*) as count 
    FROM download_audit_events 
    WHERE created_at BETWEEN ${since} AND ${until} 
    GROUP BY DATE(created_at) ORDER BY date ASC
  ` as any[];

  return {
    totalDownloads: total,
    uniqueContent: uniqueContent.length,
    uniqueUsers: uniqueUsers.length,
    totalSize: size._sum.fileSize?.toString() || "0",
    avgSuccessRate: total > 0 ? (success / total) * 100 : 0,
    byPeriod: byPeriod.map(r => ({ date: toIsoDate(r.date), count: Number(r.count) })),
  };
}

async function getTopContent(since: Date, until: Date, page: number, limit: number): Promise<DownloadSummary[]> {
  const offset = (page - 1) * limit;
  const rows = await prisma.$queryRaw`
    SELECT slug, 
           COALESCE(content_type, 'unknown') as content_type, 
           COALESCE(event_type, 'download') as event_type, 
           COUNT(*) as count, 
           COUNT(DISTINCT email_hash) as unique_users,
           MAX(created_at) as last_download, 
           SUM(COALESCE(file_size, 0)) as total_size, 
           AVG(latency_ms) as avg_latency,
           (SUM(CASE WHEN success = true THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) as success_rate
    FROM download_audit_events 
    WHERE created_at BETWEEN ${since} AND ${until}
    GROUP BY slug, content_type, event_type 
    ORDER BY count DESC 
    LIMIT ${limit} OFFSET ${offset}
  ` as any[];

  return rows.map(r => ({
    slug: r.slug,
    contentType: r.content_type,
    eventType: r.event_type,
    count: Number(r.count),
    uniqueUsers: Number(r.unique_users),
    lastDownload: r.last_download ? new Date(r.last_download).toISOString() : null,
    totalSize: r.total_size?.toString() || "0",
    avgLatency: r.avg_latency ? Number(r.avg_latency) : null,
    successRate: r.success_rate ? Number(r.success_rate) : 0,
  }));
}

async function getGroupedCounts(since: Date, until: Date, column: string) {
  const res = await (prisma.downloadAuditEvent as any).groupBy({
    by: [column],
    where: { createdAt: { gte: since, lte: until }, [column]: { not: null } },
    _count: true
  });
  return Object.fromEntries(res.map((r: any) => [r[column], r._count]));
}

async function getDailyTrends(since: Date, until: Date) {
  const rows = await prisma.$queryRaw`
    SELECT DATE(created_at) as date, COUNT(*) as downloads, COUNT(DISTINCT email_hash) as users
    FROM download_audit_events WHERE created_at BETWEEN ${since} AND ${until}
    GROUP BY DATE(created_at) ORDER BY date ASC
  ` as any[];
  return rows.map(r => ({ date: toIsoDate(r.date), downloads: Number(r.downloads), users: Number(r.users) }));
}

async function getTotalContentCount(since: Date, until: Date) {
  const res = await prisma.downloadAuditEvent.groupBy({
    by: ['slug'],
    where: { createdAt: { gte: since, lte: until } }
  });
  return res.length;
}

async function enrichContentBreakdowns(since: Date, until: Date, top: DownloadSummary[]) {
  if (!top.length) return [];
  const slugs = top.map(t => t.slug);
  const [tiers, countries] = await Promise.all([
    (prisma.downloadAuditEvent as any).groupBy({
      by: ['slug', 'tier'],
      where: { createdAt: { gte: since, lte: until }, slug: { in: slugs }, tier: { not: null } },
      _count: true
    }),
    (prisma.downloadAuditEvent as any).groupBy({
      by: ['slug', 'countryCode'],
      where: { createdAt: { gte: since, lte: until }, slug: { in: slugs }, countryCode: { not: null } },
      _count: true
    })
  ]);

  return top.map(t => {
    const tResults = (tiers as any[]).filter(r => r.slug === t.slug);
    const cResults = (countries as any[]).filter(r => r.slug === t.slug);
    
    return {
      ...t,
      byTier: Object.fromEntries(tResults.map(r => [r.tier, r._count])),
      byCountry: Object.fromEntries(cResults.map(r => [r.countryCode, r._count]))
    };
  });
}
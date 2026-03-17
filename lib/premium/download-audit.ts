import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logging";

export type AuditParams = {
  tokenId?: string | null;
  contentId: string;
  userId?: string | null;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  method?: string | null;
  success: boolean;
  statusCode: number;
  reason?: string | null;
  watermarkId?: string | null;
  sourceChecksum?: string | null;
  deliveredChecksum?: string | null;
  fileSize?: number | null;
  pageCount?: number | null;
  downloadDuration?: number | null;
  userTier?: string | null;
  requiredTier?: string | null;
};

export type AuditQueryParams = {
  tokenId?: string;
  contentId?: string;
  userId?: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
};

export type AuditSummary = {
  totalAttempts: number;
  successfulDownloads: number;
  failedDownloads: number;
  uniqueUsers: number;
  uniqueContent: number;
  byStatusCode: Record<number, number>;
  byDate: Record<string, number>;
};

function hashIp(ip?: string | null): string | null {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

function generateRequestFingerprint(params: Partial<AuditParams>): string {
  const components = [
    params.ipAddress ?? "",
    params.userAgent ?? "",
    params.sessionId ?? "",
    params.userId ?? "",
  ].join("|");

  return crypto
    .createHash("sha256")
    .update(components)
    .digest("hex")
    .substring(0, 16);
}

function sanitizeUserAgent(ua?: string | null): string | null {
  if (!ua) return null;
  return ua.length > 500 ? `${ua.substring(0, 500)}...` : ua;
}

function sanitizeReferrer(ref?: string | null): string | null {
  if (!ref) return null;

  try {
    const url = new URL(ref);
    return `${url.protocol}//${url.hostname}${url.pathname}`;
  } catch {
    return ref.length > 500 ? ref.substring(0, 500) : ref;
  }
}

export async function recordPremiumDownloadAttempt(
  params: AuditParams,
): Promise<void> {
  const startTime = Date.now();

  try {
    const requestFingerprint = generateRequestFingerprint(params);
    const sanitizedUA = sanitizeUserAgent(params.userAgent);
    const sanitizedRef = sanitizeReferrer(params.referrer);

    await prisma.premiumDownloadAttempt.create({
      data: {
        tokenId: params.tokenId ?? null,
        contentId: params.contentId,
        userId: params.userId ?? null,
        sessionId: params.sessionId ?? null,
        ipAddress: params.ipAddress ?? null,
        ipHash: hashIp(params.ipAddress),
        userAgent: sanitizedUA,
        referrer: sanitizedRef,
        method: params.method ?? null,
        success: params.success,
        statusCode: params.statusCode,
        reason: params.reason ?? null,
        watermarkId: params.watermarkId ?? null,
        sourceChecksum: params.sourceChecksum ?? null,
        deliveredChecksum: params.deliveredChecksum ?? null,
        fileSize: params.fileSize ?? null,
        pageCount: params.pageCount ?? null,
        downloadDuration: params.downloadDuration ?? null,
        userTier: params.userTier ?? null,
        requiredTier: params.requiredTier ?? null,
        requestFingerprint,
      },
    });

    if (!params.success && params.statusCode >= 500) {
      logger.error(
        `[AUDIT_CRITICAL] Download failed for content ${params.contentId}: ${params.reason ?? "Unknown reason"}`,
      );
    }

    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn(
        `[AUDIT_PERF] Slow audit write (${duration}ms) for content ${params.contentId}`,
      );
    }
  } catch (error) {
    console.error("[PREMIUM_DOWNLOAD_AUDIT_ERROR]", error);

    logger.error(
      `[AUDIT_FALLBACK] Failed to record download attempt: ${JSON.stringify({
        ...params,
        ipAddress: params.ipAddress ? "[REDACTED]" : null,
        userAgent: sanitizeUserAgent(params.userAgent),
        requestFingerprint: generateRequestFingerprint(params),
      })}`,
    );
  }
}

export async function queryDownloadAudit(params: AuditQueryParams): Promise<any[]> {
  const {
    tokenId,
    contentId,
    userId,
    sessionId,
    startDate,
    endDate,
    success,
    limit = 100,
    offset = 0,
  } = params;

  const where: any = {};

  if (tokenId) where.tokenId = tokenId;
  if (contentId) where.contentId = contentId;
  if (userId) where.userId = userId;
  if (sessionId) where.sessionId = sessionId;
  if (typeof success === "boolean") where.success = success;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  try {
    return await prisma.premiumDownloadAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 1000),
      skip: offset,
    });
  } catch (error) {
    logger.error(`[AUDIT_QUERY_ERROR] Failed to query audits: ${error}`);
    return [];
  }
}

export async function getAuditSummary(params: {
  contentId?: string;
  userId?: string;
  days?: number;
}): Promise<AuditSummary> {
  const { contentId, userId, days = 30 } = params;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const where: any = {
    createdAt: { gte: startDate },
  };

  if (contentId) where.contentId = contentId;
  if (userId) where.userId = userId;

  try {
    const attempts = await prisma.premiumDownloadAttempt.findMany({
      where,
      select: {
        success: true,
        statusCode: true,
        userId: true,
        contentId: true,
        createdAt: true,
      },
    });

    const summary: AuditSummary = {
      totalAttempts: attempts.length,
      successfulDownloads: attempts.filter((a) => a.success).length,
      failedDownloads: attempts.filter((a) => !a.success).length,
      uniqueUsers: new Set(attempts.map((a) => a.userId).filter(Boolean)).size,
      uniqueContent: new Set(attempts.map((a) => a.contentId)).size,
      byStatusCode: {},
      byDate: {},
    };

    for (const attempt of attempts) {
      summary.byStatusCode[attempt.statusCode] =
        (summary.byStatusCode[attempt.statusCode] || 0) + 1;

      const dateKey = attempt.createdAt.toISOString().split("T")[0];
      if (dateKey) {
        summary.byDate[dateKey] = (summary.byDate[dateKey] || 0) + 1;
      }
    }

    return summary;
  } catch (error) {
    logger.error(`[AUDIT_SUMMARY_ERROR] Failed to generate summary: ${error}`);
    return {
      totalAttempts: 0,
      successfulDownloads: 0,
      failedDownloads: 0,
      uniqueUsers: 0,
      uniqueContent: 0,
      byStatusCode: {},
      byDate: {},
    };
  }
}

export async function cleanupOldAuditRecords(daysToKeep = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  try {
    const result = await prisma.premiumDownloadAttempt.deleteMany({
      where: {
        createdAt: { lt: cutoff },
      },
    });

    logger.info(`[AUDIT_CLEANUP] Removed ${result.count} old audit records`);
    return result.count;
  } catch (error) {
    logger.error(`[AUDIT_CLEANUP_ERROR] Failed to cleanup audit records: ${error}`);
    return 0;
  }
}

export async function getDownloadAnalytics(contentId: string): Promise<{
  totalDownloads: number;
  uniqueUsers: number;
  successRate: number;
  averageStatusCode: number;
  lastDownloadAt: Date | null;
  downloadsByDay: Array<{ date: string; count: number }>;
}> {
  try {
    const downloads = await prisma.premiumDownloadAttempt.findMany({
      where: { contentId },
      orderBy: { createdAt: "desc" },
    });

    if (downloads.length === 0) {
      return {
        totalDownloads: 0,
        uniqueUsers: 0,
        successRate: 0,
        averageStatusCode: 0,
        lastDownloadAt: null,
        downloadsByDay: [],
      };
    }

    const successful = downloads.filter((d) => d.success);
    const uniqueUsers = new Set(downloads.map((d) => d.userId).filter(Boolean)).size;

    const byDay: Record<string, number> = {};
    for (const d of downloads) {
      const day = d.createdAt.toISOString().split("T")[0];
      if (day) byDay[day] = (byDay[day] || 0) + 1;
    }

    const downloadsByDay = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const avgStatusCode = Math.round(
      downloads.reduce((sum, d) => sum + d.statusCode, 0) / downloads.length,
    );

    return {
      totalDownloads: downloads.length,
      uniqueUsers,
      successRate: (successful.length / downloads.length) * 100,
      averageStatusCode: avgStatusCode,
      lastDownloadAt: downloads[0]?.createdAt || null,
      downloadsByDay,
    };
  } catch (error) {
    logger.error(`[AUDIT_ANALYTICS_ERROR] Failed to get analytics for ${contentId}: ${error}`);
    return {
      totalDownloads: 0,
      uniqueUsers: 0,
      successRate: 0,
      averageStatusCode: 0,
      lastDownloadAt: null,
      downloadsByDay: [],
    };
  }
}

export default {
  record: recordPremiumDownloadAttempt,
  query: queryDownloadAudit,
  summary: getAuditSummary,
  cleanup: cleanupOldAuditRecords,
  analytics: getDownloadAnalytics,
};
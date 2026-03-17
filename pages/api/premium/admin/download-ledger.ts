// pages/api/premium/admin/download-ledger.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import type { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import {
  normalizeUserTier,
  hasAccess,
  type AccessTier,
} from "@/lib/access/tier-policy";
import { logAuditEvent } from "@/lib/security/audit";
import { limitIp, setRateLimitHeaders } from "@/lib/security/rate-limit";
import { getCurrentAccessBinding } from "@/lib/server/current-access-binding";
import { logger } from "@/lib/logging";
import type { AoLClaims } from "@/types/auth";

const REQUIRED_ADMIN_TIER: AccessTier = "architect";
const AUDIT_RESOURCE = "premium/admin/download-ledger";

const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000,
  max: 20,
};

type SessionWithTier = Session & {
  aol?: AoLClaims;
  user?: Session["user"] & {
    id?: string;
    role?: string;
    tier?: AccessTier;
  };
};

type LedgerFilters = {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  contentId?: string;
  success?: boolean;
  tokenId?: string;
};

function parseIntParam(value: unknown, fallback: number): number {
  const num =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(num) && num > 0 ? Math.min(num, 1000) : fallback;
}

function parseDateParam(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseBooleanParam(value: unknown): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function buildAttemptWhereClause(
  filters: LedgerFilters,
): Prisma.PremiumDownloadAttemptWhereInput {
  const where: Prisma.PremiumDownloadAttemptWhereInput = {};

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  if (filters.userId) where.userId = filters.userId;
  if (filters.contentId) where.contentId = filters.contentId;
  if (filters.success !== undefined) where.success = filters.success;
  if (filters.tokenId) where.tokenId = filters.tokenId;

  return where;
}

function buildTokenWhereClause(
  filters: LedgerFilters,
): Prisma.PremiumDownloadTokenWhereInput {
  const where: Prisma.PremiumDownloadTokenWhereInput = {};

  if (filters.tokenId) where.tokenId = filters.tokenId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.contentId) where.contentId = filters.contentId;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return where;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  const rateLimit = limitIp(req, "download-ledger", RATE_LIMIT_CONFIG);
  setRateLimitHeaders(res, rateLimit);

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: "Too many requests",
      code: "RATE_LIMITED",
      retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
    });
  }

  const session = (await getServerSession(
    req,
    res,
    authOptions,
  )) as SessionWithTier | null;

  if (!session?.user) {
    return res.status(401).json({
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  }

  const binding = await getCurrentAccessBinding(req, res);

  const sessionUser = session.user;
  const sessionAol = session.aol;

  const userTier = normalizeUserTier(
    sessionUser?.tier ??
      sessionAol?.tier ??
      "public",
  );

  if (!hasAccess(userTier, REQUIRED_ADMIN_TIER)) {
    await logAuditEvent({
      eventType: "ADMIN_ACCESS_DENIED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        attemptedTier: userTier,
        requiredTier: REQUIRED_ADMIN_TIER,
        query: req.query,
      },
    });

    return res.status(403).json({
      error: "Insufficient clearance",
      code: "INSUFFICIENT_TIER",
    });
  }

  const page = parseIntParam(req.query.page, 1);
  const limit = Math.min(parseIntParam(req.query.limit, 50), 200);
  const skip = (page - 1) * limit;

  const filters: LedgerFilters = {
    startDate: parseDateParam(req.query.startDate),
    endDate: parseDateParam(req.query.endDate),
    userId: typeof req.query.userId === "string" ? req.query.userId : undefined,
    contentId:
      typeof req.query.contentId === "string"
        ? req.query.contentId
        : undefined,
    success: parseBooleanParam(req.query.success),
    tokenId:
      typeof req.query.tokenId === "string" ? req.query.tokenId : undefined,
  };

  if (
    filters.startDate &&
    filters.endDate &&
    filters.startDate > filters.endDate
  ) {
    return res.status(400).json({
      error: "startDate must be before endDate",
      code: "INVALID_DATE_RANGE",
    });
  }

  try {
    const attemptWhere = buildAttemptWhereClause(filters);
    const tokenWhere = buildTokenWhereClause(filters);

    const [totalAttempts, totalTokens] = await Promise.all([
      prisma.premiumDownloadAttempt.count({ where: attemptWhere }),
      prisma.premiumDownloadToken.count({ where: tokenWhere }),
    ]);

    const [attempts, tokens] = await Promise.all([
      prisma.premiumDownloadAttempt.findMany({
        where: attemptWhere,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          id: true,
          tokenId: true,
          contentId: true,
          userId: true,
          success: true,
          statusCode: true,
          reason: true,
          watermarkId: true,
          fileSize: true,
          pageCount: true,
          downloadDuration: true,
          userTier: true,
          requiredTier: true,
          createdAt: true,
        },
      }),
      prisma.premiumDownloadToken.findMany({
        where: tokenWhere,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          tokenId: true,
          sessionId: true,
          userId: true,
          contentId: true,
          tier: true,
          expiresAt: true,
          maxDownloads: true,
          usedCount: true,
          createdAt: true,
          lastUsedAt: true,
          revokedAt: true,
        },
      }),
    ]);

    await logAuditEvent({
      eventType: "LEDGER_ACCESSED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        filters,
        page,
        limit,
        resultCount: attempts.length,
        tokenCount: tokens.length,
      },
    });

    const maxTotal = Math.max(totalAttempts, totalTokens);

    return res.status(200).json({
      success: true,
      data: {
        attempts,
        tokens,
      },
      pagination: {
        page,
        limit,
        totalAttempts,
        totalTokens,
        totalPages: Math.ceil(maxTotal / limit),
        hasNextPage: skip + limit < maxTotal,
        hasPrevPage: page > 1,
      },
      filters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error("[PREMIUM_DOWNLOAD_LEDGER_ERROR]", {
      error: message,
      userId: binding.userId,
      filters,
    });

    await logAuditEvent({
      eventType: "LEDGER_ACCESS_FAILED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        error: message,
        filters,
      },
    });

    return res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}
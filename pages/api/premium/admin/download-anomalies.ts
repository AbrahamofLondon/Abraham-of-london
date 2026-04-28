// pages/api/premium/admin/download-anomalies.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";

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
const AUDIT_RESOURCE = "premium/admin/download-anomalies";

const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000,
  max: 10,
};

type SessionWithTier = Session & {
  aol?: AoLClaims;
  user?: Session["user"] & {
    id?: string;
    role?: string;
    tier?: AccessTier;
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  const rateLimit = await limitIp(req, "download-anomalies", RATE_LIMIT_CONFIG);
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
      },
    });

    return res.status(403).json({
      error: "Insufficient clearance",
      code: "INSUFFICIENT_TIER",
    });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const failedAttempts = await prisma.premiumDownloadAttempt.count({
      where: {
        success: false,
        createdAt: { gte: since },
      },
    });

    const repeatedIpFailuresRaw = await prisma.premiumDownloadAttempt.groupBy({
      by: ["ipHash"],
      where: {
        success: false,
        createdAt: { gte: since },
        ipHash: { not: null },
      },
      _count: {
        ipHash: true,
      },
      having: {
        ipHash: {
          _count: {
            gte: 3,
          },
        },
      },
    });

    const repeatedIpFailures = repeatedIpFailuresRaw.map((item) => ({
      ipHash: item.ipHash,
      count: item._count.ipHash,
    }));

    const heavilyUsedTokens = await prisma.premiumDownloadToken.findMany({
      where: {
        usedCount: { gte: 1 },
        createdAt: { gte: since },
      },
      select: {
        tokenId: true,
        contentId: true,
        usedCount: true,
        maxDownloads: true,
        userId: true,
        sessionId: true,
        createdAt: true,
      },
      orderBy: {
        usedCount: "desc",
      },
      take: 25,
    });

    await logAuditEvent({
      eventType: "ANOMALIES_ACCESSED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        failedAttempts,
        repeatedIpCount: repeatedIpFailures.length,
        tokenCount: heavilyUsedTokens.length,
      },
    });

    return res.status(200).json({
      success: true,
      window: "24h",
      since: since.toISOString(),
      anomalies: {
        failedAttempts,
        repeatedIpFailures,
        heavilyUsedTokens,
      },
      metadata: {
        requestedBy: binding.userId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error("[PREMIUM_DOWNLOAD_ANOMALIES_ERROR]", {
      error: message,
      userId: binding.userId,
    });

    await logAuditEvent({
      eventType: "ANOMALIES_ACCESS_FAILED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        error: message,
      },
    });

    return res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}

export default handler;

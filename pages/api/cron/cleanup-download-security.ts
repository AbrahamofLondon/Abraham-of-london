// pages/api/cron/cleanup-download-security.ts
import type { NextApiRequest, NextApiResponse } from "next";

import { cleanupExpiredDownloadTokens } from "@/lib/premium/download-token";
import { logAuditEvent } from "@/lib/security/audit";
import { logger } from "@/lib/logging";

const DEFAULT_RETENTION_DAYS = 7;
const MAX_RETENTION_DAYS = 90;

function getBearerToken(value: string | undefined): string | null {
  if (!value || !value.startsWith("Bearer ")) return null;
  const token = value.slice(7).trim();
  return token || null;
}

function parseDays(value: unknown): number {
  const num =
    typeof value === "string"
      ? Number.parseInt(value, 10)
      : typeof value === "number"
        ? value
        : DEFAULT_RETENTION_DAYS;

  if (!Number.isFinite(num)) return DEFAULT_RETENTION_DAYS;
  if (num < 1) return 1;
  if (num > MAX_RETENTION_DAYS) return MAX_RETENTION_DAYS;

  return Math.floor(num);
}

function isAuthorizedCronRequest(req: NextApiRequest): boolean {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    logger.warn("[CRON_CLEANUP_SECURITY] Missing CRON_SECRET; refusing execution");
    return false;
  }

  const authHeader =
    typeof req.headers.authorization === "string"
      ? req.headers.authorization
      : undefined;

  const bearer = getBearerToken(authHeader);
  if (bearer && bearer === expected) {
    return true;
  }

  const cronHeader =
    typeof req.headers["x-cron-secret"] === "string"
      ? req.headers["x-cron-secret"]
      : undefined;

  return cronHeader === expected;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  if (!isAuthorizedCronRequest(req)) {
    await logAuditEvent({
      eventType: "CRON_ACCESS_DENIED",
      userId: null,
      sessionId: null,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: "cron-cleanup-download-security",
      metadata: {
        reason: "invalid_or_missing_cron_secret",
      },
    });

    return res.status(401).json({
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  }

  const days = parseDays(req.body?.days ?? req.query.days);

  await logAuditEvent({
    eventType: "CRON_ACTION_STARTED",
    userId: null,
    sessionId: null,
    ip: req.socket.remoteAddress ?? null,
    userAgent: req.headers["user-agent"] ?? null,
    resource: "cron-cleanup-download-security",
    metadata: {
      action: "cleanup_expired_download_tokens",
      days,
      trigger: "cron",
    },
  });

  try {
    const startTime = Date.now();
    const deleted = await cleanupExpiredDownloadTokens(days);
    const duration = Date.now() - startTime;

    logger.info("[CRON_CLEANUP_SECURITY] Cleanup completed", {
      deleted,
      days,
      durationMs: duration,
    });

    await logAuditEvent({
      eventType: "CRON_CLEANUP_COMPLETED",
      userId: null,
      sessionId: null,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: "cron-cleanup-download-security",
      metadata: {
        deleted,
        days,
        durationMs: duration,
        success: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        deleted,
        days,
        executedAt: new Date().toISOString(),
        durationMs: duration,
      },
      message: `Successfully cleaned up ${deleted} expired download tokens`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logger.error("[CRON_CLEANUP_SECURITY] Cleanup failed", {
      error: message,
    });

    await logAuditEvent({
      eventType: "CRON_CLEANUP_FAILED",
      userId: null,
      sessionId: null,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: "cron-cleanup-download-security",
      metadata: {
        days,
        error: message,
      },
    });

    return res.status(500).json({
      error: "Cleanup operation failed",
      code: "INTERNAL_ERROR",
      message: "The server encountered an error while cleaning up download security records",
    });
  }
}
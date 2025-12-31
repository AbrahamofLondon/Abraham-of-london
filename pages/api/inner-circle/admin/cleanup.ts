// pages/api/inner-circle/admin/cleanup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  cleanupExpiredData,
  type CleanupResult,
} from "@/lib/server/inner-circle-store";

/* =============================================================================
   TYPES
   ============================================================================= */

type CleanupOk = {
  ok: true;
  message: string;
  stats: CleanupResult;
  cleanedAt: string;
};

type CleanupFail = {
  ok: false;
  error: "Method Not Allowed" | "Unauthorized" | "Too Many Requests" | "Cleanup operation failed";
  details?: string;
};

type CleanupApiResponse = CleanupOk | CleanupFail;

/* =============================================================================
   CONSTANTS
   ============================================================================= */

const RATE_LIMIT = {
  maxRequests: 3,
  windowSeconds: 3600, // 1 hour
} as const;

const ADMIN_KEY_HEADERS = ["x-inner-circle-admin-key", "authorization"] as const;

/* =============================================================================
   UTILITIES
   ============================================================================= */

function firstIpFromXff(xff: string): string {
  return xff.split(",")[0]?.trim() || "unknown";
}

function getClientIp(req: NextApiRequest): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string") return firstIpFromXff(xff);
  if (Array.isArray(xff) && xff.length > 0) return firstIpFromXff(xff[0] ?? "");
  return req.socket?.remoteAddress ?? "unknown";
}

function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1]!.trim() : null;
}

function isAdminAuthenticated(req: NextApiRequest): boolean {
  const expected = process.env.INNER_CIRCLE_ADMIN_KEY;
  if (!expected) {
    console.error("[InnerCircle/Admin] INNER_CIRCLE_ADMIN_KEY not configured");
    return false;
  }

  for (const name of ADMIN_KEY_HEADERS) {
    const value = req.headers[name];
    if (typeof value !== "string") continue;

    const token = extractBearerToken(value) ?? value.trim();
    if (token && token === expected) return true;
  }

  return false;
}

/* =============================================================================
   RATE LIMITING (in-memory, per-lambda-instance)
   ============================================================================= */

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(
  key: string,
  maxRequests: number = RATE_LIMIT.maxRequests,
  windowSeconds: number = RATE_LIMIT.windowSeconds
): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;

  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt, limit: maxRequests };
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);

  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);

  return { allowed, remaining, resetAt: entry.resetAt, limit: maxRequests };
}

function setRateLimitHeaders(
  res: NextApiResponse,
  rl: { remaining: number; resetAt: number; limit: number }
) {
  res.setHeader("X-RateLimit-Limit", String(rl.limit));
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.floor(rl.resetAt / 1000)));
}

/* =============================================================================
   MAIN HANDLER
   ============================================================================= */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupApiResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({
      ok: false,
      error: "Method Not Allowed",
      details: "Maintenance operations require POST method",
    });
    return;
  }

  if (!isAdminAuthenticated(req)) {
    res.status(401).json({
      ok: false,
      error: "Unauthorized",
      details: "Valid admin key required for this operation",
    });
    return;
  }

  const ip = getClientIp(req);
  const rl = checkRateLimit(`inner-circle-cleanup:${ip}`);
  setRateLimitHeaders(res, rl);

  if (!rl.allowed) {
    res.status(429).json({
      ok: false,
      error: "Too Many Requests",
      details: `Cleanup operations limited to ${RATE_LIMIT.maxRequests} per hour`,
    });
    return;
  }

  try {
    const stats = await cleanupExpiredData();
    const cleanedAt = new Date().toISOString();

    console.info("[InnerCircle/Admin] cleanup ok", {
      deletedMembers: stats.deletedMembers,
      deletedKeys: stats.deletedKeys,
      totalOrphanedKeys: stats.totalOrphanedKeys,
    });

    res.status(200).json({
      ok: true,
      message: "Vault hygiene completed successfully",
      stats,
      cleanedAt,
    });
  } catch (err) {
    console.error("[InnerCircle/Admin] cleanup failed:", err);
    const details = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ ok: false, error: "Cleanup operation failed", details });
  }
}

/* =============================================================================
   CONFIGURATION
   ============================================================================= */

export const config = {
  api: {
    bodyParser: false,
  },
};

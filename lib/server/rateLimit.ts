// lib/server/rateLimit.ts
import "server-only";
import type { NextApiRequest, NextApiResponse } from "next";
import { safeNumber } from "@/lib/utils/safe";

export type RateLimitConfig = {
  windowMs: number;
  max: number;
};

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  contact: { windowMs: 60_000, max: 10 },
  newsletter: { windowMs: 60_000, max: 10 },
  subscribe: { windowMs: 60_000, max: 10 },
  teaser: { windowMs: 60_000, max: 10 },
  shortsWrite: { windowMs: 60_000, max: 30 },
  shortsRead: { windowMs: 60_000, max: 120 },
  adminHeavy: { windowMs: 60_000, max: 10 },
};

type Bucket = { resetAt: number; count: number };
const memoryBuckets = new Map<string, Bucket>();

export function getClientIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(xf) ? xf[0] : xf)?.split(",")[0]?.trim() ||
    (req.socket as any)?.remoteAddress ||
    "0.0.0.0";
  return ip;
}

export function createRateLimitHeaders(result: { limit: number; remaining: number; resetAt: number }) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  } as const;
}

export function isRateLimited(key: string, cfg: RateLimitConfig): { limited: boolean; remaining: number; resetAt: number; limit: number } {
  const now = Date.now();
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + cfg.windowMs;
    memoryBuckets.set(key, { resetAt, count: 1 });
    return { limited: false, remaining: cfg.max - 1, resetAt, limit: cfg.max };
  }

  existing.count += 1;
  const remaining = cfg.max - existing.count;
  const limited = existing.count > cfg.max;
  return { limited, remaining, resetAt: existing.resetAt, limit: cfg.max };
}

export function rateLimit(req: NextApiRequest, res: NextApiResponse, cfg: RateLimitConfig, key: string) {
  const result = isRateLimited(key, cfg);
  const headers = createRateLimitHeaders(result);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

  if (result.limited) {
    res.status(429).json({
      ok: false,
      error: "Too Many Requests",
      retryAfterSeconds: safeNumber((result.resetAt - Date.now()) / 1000, 1),
    });
    return { ok: false as const, ...result };
  }

  return { ok: true as const, ...result };
}

// Backwards-compat aliases used in older routes
export const checkRateLimit = rateLimit;
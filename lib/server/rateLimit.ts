// lib/server/rateLimit.ts
import type { NextApiRequest, NextApiResponse } from "next";

export type RateLimitConfig = {
  limit: number;
  windowSeconds: number;
  windowMs?: number; // backwards compat
  max?: number; // backwards compat
};

export const RATE_LIMIT_CONFIGS = {
  contact: { limit: 10, windowSeconds: 60 },
  newsletter: { limit: 10, windowSeconds: 60 },
  subscribe: { limit: 10, windowSeconds: 60 },
  teaser: { limit: 15, windowSeconds: 60 },
  shortsSave: { limit: 30, windowSeconds: 60 },
  shortsInteractions: { limit: 60, windowSeconds: 60 },

  // legacy names referenced elsewhere
  CONTACT_FORM: { limit: 10, windowSeconds: 60 },
  SHORTS_INTERACTIONS: { limit: 30, windowSeconds: 60 },
} satisfies Record<string, RateLimitConfig>;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetSeconds: number;
  limit: number;

  // backwards compat fields used in some routes
  allowed?: boolean;
  limited?: boolean;
  resetAt?: number;
};

const mem = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(xf) ? xf[0] : xf)?.split(",")[0]?.trim() ||
    (req.socket as any)?.remoteAddress ||
    "0.0.0.0";
  return ip;
}

export function createRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(result.resetSeconds),
  } as const;
}

export function isRateLimited(result: RateLimitResult) {
  return !result.ok;
}

export function getRateLimitKey(req: NextApiRequest, prefix: string): string {
  const ip = getClientIp(req);
  return `${prefix}:${ip}`;
}

// Core server rate limit: rateLimit(key, config)
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult & { allowed: boolean } {
  const now = Date.now();
  const windowMs = config.windowSeconds ? config.windowSeconds * 1000 : config.windowMs || 60_000;

  const cur = mem.get(key);
  if (!cur || now >= cur.resetAt) {
    mem.set(key, { count: 1, resetAt: now + windowMs });
    return {
      ok: true,
      allowed: true,
      remaining: config.limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
      limit: config.limit,
      resetAt: now + windowMs,
    };
  }

  const resetSeconds = Math.max(0, Math.ceil((cur.resetAt - now) / 1000));

  if (cur.count >= config.limit) {
    return {
      ok: false,
      allowed: false,
      remaining: 0,
      resetSeconds,
      limit: config.limit,
      limited: true,
      resetAt: cur.resetAt,
    };
  }

  cur.count += 1;
  return {
    ok: true,
    allowed: true,
    remaining: Math.max(0, config.limit - cur.count),
    resetSeconds,
    limit: config.limit,
    resetAt: cur.resetAt,
  };
}

// NEW style: rateLimit({ key, limit, windowMs })
export function rateLimitWithOptions(options: { key: string; limit: number; windowMs: number }): RateLimitResult {
  const { key, limit, windowMs } = options;
  const now = Date.now();

  const cur = mem.get(key);
  if (!cur || now >= cur.resetAt) {
    mem.set(key, { count: 1, resetAt: now + windowMs });
    return {
      ok: true,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
      limit,
      resetAt: now + windowMs,
    };
  }

  const resetSeconds = Math.max(0, Math.ceil((cur.resetAt - now) / 1000));

  if (cur.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetSeconds,
      limit,
      limited: true,
      resetAt: cur.resetAt,
    };
  }

  cur.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, limit - cur.count),
    resetSeconds,
    limit,
    resetAt: cur.resetAt,
  };
}

export function rateLimitForRequest(
  _req: NextApiRequest,
  res: NextApiResponse,
  config: RateLimitConfig,
  key: string
): RateLimitResult {
  const result = rateLimit(key, config);
  const headers = createRateLimitHeaders(result);
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  return result;
}

// Back-compat aliases
export const checkRateLimit = rateLimit;
export const withRateLimit = rateLimitForRequest;
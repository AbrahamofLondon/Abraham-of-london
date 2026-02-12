// lib/server/rate-limit-unified.ts — DUAL RUNTIME (NODE + EDGE) HARDENED
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";

// -------------------- Types --------------------

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs: number;
  resetTime: number;
  windowMs: number;
  source: "upstash" | "memory";
};

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitOptions> = {
  API_STRICT: { limit: 30, windowMs: 60_000, keyPrefix: "api-strict" },
  API_GENERAL: { limit: 100, windowMs: 3_600_000, keyPrefix: "api" },
  INNER_CIRCLE_UNLOCK: { limit: 30, windowMs: 600_000, keyPrefix: "ic-unlock" },
  AUTH: { limit: 10, windowMs: 900_000, keyPrefix: "auth" },
  CONTACT: { limit: 5, windowMs: 3_600_000, keyPrefix: "contact" },
  DOWNLOAD: { limit: 20, windowMs: 3_600_000, keyPrefix: "download" },
  ADMIN: { limit: 100, windowMs: 60_000, keyPrefix: "admin" },
};

// -------------------- Memory Store Fallback --------------------

const memoryStore = new Map<string, { count: number; resetTime: number }>();

// -------------------- Upstash Limiter Factory --------------------

async function getUpstashLimiter(windowMs: number, limit: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    // ✅ Always import @upstash/redis – conditional exports handle Edge/Node automatically
    const { Redis } = await import("@upstash/redis");

    return new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
      analytics: false,
    });
  } catch {
    return null;
  }
}

// -------------------- IP Extraction (Node API + Edge) --------------------

export function getClientIp(req: NextApiRequest | NextRequest): string {
  // Edge / NextRequest
  if ("headers" in req && typeof (req.headers as any).get === "function") {
    const forwarded = (req.headers as any).get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return (req.headers as any).get("x-real-ip") ?? "127.0.0.1";
  }

  // Node / NextApiRequest
  const apiReq = req as NextApiRequest;
  const fwd = apiReq.headers["x-forwarded-for"];
  return (
    (Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0]) ??
    apiReq.socket.remoteAddress ??
    "127.0.0.1"
  );
}

// -------------------- Headers --------------------

export function createRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
    "Retry-After": result.retryAfterMs > 0 ? String(Math.ceil(result.retryAfterMs / 1000)) : "0",
  };
}

// -------------------- Core Rate Limiter --------------------

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<RateLimitResult> {
  const key = `${options.keyPrefix ?? "rl"}:${identifier}`;

  // Try Upstash (preferred)
  const limiter = await getUpstashLimiter(options.windowMs, options.limit);
  if (limiter) {
    try {
      const { success, remaining, reset } = await limiter.limit(key);
      const retryAfterMs = success ? 0 : Math.max(0, reset - Date.now());
      return {
        allowed: success,
        remaining,
        limit: options.limit,
        retryAfterMs,
        resetTime: reset,
        windowMs: options.windowMs,
        source: "upstash",
      };
    } catch {
      // fall through to memory
    }
  }

  // Memory fallback (deterministic)
  const now = Date.now();
  let record = memoryStore.get(key);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + options.windowMs };
    memoryStore.set(key, record);
  }
  record.count += 1;

  const allowed = record.count <= options.limit;
  return {
    allowed,
    remaining: Math.max(0, options.limit - record.count),
    limit: options.limit,
    retryAfterMs: allowed ? 0 : Math.max(0, record.resetTime - now),
    resetTime: record.resetTime,
    windowMs: options.windowMs,
    source: "memory",
  };
}

export async function isRateLimited(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<boolean> {
  const res = await rateLimit(identifier, { ...options, limit: options.limit });
  return !res.allowed;
}

export function getRateLimiterStats(): Record<string, any> {
  return { memory: { totalKeys: memoryStore.size } };
}

export async function resetRateLimit(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<boolean> {
  const key = `${options.keyPrefix ?? "rl"}:${identifier}`;

  // Try Upstash delete if configured
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const { Redis } = await import("@upstash/redis");
      await new Redis({ url, token }).del(key);
    } catch {
      // ignore
    }
  }

  return memoryStore.delete(key);
}

export const unblock = resetRateLimit;

// -------------------- NODE API WRAPPER --------------------

export function withApiRateLimit(
  handler: NextApiHandler,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const ip = getClientIp(req);
    const result = await rateLimit(ip, options);
    const headers = createRateLimitHeaders(result);
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);

    if (!result.allowed) {
      res.status(429).json({ error: "Rate limit exceeded" });
      return;
    }
    return handler(req, res);
  };
}

// -------------------- EDGE HELPERS (App Router / Middleware) --------------------

/**
 * Check rate limit in Edge Runtime (App Router, Middleware) and return a Response
 * if limit is exceeded, otherwise return null.
 */
export async function withEdgeRateLimit(req: NextRequest, options: RateLimitOptions) {
  const ip = getClientIp(req);
  const result = await rateLimit(ip, options);
  const headers = createRateLimitHeaders(result);
  return { allowed: result.allowed, headers, result };
}

/**
 * Creates a standard 429 Response object for Edge API routes.
 */
export function createRateLimitedResponse(
  result: RateLimitResult,
  extraHeaders?: Record<string, string>
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...createRateLimitHeaders(result),
    ...(extraHeaders || {}),
  };

  return new NextResponse(
    JSON.stringify({
      error: "Rate limit exceeded",
      retryAfterMs: result.retryAfterMs,
      resetTime: result.resetTime,
      remaining: result.remaining,
      limit: result.limit,
      source: result.source,
    }),
    { status: 429, headers }
  );
}
/* lib/server/rate-limit-unified.ts */
import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";

type RateLimitOptions = {
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

function getEnv(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env[name] : undefined;
}

// Memory store fallback (Zero-Cost Storage)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * UPSTASH ADAPTER: Only activates if env vars are present.
 */
async function getUpstashLimiter(windowMs: number, limit: number) {
  const url = getEnv("UPSTASH_REDIS_REST_URL");
  const token = getEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) return null;

  try {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");

    const redis = new Redis({ url, token });
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
      analytics: false,
    });
  } catch (e) {
    return null;
  }
}

/**
 * CORE LOGIC: Orchestrates between Cloud and Local Memory
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<RateLimitResult> {
  const key = `${options.keyPrefix ?? "rl"}:${identifier}`;
  const limiter = await getUpstashLimiter(options.windowMs, options.limit);

  if (limiter) {
    try {
      const { success, remaining, reset } = await limiter.limit(key);
      return {
        allowed: success,
        remaining,
        limit: options.limit,
        retryAfterMs: success ? 0 : Math.max(0, reset - Date.now()),
        resetTime: reset,
        windowMs: options.windowMs,
        source: "upstash",
      };
    } catch { /* Auto-fallback to memory if Upstash fails */ }
  }

  // Memory Fallback Execution
  const now = Date.now();
  const record = memoryStore.get(key);
  
  if (record && now < record.resetTime) {
    record.count++;
    const allowed = record.count <= options.limit;
    return {
      allowed,
      remaining: Math.max(0, options.limit - record.count),
      limit: options.limit,
      retryAfterMs: allowed ? 0 : record.resetTime - now,
      resetTime: record.resetTime,
      windowMs: options.windowMs,
      source: "memory",
    };
  }
  
  const resetTime = now + options.windowMs;
  memoryStore.set(key, { count: 1, resetTime });
  
  return { 
    allowed: true, 
    remaining: options.limit - 1, 
    limit: options.limit, 
    retryAfterMs: 0, 
    resetTime, 
    windowMs: options.windowMs, 
    source: "memory" 
  };
}

/**
 * IP RESOLVER: Institutional grade IP identification
 */
export function getClientIp(req: NextApiRequest | NextRequest): string {
  if ("headers" in req && typeof (req.headers as any).get === "function") {
    const forwarded = (req.headers as any).get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return (req.headers as any).get("x-real-ip") ?? "127.0.0.1";
  }
  const apiReq = req as NextApiRequest;
  const fwd = apiReq.headers["x-forwarded-for"];
  return (Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0]) ?? apiReq.socket.remoteAddress ?? "127.0.0.1";
}

export function createRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
  };
}

/**
 * WRAPPER: For API Routes protection
 */
export const withRateLimit = (handler: any, options = RATE_LIMIT_CONFIGS.API_GENERAL) => async (req: any, res: any) => {
  const result = await rateLimit(getClientIp(req), options);
  
  // Standard Header injection
  const headers = createRateLimitHeaders(result);
  Object.entries(headers).forEach(([k, v]) => {
    if (typeof res.setHeader === 'function') res.setHeader(k, v);
  });

  if (!result.allowed) {
    return res.status(429).json({ 
      error: "TOO_MANY_REQUESTS",
      retryAfter: Math.ceil(result.retryAfterMs / 1000) 
    });
  }
  return handler(req, res);
};
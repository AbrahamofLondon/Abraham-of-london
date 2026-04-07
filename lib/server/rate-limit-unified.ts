/* lib/server/rate-limit-unified.ts — EDGE-SAFE (FULL REPLACEMENT) */
// Fixes: "@upstash/redis/nodejs.mjs uses process.version" Edge failure.
// Memory rate limiter (Edge-safe). Backward compatible API surface.

export type Bucket = { count: number; resetAt: number };

// In-memory buckets (per runtime instance)
// Note: In serverless, memory is ephemeral per request/instance,
// but this satisfies Edge requirements and provides basic protection.
const mem = new Map<string, Bucket>();

/** Backward compatible config shape used across middleware + API wrappers */
export type RateLimitConfig = {
  limit: number;
  windowMs: number;
  keyPrefix: string;
};

export type RateLimitKey =
  | "PUBLIC"
  | "AUTH"
  | "ADMIN"
  | "API_STRICT"
  | "API_GENERAL"
  | "INNER_CIRCLE_UNLOCK"
  | "CONTACT"
  | "DOWNLOAD";

/**
 * Canonical configs.
 * NOTE: keys and names match existing call sites in the repository.
 */
export const RATE_LIMIT_CONFIGS: Record<RateLimitKey, RateLimitConfig> = {
  PUBLIC: { limit: 120, windowMs: 60_000, keyPrefix: "pub" },
  AUTH: { limit: 60, windowMs: 60_000, keyPrefix: "auth" },
  ADMIN: { limit: 100, windowMs: 60_000, keyPrefix: "admin" },
  API_STRICT: { limit: 30, windowMs: 60_000, keyPrefix: "api-strict" },
  API_GENERAL: { limit: 100, windowMs: 3_600_000, keyPrefix: "api" },
  INNER_CIRCLE_UNLOCK: { limit: 30, windowMs: 600_000, keyPrefix: "ic-unlock" },
  CONTACT: { limit: 5, windowMs: 3_600_000, keyPrefix: "contact" },
  DOWNLOAD: { limit: 20, windowMs: 3_600_000, keyPrefix: "download" },
};

// Alias preserved for backward compatibility
export const LIMITS = RATE_LIMIT_CONFIGS;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: number;
  resetAt: number;
  retryAfterMs: number;
  windowMs: number;
  source: "memory";
};

/* -------------------------------------------------------------------------- */
/* CORE LOGIC                                                                 */
/* -------------------------------------------------------------------------- */

function keyFor(config: RateLimitConfig, id: string): string {
  const safeId = String(id || "anon");
  return `${config.keyPrefix}:${safeId}`;
}

function computeResult(params: {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfterMs: number;
  windowMs: number;
}): RateLimitResult {
  return {
    allowed: params.allowed,
    remaining: params.remaining,
    limit: params.limit,
    resetAt: params.resetAt,
    resetTime: params.resetAt, // legacy compatibility
    retryAfterMs: params.retryAfterMs,
    windowMs: params.windowMs,
    source: "memory",
  };
}

/**
 * Canonical primitive limiter. Handles bucket expiration and incrementing.
 */
function rateLimitByConfig(id: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const k = keyFor(config, id);

  const existing = mem.get(k);
  
  // Create or reset bucket if expired
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    mem.set(k, { count: 1, resetAt });
    return computeResult({
      allowed: true,
      remaining: Math.max(0, config.limit - 1),
      limit: config.limit,
      resetAt,
      retryAfterMs: 0,
      windowMs: config.windowMs,
    });
  }

  // Check if limit exceeded
  if (existing.count >= config.limit) {
    return computeResult({
      allowed: false,
      remaining: 0,
      limit: config.limit,
      resetAt: existing.resetAt,
      retryAfterMs: Math.max(0, existing.resetAt - now),
      windowMs: config.windowMs,
    });
  }

  // Increment existing bucket
  existing.count += 1;
  mem.set(k, existing);

  return computeResult({
    allowed: true,
    remaining: Math.max(0, config.limit - existing.count),
    limit: config.limit,
    resetAt: existing.resetAt,
    retryAfterMs: 0,
    windowMs: config.windowMs,
  });
}

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Modern check style: rateLimitCheck({ key: 'ADMIN', id: ip })
 */
export function rateLimitCheck(params: { key: RateLimitKey; id: string }): RateLimitResult {
  const cfg = RATE_LIMIT_CONFIGS[params.key];
  return rateLimitByConfig(params.id, cfg);
}

/**
 * Legacy style used across the repo: await rateLimit(ip, CONFIG)
 */
export async function rateLimit(id: string, config: RateLimitConfig): Promise<RateLimitResult> {
  return rateLimitByConfig(id, config);
}

/**
 * Simple boolean check for quick filtering
 */
export async function isRateLimited(params: { key: RateLimitKey; id: string }): Promise<boolean> {
  const r = rateLimitCheck(params);
  return !r.allowed;
}

/**
 * Isomorphic IP resolver for Edge and Node environments
 */
export function getClientIp(req: any): string {
  // Edge / NextRequest (Middleware)
  if (req?.headers?.get) {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.headers.get("x-real-ip") ?? "127.0.0.1";
  }

  // Node / NextApiRequest (Pages API)
  const fwd = req?.headers?.["x-forwarded-for"];
  const ip =
    (Array.isArray(fwd) ? fwd[0] : typeof fwd === "string" ? fwd.split(",")[0] : undefined) ??
    req?.headers?.["x-real-ip"] ??
    req?.socket?.remoteAddress;

  return String(ip || "127.0.0.1");
}

/**
 * Generates standard rate limit headers for HTTP responses
 */
export function createRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  resetTime?: number;
  resetAt?: number;
  retryAfterMs: number;
}) {
  const reset = typeof result.resetTime === "number" ? result.resetTime : Number(result.resetAt || Date.now());
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
    "Retry-After": result.retryAfterMs > 0 ? String(Math.ceil(result.retryAfterMs / 1000)) : "0",
  };
}

/* -------------------------------------------------------------------------- */
/* WRAPPERS                                                                   */
/* -------------------------------------------------------------------------- */

export function withApiRateLimit(handler: any, options: { key: RateLimitKey; id?: string }) {
  return async (req: any, res: any) => {
    const id = options.id || getClientIp(req);
    const cfg = RATE_LIMIT_CONFIGS[options.key];
    const result = await rateLimit(id, cfg);

    const headers = createRateLimitHeaders(result);
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);

    if (!result.allowed) {
      return res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil(result.retryAfterMs / 1000),
      });
    }

    return handler(req, res);
  };
}

export function withEdgeRateLimit(handler: any, cfg: RateLimitConfig) {
  return async (req: any, res: any) => {
    const id = getClientIp(req);
    const result = await rateLimit(id, cfg);

    if (res && typeof res === "object") {
      (res.locals ??= {});
      res.locals.rateLimit = result;
    }

    return handler(req, res);
  };
}

/* -------------------------------------------------------------------------- */
/* STATS & MAINTENANCE                                                        */
/* -------------------------------------------------------------------------- */

export function getRateLimiterStats() {
  return {
    totalKeys: mem.size,
    keys: Array.from(mem.entries()).map(([key, bucket]) => ({
      key,
      count: bucket.count,
      resetAt: bucket.resetAt,
      resetIn: Math.max(0, bucket.resetAt - Date.now()),
    })),
  };
}

export async function resetRateLimit(params: { key: RateLimitKey; id: string }): Promise<boolean> {
  const cfg = RATE_LIMIT_CONFIGS[params.key];
  const k = keyFor(cfg, params.id);
  return mem.delete(k);
}

export const unblock = resetRateLimit;

export default {
  LIMITS,
  RATE_LIMIT_CONFIGS,
  rateLimitCheck,
  rateLimit,
  isRateLimited,
  getClientIp,
  createRateLimitHeaders,
  withApiRateLimit,
  withEdgeRateLimit,
  getRateLimiterStats,
  resetRateLimit,
  unblock,
};
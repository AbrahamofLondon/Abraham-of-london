// lib/server/rate-limit-unified.ts — PRODUCTION HARDENED, EDGE-SAFE, NO @vercel/kv
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
  resetTime: number; // epoch ms
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
  LIKE: { limit: 50, windowMs: 300_000, keyPrefix: "like" },
  SAVE: { limit: 30, windowMs: 300_000, keyPrefix: "save" },
  SUBSCRIBE: { limit: 3, windowMs: 3_600_000, keyPrefix: "subscribe" },
  TEASER: { limit: 10, windowMs: 3_600_000, keyPrefix: "teaser" },
  NEWSLETTER: { limit: 5, windowMs: 3_600_000, keyPrefix: "newsletter" },
  EXPORT: { limit: 3, windowMs: 3_600_000, keyPrefix: "export" },
  ADMIN: { limit: 100, windowMs: 60_000, keyPrefix: "admin" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Runtime & env (Edge-safe)
// ─────────────────────────────────────────────────────────────────────────────

function getEnv(name: string): string | undefined {
  try {
    // don’t touch process at module top-level beyond a guarded read
    return typeof process !== "undefined" && process.env ? process.env[name] : undefined;
  } catch {
    return undefined;
  }
}

function getUpstashEnv(): { url?: string; token?: string } {
  // Standard Upstash REST vars
  const url = getEnv("UPSTASH_REDIS_REST_URL");
  const token = getEnv("UPSTASH_REDIS_REST_TOKEN");
  return { url, token };
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage: Upstash Ratelimit (preferred) + Memory fallback
// ─────────────────────────────────────────────────────────────────────────────

type StoreRecord = { count: number; resetTime: number };

// Memory store fallback (works everywhere; not multi-instance safe)
const memoryStore = new Map<string, StoreRecord>();

function makeKey(identifier: string, options: RateLimitOptions): string {
  const prefix = options.keyPrefix ?? "rl";
  return `${prefix}:${identifier}`;
}

// Lazily created Upstash rate limiter (Edge-safe)
let upstashLimiterPromise:
  | Promise<{
      limiter: any;
      windowMs: number;
    } | null>
  | null = null;

async function getUpstashLimiter(windowMs: number, limit: number, prefix?: string) {
  const { url, token } = getUpstashEnv();
  if (!url || !token) return null;

  // Cache per-process (good enough for serverless runtime reuse)
  // but window/limit differ per call, so we build per-call limiter.
  try {
    const [{ Redis }, { Ratelimit }] = await Promise.all([
      import("@upstash/redis"),
      import("@upstash/ratelimit"),
    ]);

    const redis = new Redis({ url, token });

    // Sliding window behaves well for UX
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${Math.max(1, Math.ceil(windowMs / 1000))} s`),
      prefix: prefix ?? "aol",
      analytics: false,
      ephemeralCache: false,
    });

    return { limiter };
  } catch {
    return null;
  }
}

async function memoryRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (existing && now < existing.resetTime) {
    const nextCount = existing.count + 1;
    const resetTime = existing.resetTime;
    memoryStore.set(key, { count: nextCount, resetTime });

    const remaining = Math.max(0, options.limit - nextCount);
    const allowed = nextCount <= options.limit;
    const retryAfterMs = allowed ? 0 : Math.max(0, resetTime - now);

    return {
      allowed,
      remaining,
      limit: options.limit,
      retryAfterMs,
      resetTime,
      windowMs: options.windowMs,
      source: "memory",
    };
  }

  const resetTime = now + options.windowMs;
  memoryStore.set(key, { count: 1, resetTime });

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - 1),
    limit: options.limit,
    retryAfterMs: 0,
    resetTime,
    windowMs: options.windowMs,
    source: "memory",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<RateLimitResult> {
  const key = makeKey(identifier, options);

  // 1) Try Upstash if configured
  const upstash = await getUpstashLimiter(options.windowMs, options.limit, options.keyPrefix);
  if (upstash?.limiter) {
    try {
      const r = await upstash.limiter.limit(key);

      // Upstash returns reset as ms timestamp in newer libs; be defensive.
      const resetTime =
        typeof r.reset === "number"
          ? r.reset
          : typeof r.resetTime === "number"
          ? r.resetTime
          : Date.now() + options.windowMs;

      const remaining =
        typeof r.remaining === "number" ? Math.max(0, r.remaining) : 0;

      const allowed = Boolean(r.success);

      const retryAfterMs = allowed ? 0 : Math.max(0, resetTime - Date.now());

      return {
        allowed,
        remaining,
        limit: options.limit,
        retryAfterMs,
        resetTime,
        windowMs: options.windowMs,
        source: "upstash",
      };
    } catch {
      // fall through to memory
    }
  }

  // 2) Memory fallback
  return memoryRateLimit(key, options);
}

// ─────────────────────────────────────────────────────────────────────────────
// IP extraction (Edge + Node)
// ─────────────────────────────────────────────────────────────────────────────

function firstNonEmpty(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

export function getClientIp(req: NextApiRequest | NextRequest): string {
  const maybeHeaders = (req as any)?.headers;

  // Edge style: headers.get()
  if (maybeHeaders && typeof maybeHeaders.get === "function") {
    const h = maybeHeaders as { get: (k: string) => string | null };

    const forwarded = firstNonEmpty(h.get("x-forwarded-for"));
    if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

    return (
      firstNonEmpty(h.get("x-real-ip")) ||
      firstNonEmpty(h.get("cf-connecting-ip")) ||
      firstNonEmpty(h.get("x-vercel-forwarded-for")) ||
      firstNonEmpty(h.get("x-vercel-ip")) ||
      "unknown"
    );
  }

  // Node API routes: req.headers object
  const apiReq = req as NextApiRequest;
  const fwd = apiReq.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) return fwd.split(",")[0]?.trim() || "unknown";
  if (Array.isArray(fwd) && fwd.length) return (fwd[0] ?? "").trim() || "unknown";

  const real = apiReq.headers?.["x-real-ip"];
  if (typeof real === "string" && real.trim()) return real.trim();
  if (Array.isArray(real) && real.length) return (real[0] ?? "").trim() || "unknown";

  return apiReq.socket?.remoteAddress?.trim() || "unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// Headers + middleware wrappers
// ─────────────────────────────────────────────────────────────────────────────

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
  };
  if (result.retryAfterMs > 0) {
    headers["Retry-After"] = String(Math.ceil(result.retryAfterMs / 1000));
  }
  return headers;
}

export function withApiRateLimit(
  handler: (req: NextApiRequest, res: any) => Promise<void> | void,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
) {
  return async (req: NextApiRequest, res: any) => {
    const ip = getClientIp(req);
    const key = `${ip}:${req.url || "/"}`;
    const result = await rateLimit(key, options);

    const headers = createRateLimitHeaders(result);
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);

    if (!result.allowed) {
      return res.status(429).json({
        ok: false,
        error: "RATE_LIMITED",
        message: "Too many requests. Please slow down.",
        retryAfter: Math.ceil(result.retryAfterMs / 1000),
      });
    }

    return handler(req, res);
  };
}

export function withEdgeRateLimit(
  handler: (req: NextRequest) => Promise<Response> | Response,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
) {
  return async (req: NextRequest) => {
    const ip = getClientIp(req);
    const key = `${ip}:${req.nextUrl.pathname}`;
    const result = await rateLimit(key, options);

    if (!result.allowed) {
      const headers = createRateLimitHeaders(result);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "RATE_LIMITED",
          message: "Too many requests. Please slow down.",
          retryAfter: Math.ceil(result.retryAfterMs / 1000),
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...headers } }
      );
    }

    return handler(req);
  };
}

// Single alias (no duplicates)
export const withRateLimit = withApiRateLimit;

// ─────────────────────────────────────────────────────────────────────────────
// Debug helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function getRateLimiterStats(): Promise<{
  memoryStoreSize: number;
  upstashConfigured: boolean;
}> {
  const { url, token } = getUpstashEnv();
  return {
    memoryStoreSize: memoryStore.size,
    upstashConfigured: Boolean(url && token),
  };
}

export async function resetRateLimit(keyPrefix: string): Promise<void> {
  // Memory only reset: clear matching keys
  for (const k of memoryStore.keys()) {
    if (k.startsWith(`${keyPrefix}:`)) memoryStore.delete(k);
  }
}

export async function unblock(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<void> {
  memoryStore.delete(makeKey(identifier, options));
}

export async function isRateLimited(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<boolean> {
  const r = await rateLimit(identifier, options);
  return !r.allowed;
}

const rateLimitModule = {
  rateLimit,
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  withApiRateLimit,
  withEdgeRateLimit,
  withRateLimit,
  isRateLimited,
  getRateLimiterStats,
  resetRateLimit,
  unblock,
};

export default rateLimitModule;
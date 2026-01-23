// lib/server/rate-limit-unified.ts
import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";

// ==================== TYPES ====================

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
};

// ==================== CONFIGS ====================

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

// ==================== STORAGE ====================

type StoreRecord = { count: number; resetTime: number };
const memoryStore = new Map<string, StoreRecord>();

function makeStoreKey(identifier: string, options: RateLimitOptions): string {
  return `${options.keyPrefix ?? "rl"}:${identifier}`;
}

async function tryGetRedis(): Promise<any | null> {
  try {
    const mod = await import("@/lib/redis");
    const redis = typeof mod.getRedis === "function" ? mod.getRedis() : null;
    return redis ?? null;
  } catch {
    return null;
  }
}

async function getRecord(key: string): Promise<StoreRecord | null> {
  const redis = await tryGetRedis();
  if (redis?.get) {
    try {
      const raw = await redis.get(key);
      if (raw) return JSON.parse(raw) as StoreRecord;
    } catch {
      // ignore
    }
  }
  return memoryStore.get(key) ?? null;
}

async function setRecord(key: string, data: StoreRecord, windowMs: number): Promise<void> {
  const redis = await tryGetRedis();
  if (redis?.set) {
    try {
      await redis.set(key, JSON.stringify(data), { EX: Math.ceil(windowMs / 1000) });
    } catch {
      // ignore
    }
  }

  memoryStore.set(key, data);
  setTimeout(() => memoryStore.delete(key), windowMs);
}

// ==================== CORE ====================

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = makeStoreKey(identifier, options);
  const existing = await getRecord(key);

  if (existing && now < existing.resetTime) {
    const nextCount = existing.count + 1;
    const updated: StoreRecord = { count: nextCount, resetTime: existing.resetTime };
    await setRecord(key, updated, options.windowMs);

    const remaining = Math.max(0, options.limit - nextCount);
    const allowed = nextCount <= options.limit;
    const retryAfterMs = allowed ? 0 : Math.max(0, existing.resetTime - now);

    return {
      allowed,
      remaining,
      limit: options.limit,
      retryAfterMs,
      resetTime: existing.resetTime,
      windowMs: options.windowMs,
    };
  }

  const newData: StoreRecord = { count: 1, resetTime: now + options.windowMs };
  await setRecord(key, newData, options.windowMs);

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - 1),
    limit: options.limit,
    retryAfterMs: 0,
    resetTime: newData.resetTime,
    windowMs: options.windowMs,
  };
}

// ==================== IP UTIL ====================

function firstNonEmpty(v: unknown): string | null {
  if (typeof v === "string") {
    const s = v.trim();
    return s ? s : null;
  }
  return null;
}

export function getClientIp(req: NextApiRequest | NextRequest): string {
  // NextRequest / Edge style headers.get()
  const maybeHeaders = (req as any)?.headers;
  if (maybeHeaders && typeof maybeHeaders.get === "function") {
    const h = maybeHeaders as { get: (k: string) => string | null };

    const forwarded = firstNonEmpty(h.get("x-forwarded-for"));
    if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

    return (
      firstNonEmpty(h.get("x-real-ip")) ||
      firstNonEmpty(h.get("cf-connecting-ip")) ||
      firstNonEmpty(h.get("x-vercel-ip")) ||
      "unknown"
    );
  }

  // NextApiRequest headers object
  const apiReq = req as NextApiRequest;
  const fwd = apiReq.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) return fwd.split(",")[0]?.trim() || "unknown";
  if (Array.isArray(fwd) && fwd.length > 0) return (fwd[0] ?? "").trim() || "unknown";

  const real = apiReq.headers["x-real-ip"];
  if (typeof real === "string" && real.trim()) return real.trim();
  if (Array.isArray(real) && real.length > 0) return (real[0] ?? "").trim() || "unknown";

  return apiReq.socket?.remoteAddress?.trim() || "unknown";
}

// ==================== HEADERS ====================

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

// ==================== WRAPPERS ====================

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

// ==================== ADMIN / DEBUG ====================

export async function getRateLimiterStats(): Promise<{
  memoryStoreSize: number;
  usingRedis: boolean;
}> {
  let usingRedis = false;
  const redis = await tryGetRedis();
  if (redis?.ping) {
    try {
      await redis.ping();
      usingRedis = true;
    } catch {
      usingRedis = false;
    }
  }
  return { memoryStoreSize: memoryStore.size, usingRedis };
}

export async function resetRateLimit(keyPrefix: string): Promise<void> {
  const redis = await tryGetRedis();
  if (redis?.keys && redis?.del) {
    try {
      const keys: string[] = await redis.keys(`${keyPrefix}*`);
      if (keys.length) await redis.del(...keys);
    } catch {
      // ignore
    }
  }
  for (const k of memoryStore.keys()) {
    if (k.startsWith(keyPrefix)) memoryStore.delete(k);
  }
}

export async function unblock(identifier: string, options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<void> {
  const key = makeStoreKey(identifier, options);
  const redis = await tryGetRedis();
  if (redis?.del) {
    try {
      await redis.del(key);
    } catch {
      // ignore
    }
  }
  memoryStore.delete(key);
}

export async function isRateLimited(identifier: string, options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<boolean> {
  const r = await rateLimit(identifier, options);
  return !r.allowed;
}

// --- BACKWARD COMPATIBILITY EXPORTS ---

export async function checkRateLimit(
  identifier: string, 
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<RateLimitResult> {
  return rateLimit(identifier, options);
}

// Alias for rateLimitForRequestIp
export const rateLimitForRequestIp = rateLimit;

// Alias functions for backward compatibility
export async function isRateLimitedRequest(
  identifier: string, 
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<boolean> {
  const result = await rateLimit(identifier, options);
  return !result.allowed;
}

export async function getRateLimiterStatsSync(): Promise<{
  memoryStoreSize: number;
  usingRedis: boolean;
}> {
  return getRateLimiterStats();
}

export async function resetRateLimitSync(keyPrefix: string): Promise<void> {
  return resetRateLimit(keyPrefix);
}

export async function unblockSync(identifier: string, options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<void> {
  return unblock(identifier, options);
}

// ==================== DEFAULT EXPORT ====================

// This is what's imported when someone does `import rateLimit from './rate-limit-unified'`
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
  // Include backward compatibility exports in default export
  checkRateLimit,
  rateLimitForRequestIp,
  isRateLimitedRequest,
  getRateLimiterStatsSync,
  resetRateLimitSync,
  unblockSync,
};

export default rateLimitModule;
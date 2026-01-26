// lib/server/rate-limit-unified.ts - EDGE RUNTIME COMPATIBLE
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

// ==================== RUNTIME DETECTION ====================

const isEdgeRuntime = typeof EdgeRuntime !== 'undefined' || typeof caches !== 'undefined';
const isNodeRuntime = typeof process !== 'undefined' && process.versions?.node;

// ==================== STORAGE LAYER ====================

type StoreRecord = { count: number; resetTime: number };

// Memory store (works in both Node and Edge)
const memoryStore = new Map<string, StoreRecord>();

function makeStoreKey(identifier: string, options: RateLimitOptions): string {
  return `${options.keyPrefix ?? "rl"}:${identifier}`;
}

// ✅ EDGE-SAFE: Upstash Redis REST client (works in Edge Runtime)
let upstashRedis: any = null;

async function getUpstashRedis(): Promise<any | null> {
  if (upstashRedis !== null) return upstashRedis;

  // Only try to load Upstash if environment variables are set
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    upstashRedis = false; // Mark as unavailable
    return null;
  }

  try {
    // Dynamic import of Upstash Redis (Edge-compatible)
    const { Redis } = await import('@upstash/redis');
    upstashRedis = new Redis({
      url,
      token,
    });
    return upstashRedis;
  } catch (error) {
    console.warn('[Rate Limit] Upstash Redis not available, using memory store');
    upstashRedis = false;
    return null;
  }
}

// ✅ EDGE-SAFE: KV storage using Vercel KV or Upstash
async function getKVStore(): Promise<any | null> {
  try {
    // Try Vercel KV first (if available)
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import('@vercel/kv');
      return kv;
    }
  } catch {
    // Vercel KV not available
  }

  // Fall back to Upstash
  return getUpstashRedis();
}

async function getRecord(key: string): Promise<StoreRecord | null> {
  // Try KV store first (Edge-compatible)
  if (isEdgeRuntime) {
    try {
      const kv = await getKVStore();
      if (kv?.get) {
        const data = await kv.get(key);
        if (data && typeof data === 'object') {
          return data as StoreRecord;
        }
      }
    } catch {
      // Fall back to memory
    }
  }

  // Node runtime: try ioredis (only if not in Edge)
  if (isNodeRuntime && !isEdgeRuntime) {
    try {
      // Dynamic import to prevent Edge runtime errors
      const redisModule = await import('@/lib/redis');
      const redis = typeof redisModule.getRedis === 'function' ? redisModule.getRedis() : null;
      
      if (redis?.get) {
        const raw = await redis.get(key);
        if (raw) {
          return JSON.parse(raw) as StoreRecord;
        }
      }
    } catch {
      // Redis not available or failed
    }
  }

  // Fall back to memory store
  return memoryStore.get(key) ?? null;
}

async function setRecord(key: string, data: StoreRecord, windowMs: number): Promise<void> {
  // Try KV store first (Edge-compatible)
  if (isEdgeRuntime) {
    try {
      const kv = await getKVStore();
      if (kv?.set) {
        const ttlSeconds = Math.ceil(windowMs / 1000);
        await kv.set(key, data, { ex: ttlSeconds });
      }
    } catch {
      // Fall back to memory
    }
  }

  // Node runtime: try ioredis (only if not in Edge)
  if (isNodeRuntime && !isEdgeRuntime) {
    try {
      const redisModule = await import('@/lib/redis');
      const redis = typeof redisModule.getRedis === 'function' ? redisModule.getRedis() : null;
      
      if (redis?.set) {
        const seconds = Math.ceil(windowMs / 1000);
        await redis.set(key, JSON.stringify(data), "EX", seconds);
      }
    } catch {
      // Redis not available
    }
  }

  // Always update memory store as fallback
  memoryStore.set(key, data);
  
  // Clean up after TTL (memory only)
  setTimeout(() => memoryStore.delete(key), windowMs);
}

async function deleteRecord(key: string): Promise<void> {
  // Try KV store first (Edge-compatible)
  if (isEdgeRuntime) {
    try {
      const kv = await getKVStore();
      if (kv?.del) {
        await kv.del(key);
      }
    } catch {
      // Ignore
    }
  }

  // Node runtime: try ioredis (only if not in Edge)
  if (isNodeRuntime && !isEdgeRuntime) {
    try {
      const redisModule = await import('@/lib/redis');
      const redis = typeof redisModule.getRedis === 'function' ? redisModule.getRedis() : null;
      
      if (redis?.del) {
        await redis.del(key);
      }
    } catch {
      // Ignore
    }
  }

  // Always clean memory store
  memoryStore.delete(key);
}

// ==================== CORE RATE LIMITING ====================

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

// ==================== IP EXTRACTION (EDGE-COMPATIBLE) ====================

function firstNonEmpty(v: unknown): string | null {
  if (typeof v === "string") {
    const s = v.trim();
    return s ? s : null;
  }
  return null;
}

export function getClientIp(req: NextApiRequest | NextRequest): string {
  // ✅ EDGE-SAFE: NextRequest / Edge style headers.get()
  const maybeHeaders = (req as any)?.headers;
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

  // Node.js API Routes style
  const apiReq = req as NextApiRequest;
  const fwd = apiReq.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) return fwd.split(",")[0]?.trim() || "unknown";
  if (Array.isArray(fwd) && fwd.length > 0) return (fwd[0] ?? "").trim() || "unknown";

  const real = apiReq.headers?.["x-real-ip"];
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

// ==================== MIDDLEWARE WRAPPERS ====================

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
  runtime: 'edge' | 'node' | 'unknown';
}> {
  let usingRedis = false;

  if (isEdgeRuntime) {
    try {
      const kv = await getKVStore();
      if (kv) {
        usingRedis = true;
      }
    } catch {
      usingRedis = false;
    }
  } else if (isNodeRuntime) {
    try {
      const redisModule = await import('@/lib/redis');
      const redis = typeof redisModule.getRedis === 'function' ? redisModule.getRedis() : null;
      if (redis?.ping) {
        await redis.ping();
        usingRedis = true;
      }
    } catch {
      usingRedis = false;
    }
  }

  return {
    memoryStoreSize: memoryStore.size,
    usingRedis,
    runtime: isEdgeRuntime ? 'edge' : isNodeRuntime ? 'node' : 'unknown',
  };
}

export async function resetRateLimit(keyPrefix: string): Promise<void> {
  // Edge runtime
  if (isEdgeRuntime) {
    try {
      const kv = await getKVStore();
      if (kv?.keys) {
        const keys = await kv.keys(`${keyPrefix}*`);
        if (keys.length > 0) {
          await Promise.all(keys.map((k: string) => kv.del(k)));
        }
      }
    } catch {
      // Ignore
    }
  }

  // Node runtime
  if (isNodeRuntime && !isEdgeRuntime) {
    try {
      const redisModule = await import('@/lib/redis');
      const redis = typeof redisModule.getRedis === 'function' ? redisModule.getRedis() : null;
      
      if (redis?.keys && redis?.del) {
        const keys: string[] = await redis.keys(`${keyPrefix}*`);
        if (keys.length) {
          await redis.del(...keys);
        }
      }
    } catch {
      // Ignore
    }
  }

  // Clean memory store
  for (const k of memoryStore.keys()) {
    if (k.startsWith(keyPrefix)) memoryStore.delete(k);
  }
}

export async function unblock(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<void> {
  const key = makeStoreKey(identifier, options);
  await deleteRecord(key);
}

export async function isRateLimited(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<boolean> {
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

export const rateLimitForRequestIp = rateLimit;

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
  runtime: 'edge' | 'node' | 'unknown';
}> {
  return getRateLimiterStats();
}

export async function resetRateLimitSync(keyPrefix: string): Promise<void> {
  return resetRateLimit(keyPrefix);
}

export async function unblockSync(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<void> {
  return unblock(identifier, options);
}

// ==================== DEFAULT EXPORT ====================

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
  checkRateLimit,
  rateLimitForRequestIp,
  isRateLimitedRequest,
  getRateLimiterStatsSync,
  resetRateLimitSync,
  unblockSync,
};

export default rateLimitModule;
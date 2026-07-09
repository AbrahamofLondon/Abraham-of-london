/* lib/server/security/rate-limit-provider.ts — Canonical rate-limit backend */
/* Authority (docs/architecture/infrastructure-authority.md): Neon PostgreSQL is the DEFAULT
 * durable authority; Upstash/Redis are optional acceleration used ONLY via explicit
 * RATE_LIMIT_BACKEND=upstash|redis; in-memory is local/dev/test only. Order: [explicit
 * accel if requested] -> Postgres(Neon) -> memory. */

import { getRedis, isRedisAvailable } from "@/lib/redis";
import type { PersistentRateLimitResult } from "./persistent-rate-limit";

export type RateLimitBackend = "upstash" | "postgres" | "memory";

export type RateLimitBackendStatus = {
  backend: RateLimitBackend;
  configured: boolean;
  reachable: boolean;
  fallbackReason?: string;
};

export type RateLimitVerdict = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfterMs: number;
  backend: RateLimitBackend;
};

type RateLimitOptions = {
  /** Unique rate-limit key (route + identity hash, no raw text) */
  key: string;
  /** Maximum requests in the window */
  limit: number;
  /** Window in milliseconds */
  windowMs: number;
  /** Whether to fail closed (block) when all backends are unavailable */
  failClosed?: boolean;
};

// In-memory fallback store (dev only)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Get Upstash REST API credentials from environment.
 * Supports both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */
function getUpstashConfig(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL || "").trim().replace(/^"|"$/g, "");
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim().replace(/^"|"$/g, "");
  if (!url || !token || url.includes("CHANGE_ME") || token.includes("CHANGE_ME")) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

/**
 * Make an Upstash REST API call.
 * Returns the parsed response or throws.
 */
async function upstashCommand(command: string, ...args: string[]): Promise<any> {
  const config = getUpstashConfig();
  if (!config) throw new Error("UPSTASH_NOT_CONFIGURED");

  const path = args.length > 0 ? `/${command}/${args.join("/")}` : `/${command}`;
  const uri = `${config.url}${path}`;

  const response = await fetch(uri, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`UPSTASH_ERROR: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check whether Upstash/Redis is configured and reachable.
 * Priority: Upstash REST API > ioredis > PostgreSQL > memory.
 */
export async function getRateLimitBackendStatus(): Promise<RateLimitBackendStatus> {
  // 1. Try Upstash REST API first
  const upstashConfig = getUpstashConfig();
  if (upstashConfig) {
    try {
      const result = await upstashCommand("ping");
      if (result?.result === "PONG") {
        return { backend: "upstash", configured: true, reachable: true };
      }
    } catch {
      // Upstash REST unreachable — fall through
    }
  }

  // 2. Try ioredis (REDIS_URL / REDIS_HOST)
  const hasRedisUrl = Boolean(
    process.env.REDIS_URL?.trim() ||
    process.env.REDIS_HOST?.trim()
  );
  const isDisabled = process.env.REDIS_DISABLED === "true" || process.env.USE_REDIS === "false";

  if (hasRedisUrl && !isDisabled) {
    try {
      const available = await isRedisAvailable();
      if (available) {
        return { backend: "upstash", configured: true, reachable: true };
      }
    } catch {
      // ioredis unreachable — fall through
    }
  }

  // 3. Try PostgreSQL
  const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());
  if (hasDatabase) {
    return {
      backend: "postgres",
      configured: true,
      reachable: true,
      fallbackReason: upstashConfig ? "Upstash configured but unreachable" : "Upstash not configured",
    };
  }

  // 4. Memory fallback
  return {
    backend: "memory",
    configured: false,
    reachable: false,
    fallbackReason: "No Upstash, Redis, or PostgreSQL configured",
  };
}

/**
 * Explicit acceleration opt-in (infrastructure-authority.md). Upstash/Redis are used ONLY
 * when RATE_LIMIT_BACKEND=upstash|redis; credential presence must not auto-promote them.
 */
function acceleratedBackend(): "upstash" | "redis" | null {
  const pref = (process.env.RATE_LIMIT_BACKEND || "").trim().toLowerCase();
  return pref === "upstash" ? "upstash" : pref === "redis" ? "redis" : null;
}

/**
 * Consume a rate-limit slot honouring the infrastructure authority rule
 * (docs/architecture/infrastructure-authority.md):
 *   0. explicit acceleration ONLY if RATE_LIMIT_BACKEND=upstash|redis (opt-in)
 *   1. PostgreSQL (Neon) — DEFAULT durable authority
 *   2. in-memory — local/dev/test fallback (warns + respects failClosed in production)
 *
 * failClosed here bounds the TELEMETRY write only; the customer decision/pilot path is
 * fire-and-forget / try-catch isolated and must never be blocked by a limiter outage.
 */
export async function consumeRateLimit(options: RateLimitOptions): Promise<RateLimitVerdict> {
  const { key, limit, windowMs, failClosed = true } = options;
  const accel = acceleratedBackend();

  // 0. Explicit acceleration opt-in (never auto-promoted by mere credential presence).
  if (accel === "upstash") {
    const upstashResult = await tryUpstashRateLimit(key, limit, windowMs);
    if (upstashResult) return upstashResult;
  } else if (accel === "redis") {
    const redisResult = await tryRedisRateLimit(key, limit, windowMs);
    if (redisResult) return redisResult;
  }

  // 1. Durable authority: PostgreSQL (Neon).
  const pgResult = await tryPostgresRateLimit(key, limit, windowMs);
  if (pgResult) return pgResult;

  // 2. Final fallback: in-memory (local/dev/test).
  return consumeMemoryRateLimit(key, limit, windowMs, failClosed);
}

/**
 * Try Upstash REST API rate limiting.
 * Uses INCR with EXPIRE via the Upstash REST API.
 */
async function tryUpstashRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitVerdict | null> {
  const config = getUpstashConfig();
  if (!config) return null;

  try {
    const storageKey = `rl:${key}`;
    const ttlSeconds = Math.ceil(windowMs / 1000);

    // Use INCR and set expiry on first increment
    const incrResult = await upstashCommand("incr", storageKey);
    const count = Number(incrResult?.result ?? 0);

    if (count === 1) {
      // First increment — set expiry
      await upstashCommand("expire", storageKey, String(ttlSeconds));
    }

    // Get remaining TTL for resetAt calculation
    let ttl = ttlSeconds * 1000;
    try {
      const ttlResult = await upstashCommand("ttl", storageKey);
      const ttlValue = Number(ttlResult?.result ?? ttlSeconds);
      ttl = Math.max(1, ttlValue) * 1000;
    } catch {
      // TTL check failed — use windowMs as estimate
    }

    const now = Date.now();
    const allowed = count <= limit;

    return {
      allowed,
      remaining: Math.max(0, limit - count),
      limit,
      resetAt: now + ttl,
      retryAfterMs: allowed ? 0 : ttl,
      backend: "upstash",
    };
  } catch {
    return null;
  }
}

/**
 * Try ioredis/Redis rate limiting via the existing persistent-rate-limit helper.
 */
async function tryRedisRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitVerdict | null> {
  try {
    const { consumePersistentRateLimit } = await import("./persistent-rate-limit");
    const result: PersistentRateLimitResult = await consumePersistentRateLimit({
      key,
      limit,
      windowMs,
      failClosed: false,
    });

    if (result.source !== "unavailable") {
      return {
        allowed: result.allowed,
        remaining: result.remaining,
        limit: result.limit,
        resetAt: result.resetAt,
        retryAfterMs: result.retryAfterMs,
        backend: "upstash",
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try PostgreSQL rate-limit backend directly.
 */
async function tryPostgresRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitVerdict | null> {
  try {
    const { consumePostgresRateLimit } = await import("./rate-limit-store.postgres");
    const parts = key.split(":");
    const routeKey = parts[0] ?? key;
    const identityKey = parts.slice(1).join(":") || key;

    const pgResult = await consumePostgresRateLimit({
      routeKey,
      identityKey,
      maxRequests: limit,
      windowMs,
    });

    return {
      allowed: pgResult.allowed,
      remaining: pgResult.remaining,
      limit,
      resetAt: pgResult.resetAt.getTime(),
      retryAfterMs: pgResult.allowed ? 0 : pgResult.resetAt.getTime() - Date.now(),
      backend: "postgres",
    };
  } catch {
    return null;
  }
}

/**
 * In-memory rate-limit fallback (dev only).
 * In production, respects failClosed.
 */
function consumeMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  failClosed: boolean,
): RateLimitVerdict {
  const now = Date.now();
  const entry = memoryStore.get(key);

  // Window expired — reset
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      resetAt: now + windowMs,
      retryAfterMs: 0,
      backend: "memory",
    };
  }

  entry.count++;

  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    console.warn(
      "[RATE_LIMIT] Production rate limiting is using memory fallback. Configure Upstash Redis.",
    );
  }

  if (entry.count > limit) {
    if (failClosed && !isDev) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        resetAt: entry.resetAt,
        retryAfterMs: entry.resetAt - now,
        backend: "memory",
      };
    }
    // Dev or fail-open: allow but warn
    return {
      allowed: true,
      remaining: 0,
      limit,
      resetAt: entry.resetAt,
      retryAfterMs: 0,
      backend: "memory",
    };
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    limit,
    resetAt: entry.resetAt,
    retryAfterMs: 0,
    backend: "memory",
  };
}

/**
 * Build a rate-limit key that contains no raw user text.
 * Format: {route}:{identityHash}:{dateHourBucket}
 */
export function buildRateLimitKey(
  route: string,
  identity: string,
): string {
  const now = new Date();
  const hourBucket = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}${String(now.getUTCHours()).padStart(2, "0")}`;
  return `${route}:${identity}:${hourBucket}`;
}

/**
 * Hash an IP address for rate-limit keys.
 * Never stores raw IPs in Redis keys.
 */
export function hashIpForRateLimit(ip: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(ip.trim()).digest("hex").slice(0, 16);
}
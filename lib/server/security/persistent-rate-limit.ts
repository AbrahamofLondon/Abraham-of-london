// NOTE: Do NOT use import "server-only" here — this module is imported
// by both App Router (server components) and Pages Router API routes.
// The Pages Router does not support server-only imports.

import { getRedis } from "@/lib/redis";

export type PersistentRateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfterMs: number;
  key: string;
  source: "redis" | "postgres" | "unavailable";
};

type ConsumeOptions = {
  key: string;
  limit: number;
  windowMs: number;
  failClosed?: boolean;
};

function toSafePositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.floor(value);
}

function unavailableResult(options: ConsumeOptions): PersistentRateLimitResult {
  const now = Date.now();
  return {
    allowed: false,
    remaining: 0,
    limit: options.limit,
    resetAt: now + options.windowMs,
    retryAfterMs: options.windowMs,
    key: options.key,
    source: "unavailable",
  };
}

export async function consumePersistentRateLimit(
  options: ConsumeOptions,
): Promise<PersistentRateLimitResult> {
  const limit = toSafePositiveInt(options.limit, 1);
  const windowMs = toSafePositiveInt(options.windowMs, 60_000);
  const key = String(options.key || "").trim();
  const failClosed = options.failClosed !== false;

  if (!key) {
    throw new Error("[RATE_LIMIT] Missing persistent rate-limit key");
  }

  try {
    const redis = getRedis();
    const storageKey = `rate_limit:${key}`;
    const now = Date.now();

    const execResult = await redis
      .multi()
      .incr(storageKey)
      .pttl(storageKey)
      .exec();

    const count = Number(execResult?.[0]?.[1] ?? 0);
    const ttlBeforeExpiry = Number(execResult?.[1]?.[1] ?? -1);

    let ttlMs = ttlBeforeExpiry;
    if (count === 1 || ttlMs < 0) {
      await redis.pexpire(storageKey, windowMs);
      ttlMs = windowMs;
    }

    const normalizedTtlMs = Math.max(1, ttlMs);
    const resetAt = now + normalizedTtlMs;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      limit,
      resetAt,
      retryAfterMs: count > limit ? normalizedTtlMs : 0,
      key,
      source: "redis",
    };
  } catch (redisError) {
    // Redis unavailable — fall back to Postgres (authoritative store)
    // Dynamic import to avoid bundling Prisma into client
    try {
      const { consumePostgresRateLimit } = await import("./rate-limit-store.postgres");
      const pgResult = await consumePostgresRateLimit({
        routeKey: key.split(":")[0] ?? key,
        identityKey: key.split(":").slice(1).join(":") || key,
        maxRequests: limit,
        windowMs,
      });
      return {
        allowed: pgResult.allowed,
        remaining: pgResult.remaining,
        limit,
        resetAt: pgResult.resetAt.getTime(),
        retryAfterMs: pgResult.allowed ? 0 : pgResult.resetAt.getTime() - Date.now(),
        key,
        source: "postgres",
      };
    } catch (pgError) {
      // Both Redis and Postgres unavailable
      console.error("[RATE_LIMIT] Both Redis and Postgres unavailable", { redisError, pgError });
      if (!failClosed) {
        // Only non-critical routes may degrade
        const now = Date.now();
        return {
          allowed: true,
          remaining: Math.max(0, limit - 1),
          limit,
          resetAt: now + windowMs,
          retryAfterMs: 0,
          key,
          source: "unavailable",
        };
      }
      return unavailableResult({ key, limit, windowMs, failClosed });
    }
  }
}

export async function clearPersistentRateLimit(key: string): Promise<boolean> {
  const normalizedKey = String(key || "").trim();
  if (!normalizedKey) {
    return false;
  }

  try {
    const redis = getRedis();
    const deleted = await redis.del(`rate_limit:${normalizedKey}`);
    return deleted > 0;
  } catch {
    return false;
  }
}

export async function getPersistentRateLimitStats() {
  try {
    const redis = getRedis();
    let cursor = "0";
    let totalKeys = 0;
    const keys: Array<{ key: string }> = [];

    do {
      const scanResult = await redis.scan(
        cursor,
        "MATCH",
        "rate_limit:*",
        "COUNT",
        "100",
      );

      cursor = Array.isArray(scanResult) ? String(scanResult[0] ?? "0") : "0";
      const batch = Array.isArray(scanResult?.[1]) ? scanResult[1] : [];
      totalKeys += batch.length;

      for (const rawKey of batch.slice(0, Math.max(0, 100 - keys.length))) {
        keys.push({ key: String(rawKey).replace(/^rate_limit:/, "") });
      }
    } while (cursor !== "0" && keys.length < 100);

    return {
      source: "redis" as const,
      totalKeys,
      keys,
    };
  } catch {
    return {
      source: "unavailable" as const,
      totalKeys: 0,
      keys: [],
    };
  }
}

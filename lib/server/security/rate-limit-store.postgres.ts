/**
 * Postgres-backed rate limiter — the authoritative store.
 *
 * This is the fallback when Redis is unavailable.
 * Uses the RateLimitBucket model with transaction-safe upserts.
 * Cleans expired buckets on read.
 */

import { prisma } from "@/lib/prisma";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  source: "postgres";
};

export async function consumePostgresRateLimit(opts: {
  routeKey: string;
  identityKey: string;
  maxRequests: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { routeKey, identityKey, maxRequests, windowMs } = opts;
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs);

  // Upsert with atomic increment
  const bucket = await prisma.rateLimitBucket.upsert({
    where: {
      id: `${routeKey}:${identityKey}:${windowStart.getTime()}`,
    },
    create: {
      id: `${routeKey}:${identityKey}:${windowStart.getTime()}`,
      routeKey,
      identityKey,
      count: 1,
      windowStart,
      expiresAt,
    },
    update: {
      count: { increment: 1 },
    },
  });

  const allowed = bucket.count <= maxRequests;

  return {
    allowed,
    remaining: Math.max(0, maxRequests - bucket.count),
    resetAt: expiresAt,
    source: "postgres",
  };
}

/**
 * Clean expired rate limit buckets.
 * Call periodically or on read.
 */
export async function cleanExpiredBuckets(): Promise<number> {
  const result = await prisma.rateLimitBucket.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

export async function clearPostgresRateLimitBuckets(opts: {
  routeKey: string;
  identityKeys: string[];
}): Promise<number> {
  const routeKey = String(opts.routeKey || "").trim();
  const identityKeys = Array.from(
    new Set(opts.identityKeys.map((key) => String(key || "").trim()).filter(Boolean)),
  );

  if (!routeKey || identityKeys.length === 0) {
    return 0;
  }

  const result = await prisma.rateLimitBucket.deleteMany({
    where: {
      routeKey,
      identityKey: { in: identityKeys },
    },
  });

  return result.count;
}

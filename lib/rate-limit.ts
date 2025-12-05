// lib/rate-limit.ts

// Very simple in-memory rate limiter.
// For Netlify/Next serverless this resets per function instance, which is fine
// for a read-only /api/downloads endpoint.

export interface RateLimitConfig {
  windowMs: number; // time window in ms
  max: number;      // max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number; // epoch ms
}

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  API_GENERAL: {
    windowMs: 60_000, // 1 minute
    max: 60,          // 60 requests/minute per key
  },
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export async function rateLimitAsync(
  key: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = buckets.get(key);

  let bucket: Bucket;

  if (!existing || existing.resetAt <= now) {
    bucket = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  } else {
    bucket = existing;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  const allowed = bucket.count <= config.max;
  const remaining = Math.max(config.max - bucket.count, 0);

  return {
    allowed,
    remaining,
    limit: config.max,
    resetAt: bucket.resetAt,
  };
}

export function createRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)), // seconds
  };
}
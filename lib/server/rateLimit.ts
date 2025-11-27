// lib/server/rateLimit.ts
// Simple in-memory IP-based rate limiter (per instance)

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

interface Entry {
  count: number;
  first: number;
}

const store = new Map<string, Entry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const { limit, windowMs, keyPrefix = "rl" } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;

  const entry = store.get(storeKey);

  if (!entry) {
    store.set(storeKey, { count: 1, first: now });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  const elapsed = now - entry.first;

  if (elapsed > windowMs) {
    // window reset
    store.set(storeKey, { count: 1, first: now });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - elapsed,
    };
  }

  entry.count += 1;
  store.set(storeKey, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    retryAfterMs: 0,
  };
}
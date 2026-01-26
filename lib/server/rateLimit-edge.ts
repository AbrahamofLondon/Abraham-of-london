// lib/server/rate-limit-edge.ts
import "server-only";
import type { NextRequest } from "next/server";

// Uses Upstash Redis REST (Edge-safe: fetch-based)
// pnpm add @upstash/redis @upstash/ratelimit
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type EdgeRateLimitParams = {
  key: string;
  windowSeconds: number;
  limit: number;
};

type EdgeRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
  retryAfterSeconds?: number;
  headers: Record<string, string>;
};

// Lazy singletons (Edge safe)
let _redis: Redis | null = null;
let _limiters: Map<string, Ratelimit> | null = null;

function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Hard fail is better than silent “it works locally” lies.
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (required for Edge rate limiting)."
    );
  }

  _redis = new Redis({ url, token });
  return _redis;
}

function getLimiter(windowSeconds: number, limit: number): Ratelimit {
  if (!_limiters) _limiters = new Map();

  const k = `${windowSeconds}:${limit}`;
  const cached = _limiters.get(k);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: true,
    prefix: "aol_edge_rl",
  });

  _limiters.set(k, limiter);
  return limiter;
}

export async function edgeRateLimit(params: EdgeRateLimitParams): Promise<EdgeRateLimitResult> {
  const { key, windowSeconds, limit } = params;
  const limiter = getLimiter(windowSeconds, limit);

  const r = await limiter.limit(key);

  const resetAtMs =
    typeof r.reset === "number"
      ? r.reset
      : r.reset instanceof Date
        ? r.reset.getTime()
        : Date.now() + windowSeconds * 1000;

  const remaining = typeof r.remaining === "number" ? r.remaining : 0;

  const allowed = !!r.success;
  const retryAfterSeconds = allowed ? undefined : Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000));

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": String(Math.floor(resetAtMs / 1000)),
  };

  if (!allowed) headers["Retry-After"] = String(retryAfterSeconds);

  return {
    allowed,
    remaining,
    resetAt: resetAtMs,
    retryAfterSeconds,
    headers,
  };
}
// lib/server/rate-limit-unified-redis.ts
import "server-only";

// Optional extra guard (helps when bundlers get clever)
if (process.env.NEXT_RUNTIME === "edge") {
  throw new Error("rate-limit-unified-redis.ts is Node-only and must not be imported in the Edge runtime.");
}

// your existing implementation can remain (ioredis/prisma/etc)
// Example signature placeholders:
export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function createRateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(r.remaining ?? 0),
    "X-RateLimit-Reset": String(Math.floor((r.resetAt ?? Date.now()) / 1000)),
  };
}

export function createRateLimitedResponse(r: RateLimitResult) {
  // keep your existing NextResponse logic
  // (don’t import NextResponse in shared libs if you also use it outside Next)
  return {
    statusCode: 429,
    headers: {
      "Content-Type": "application/json",
      ...createRateLimitHeaders(r),
    },
    body: JSON.stringify({ error: "Too many requests" }),
  };
}

// check(...) stays Node-only, keep ioredis inside this module
export async function check(/* ... */): Promise<RateLimitResult> {
  // keep your existing ioredis-backed logic
  return { allowed: true, remaining: 1, resetAt: Date.now() + 60_000 };
}
/**
 * lib/runtime/simple-rate-limit.ts
 *
 * §10 — a small, dependency-free in-process sliding-window limiter for public endpoints
 * (funnel telemetry). Mirrors the existing boardroom limiter pattern.
 *
 * SERVERLESS CAVEAT (documented, not hidden): this is per-instance. On multi-instance
 * serverless it bounds abuse per warm instance but is not a global limit. A production
 * global limit needs a shared store (Redis/DB); this is the correct fallback where that
 * infrastructure is not yet wired, and it fails OPEN on its own errors (never blocks a
 * legitimate event because the limiter itself broke).
 */

interface Bucket { hits: number[]; }
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

export interface RateLimitResult { ok: boolean; remaining: number; resetInMs: number; }

/**
 * @param key      caller identity (session id or IP)
 * @param max      max events per window
 * @param windowMs window length in ms
 */
export function checkRateLimit(key: string, max: number, windowMs: number, now = Date.now()): RateLimitResult {
  try {
    if (now - lastSweep > windowMs) { // periodic eviction to bound memory
      for (const [k, b] of buckets) { if (b.hits.every((t) => now - t > windowMs)) buckets.delete(k); }
      lastSweep = now;
    }
    let b = buckets.get(key);
    if (!b) { b = { hits: [] }; buckets.set(key, b); }
    b.hits = b.hits.filter((t) => now - t < windowMs);
    if (b.hits.length >= max) {
      const oldest = b.hits[0] ?? now;
      return { ok: false, remaining: 0, resetInMs: Math.max(0, windowMs - (now - oldest)) };
    }
    b.hits.push(now);
    return { ok: true, remaining: max - b.hits.length, resetInMs: windowMs };
  } catch {
    return { ok: true, remaining: max, resetInMs: windowMs }; // fail open on limiter error
  }
}

/** Test/util: clear all buckets. */
export function _resetRateLimitForTest(): void { buckets.clear(); lastSweep = 0; }

/** Best-effort client IP from a Next API request headers object. */
export function clientIpFrom(headers: Record<string, string | string[] | undefined>): string {
  const xf = headers["x-forwarded-for"];
  const raw = Array.isArray(xf) ? xf[0] : xf;
  return (raw?.split(",")[0]?.trim()) || "unknown";
}

/**
 * lib/boardroom/boardroom-server-rate-limit.ts
 *
 * Server-side in-process rate limiter for boardroom token validation.
 * Security control — not for UX. Limits token probe attacks by IP.
 *
 * Design: module-level Map (single process). Each bucket: { count, resetAt }.
 * On limit breach → constant 429. Does NOT reveal whether token is valid.
 */

"server-only";

// ─── Types ────────────────────────────────────────────────────────────────────

type Bucket = { count: number; resetAt: number };

// ─── State ────────────────────────────────────────────────────────────────────

/** Keyed by IP address or "unknown". Evicted when resetAt passes. */
const buckets = new Map<string, Bucket>();

// ─── Config ───────────────────────────────────────────────────────────────────

/** Max requests per IP per window. */
const LIMIT = 10;

/** Window size in ms. */
const WINDOW_MS = 60_000; // 1 minute

// ─── Core ─────────────────────────────────────────────────────────────────────

function evictExpired() {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Check and record a request for the given IP key.
 * Returns { ok: true } if under limit, { ok: false } if rate-limited.
 */
export function checkBoardroomRateLimit(ip: string): { ok: boolean; remaining: number; resetAt: number } {
  const key = String(ip || "unknown").slice(0, 64);
  const now = Date.now();

  // Periodic cleanup — run ~5% of the time to avoid stale bucket accumulation
  if (Math.random() < 0.05) evictExpired();

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket: Bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
    return { ok: true, remaining: LIMIT - 1, resetAt: bucket.resetAt };
  }

  if (existing.count >= LIMIT) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: LIMIT - existing.count, resetAt: existing.resetAt };
}

/**
 * Extract the most reliable IP from a Next.js Request.
 * Prefer x-forwarded-for (set by Vercel/Cloudflare). Falls back to "unknown".
 */
export function extractIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return (xff.split(",")[0] ?? "").trim() || "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

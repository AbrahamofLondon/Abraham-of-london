// lib/inner-circle/rate-limit.ts
const buckets = new Map<string, { count: number; reset: number }>();

export async function rateLimitInnerCircleAccess(ip: string) {
  const limit = 30;
  const windowMs = 60_000;
  const now = Date.now();

  const entry = buckets.get(ip);
  if (!entry || now > entry.reset) {
    buckets.set(ip, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.reset };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.reset };
}

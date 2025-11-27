// lib/security/rateLimit.ts
const ipCache = new Map<string, { count: number; last: number }>();
const LIMIT = 40;
const WINDOW = 60_000;

export function limitIp(ip: string) {
  const now = Date.now();
  const entry = ipCache.get(ip);

  if (!entry) {
    ipCache.set(ip, { count: 1, last: now });
    return;
  }

  if (now - entry.last < WINDOW) {
    entry.count += 1;
    if (entry.count > LIMIT) throw new Error("RATE_LIMIT");
  } else {
    ipCache.set(ip, { count: 1, last: now });
  }
}
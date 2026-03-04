/* lib/rate-limit/client.ts — CLIENT-SIDE THROTTLE (UX-only) */

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  persist?: boolean;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number; // epoch ms
};

type Bucket = { count: number; resetAt: number };

const mem = new Map<string, Bucket>();

function nowMs() {
  return Date.now();
}

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function storageKey(key: string) {
  return `aol_rl:${key}`;
}

function normalizeKey(key: unknown) {
  return String(key || "").trim().slice(0, 180); // keep it bounded
}

function safeInt(n: unknown, fallback: number) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.floor(x) : fallback;
}

function loadBucket(key: string, persist: boolean): Bucket | null {
  const m = mem.get(key);
  if (m) return m;

  if (!persist || !canUseLocalStorage()) return null;

  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Bucket;
    if (!parsed || typeof parsed.count !== "number" || typeof parsed.resetAt !== "number") return null;

    return parsed;
  } catch {
    return null;
  }
}

function saveBucket(key: string, bucket: Bucket, persist: boolean) {
  mem.set(key, bucket);

  if (!persist || !canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(bucket));
  } catch {
    // ignore
  }
}

function clearBucket(key: string, persist: boolean) {
  mem.delete(key);
  if (!persist || !canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(storageKey(key));
  } catch {
    // ignore
  }
}

/**
 * withRateLimit (CLIENT)
 * UX throttle only. Not security.
 */
export async function withRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const key = normalizeKey(opts.key);
  const limit = Math.max(1, safeInt(opts.limit, 1));
  const windowMs = Math.max(250, safeInt(opts.windowMs, 1000));
  const persist = Boolean(opts.persist);

  const now = nowMs();

  if (!key) {
    return { ok: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs };
  }

  const existing = loadBucket(key, persist);

  // new bucket or expired bucket → reset
  if (!existing || existing.resetAt <= now) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs };
    saveBucket(key, bucket, persist);
    return { ok: true, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
  }

  // overflow → deny
  if (existing.count >= limit) {
    saveBucket(key, existing, persist);
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  // increment
  const bucket: Bucket = { count: existing.count + 1, resetAt: existing.resetAt };
  saveBucket(key, bucket, persist);

  return { ok: true, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

/**
 * Optional helper: clear a key (useful if you want to reset UX throttle after a successful action)
 */
export function clearRateLimit(key: string, persist = false) {
  const k = normalizeKey(key);
  if (!k) return;
  clearBucket(k, persist);
}
// lib/inner-circle/access.client.ts — FORTIFIED + BACKWARD COMPAT

export type AccessTier =
  | "public"
  | "member"
  | "inner-circle"
  | "client"
  | "legacy"
  | "architect"
  | "owner";

export interface InnerCircleAccess {
  hasAccess: boolean;
  reason:
    | "no_request"
    | "invalid_token"
    | "expired_token"
    | "insufficient_tier"
    | "rate_limited"
    | "geo_restricted"
    | "device_unknown"
    | "session_expired"
    | "internal_error"
    | "maintenance_mode"
    | "requires_auth";
  tier?: AccessTier;
  expiresAt?: string;
  rateLimit?: {
    remaining: number;
    reset: number;
    total: number;
  };
}

type CheckAccessOptions = {
  force?: boolean; // bypass cache
  timeoutMs?: number;
  endpoint?: string; // default: "/api/access/check"
};

let cachedAccess: InnerCircleAccess | null = null;
let lastCheckTime = 0;
const CACHE_TTL = 30_000;

function asOptions(input?: boolean | CheckAccessOptions): CheckAccessOptions {
  if (typeof input === "boolean") return { force: input };
  return input ?? {};
}

/**
 * checkAccess()
 * - Backward compatible: checkAccess(true/false)
 * - Preferred: checkAccess({ force, timeoutMs, endpoint })
 */
export async function checkAccess(input?: boolean | CheckAccessOptions): Promise<InnerCircleAccess> {
  const { force = false, timeoutMs = 4000, endpoint = "/api/access/check" } = asOptions(input);

  const now = Date.now();
  if (!force && cachedAccess && now - lastCheckTime < CACHE_TTL) {
    return cachedAccess;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
      credentials: "same-origin",
    });

    // Rate limited / overloaded
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const reset = retryAfter
        ? Date.now() + Math.max(0, Number(retryAfter) * 1000)
        : Date.now() + 60_000;

      const data: InnerCircleAccess = {
        hasAccess: false,
        reason: "rate_limited",
        rateLimit: { remaining: 0, reset, total: 100 },
      };

      cachedAccess = data;
      lastCheckTime = now;
      return data;
    }

    if (!res.ok) {
      throw new Error(`Access check failed: ${res.status}`);
    }

    const data = (await res.json()) as InnerCircleAccess;

    cachedAccess = data;
    lastCheckTime = now;
    return data;
  } catch (err: any) {
    const aborted = err?.name === "AbortError";
    const data: InnerCircleAccess = {
      hasAccess: false,
      reason: aborted ? "rate_limited" : "internal_error",
    };

    cachedAccess = data;
    lastCheckTime = Date.now();
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function clearAccessCache() {
  cachedAccess = null;
  lastCheckTime = 0;
}

/**
 * BACKWARD COMPAT:
 * Some components import invalidateAccessCache().
 * Keep this alias so builds never break again.
 */
export const invalidateAccessCache = clearAccessCache;

/**
 * HEAD request for lightweight access checks
 */
export async function quickCheck(): Promise<boolean> {
  try {
    const res = await fetch("/api/access/check", {
      method: "HEAD",
      cache: "no-store",
      credentials: "same-origin",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Wait for access to be available (polling)
 */
export async function waitForAccess(
  timeoutMs = 10000,
  intervalMs = 500
): Promise<InnerCircleAccess | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const access = await checkAccess({ force: true });
    if (access.hasAccess) return access;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  return null;
}

export default {
  check: checkAccess,
  clear: clearAccessCache,
  invalidate: invalidateAccessCache,
  quickCheck,
  waitForAccess,
};
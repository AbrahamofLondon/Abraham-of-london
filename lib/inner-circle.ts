// lib/inner-circle.ts
// Production-safe re-export hub + backward compat layer

export * from "./inner-circle/access";
export * from "./inner-circle/keys";

import {
  withInnerCircleAccess,
  getInnerCircleAccess,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  type InnerCircleAccess,
  type AccessCheckOptions,
} from "./inner-circle/access";

import {
  verifyInnerCircleKey,
  getPrivacySafeStats,
  createOrUpdateMemberAndIssueKey,
  type VerifyInnerCircleKeyResult,
  type InnerCircleStats,
  type CleanupResult,
  type IssuedKey,
  type StoredKey,
  type KeyTier,
  type CreateOrUpdateMemberArgs,
} from "./inner-circle/keys";

// --------------------
// Backward compat
// --------------------
export const INNER_CIRCLE_CONFIG = {
  enabled: true,
  maxUnlocksDaily: Number(process.env.INNER_CIRCLE_MAX_UNLOCKS_DAILY || "20"),
  store: process.env.INNER_CIRCLE_STORE || "db",
  keyPrefix: "icl_",
  keyExpiryDays: 90,
  maxKeysPerMember: 3,
};

// Historical alias used by older pages/api handlers:
export const withInnerCircleRateLimit = withInnerCircleAccess;

/**
 * Back-compat wrapper:
 * Older handlers expect: `{ verification, rateLimit, headers }`
 *
 * - `verification` is the real VerifyInnerCircleKeyResult from keys layer
 * - `rateLimit` + `headers` are best-effort (only when req exists + access layer supports it)
 */
export async function verifyInnerCircleKeyWithRateLimit(
  key: string,
  req?: any
): Promise<{
  verification: VerifyInnerCircleKeyResult;
  rateLimit?: {
    allowed: boolean;
    remaining?: number;
    resetAt?: number;
    retryAfterMs?: number;
  };
  headers?: Record<string, string>;
}> {
  // 1) Apply rate limit if we can
  let headers: Record<string, string> | undefined;
  let rateLimit: {
    allowed: boolean;
    remaining?: number;
    resetAt?: number;
    retryAfterMs?: number;
  } | undefined;

  try {
    if (req && typeof withInnerCircleAccess === "function") {
      // Prefer explicit VERIFY config if you have one, else fall back to AUTH, else hard default
      const cfg =
        (RATE_LIMIT_CONFIGS as any)?.VERIFY ??
        (RATE_LIMIT_CONFIGS as any)?.AUTH ?? {
          limit: 30,
          windowMs: 60_000,
          keyPrefix: "inner_circle_verify",
          blockDuration: 5 * 60_000,
        };

      // We allow both "boolean" and "object" patterns because your access layer may differ.
      const access = await withInnerCircleAccess(req, cfg as any);

      // Common patterns:
      // A) { allowed, result }
      // B) { ok, rateLimit }
      // C) boolean
      const allowed =
        typeof access === "boolean"
          ? access
          : typeof access?.allowed === "boolean"
            ? access.allowed
            : typeof access?.ok === "boolean"
              ? access.ok
              : true;

      const result = (access as any)?.result ?? (access as any)?.rateLimit ?? undefined;

      if (result) {
        rateLimit = {
          allowed,
          remaining: result.remaining,
          resetAt: result.resetAt ?? result.resetTime,
          retryAfterMs: result.retryAfterMs,
        };

        // Only add headers if helper exists and result is real
        if (typeof createRateLimitHeaders === "function") {
          const h = createRateLimitHeaders(result as any);
          if (h && typeof h === "object") {
            headers = Object.fromEntries(
              Object.entries(h).map(([k, v]) => [k, String(v)])
            );
          }
        }
      }

      // If rate-limited, short-circuit without touching keys DB
      if (!allowed) {
        // We cannot safely fabricate a fully-correct VerifyInnerCircleKeyResult shape
        // across versions, so we return a minimal "invalid" object with a cast.
        return {
          verification: { valid: false, reason: "rate_limited" } as any as VerifyInnerCircleKeyResult,
          rateLimit,
          headers,
        };
      }
    }
  } catch {
    // If rate limiting fails, do NOT block verification.
    // Silent fail is safer than locking out real users due to infra hiccups.
  }

  // 2) Perform verification
  const verification = await verifyInnerCircleKey(key);

  return { verification, rateLimit, headers };
}

// Straight aliases (some older code may import these names)
export const getPrivacySafeStatsWithRateLimit = getPrivacySafeStats;
export const createOrUpdateMemberAndIssueKeyWithRateLimit =
  createOrUpdateMemberAndIssueKey;

// REMOVE THIS LINE - IT'S A DUPLICATE AND CAUSES THE ERROR:
// export const verifyInnerCircleKeyWithRateLimit = verifyInnerCircleKey;

export const healthCheckEnhanced = async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  store: process.env.INNER_CIRCLE_STORE || "memory",
});

// Types (optional explicit re-export for clarity)
export type {
  InnerCircleAccess,
  AccessCheckOptions,
  KeyTier,
  StoredKey,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleStats,
  CleanupResult,
};

// Default export (optional; keep if older code uses default import)
const innerCircle = {
  withInnerCircleAccess,
  getInnerCircleAccess,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,

  verifyInnerCircleKey,
  getPrivacySafeStats,
  createOrUpdateMemberAndIssueKey,

  // compat
  withInnerCircleRateLimit,
  getPrivacySafeStatsWithRateLimit,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  healthCheckEnhanced,

  INNER_CIRCLE_CONFIG,
};

export default innerCircle;
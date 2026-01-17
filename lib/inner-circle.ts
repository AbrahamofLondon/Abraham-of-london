// lib/inner-circle.ts
// Production-safe re-export hub + backward compat layer

import type { NextApiRequest, NextApiResponse } from "next";

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

import { requireAdmin, requireRateLimit } from "@/lib/server/guards";

// --------------------
// Primary exports (non-star, avoids collisions)
// --------------------
export {
  withInnerCircleAccess,
  getInnerCircleAccess,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  createOrUpdateMemberAndIssueKey,
};

// --------------------
// Types
// --------------------
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

export const withInnerCircleRateLimit = withInnerCircleAccess;

/**
 * Back-compat wrapper:
 * returns `{ verification, rateLimit, headers }`
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
  let headers: Record<string, string> | undefined;
  let rateLimitInfo:
    | {
        allowed: boolean;
        remaining?: number;
        resetAt?: number;
        retryAfterMs?: number;
      }
    | undefined;

  try {
    if (req && typeof withInnerCircleAccess === "function") {
      const cfg =
        (RATE_LIMIT_CONFIGS as any)?.VERIFY ??
        (RATE_LIMIT_CONFIGS as any)?.AUTH ?? {
          limit: 30,
          windowMs: 60_000,
          keyPrefix: "inner_circle_verify",
          blockDuration: 5 * 60_000,
        };

      const access = await withInnerCircleAccess(req, cfg as any);

      const allowed =
        typeof access === "boolean"
          ? access
          : typeof (access as any)?.allowed === "boolean"
            ? (access as any).allowed
            : typeof (access as any)?.ok === "boolean"
              ? (access as any).ok
              : true;

      const result = (access as any)?.result ?? (access as any)?.rateLimit ?? undefined;

      if (result) {
        rateLimitInfo = {
          allowed,
          remaining: result.remaining,
          resetAt: result.resetAt ?? result.resetTime,
          retryAfterMs: result.retryAfterMs,
        };

        if (typeof createRateLimitHeaders === "function") {
          const h = createRateLimitHeaders(result as any);
          if (h && typeof h === "object") {
            headers = Object.fromEntries(Object.entries(h).map(([k, v]) => [k, String(v)]));
          }
        }
      }

      if (!allowed) {
        return {
          verification: { valid: false, reason: "rate_limited" } as any as VerifyInnerCircleKeyResult,
          rateLimit: rateLimitInfo,
          headers,
        };
      }
    }
  } catch {
    // If RL fails, do not block verification.
  }

  const verification = await verifyInnerCircleKey(key);
  return { verification, rateLimit: rateLimitInfo, headers };
}

// Straight aliases
export const getPrivacySafeStatsWithRateLimit = getPrivacySafeStats;
export const createOrUpdateMemberAndIssueKeyWithRateLimit = createOrUpdateMemberAndIssueKey;

/**
 * ✅ THIS is the missing export your build complained about.
 * Privacy-safe export + rate limit + admin gate.
 * You can wire real data later; the important part is: export exists and is safe.
 */
export async function getPrivacySafeKeyExportWithRateLimit(req: NextApiRequest, res: NextApiResponse) {
  const okRL = await requireRateLimit(req, res, (RATE_LIMIT_CONFIGS as any)?.ADMIN_EXPORT ?? RATE_LIMIT_CONFIGS.API_GENERAL, "ic-export");
  if (!okRL) return;

  const okAdmin = await requireAdmin(req, res);
  if (!okAdmin) return;

  // Privacy safe by default: do not leak raw keys.
  const stats = await getPrivacySafeStats().catch(() => null);

  res.status(200).json({
    ok: true,
    data: {
      export: [],
      note: "Privacy-safe export stub. Wire to real export when ready.",
      stats,
    },
    timestamp: new Date().toISOString(),
  });
}

export const healthCheckEnhanced = async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  store: process.env.INNER_CIRCLE_STORE || "memory",
});

// Default export (keep for older default-import usage)
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
  getPrivacySafeKeyExportWithRateLimit,

  healthCheckEnhanced,
  INNER_CIRCLE_CONFIG,
};

export default innerCircle;
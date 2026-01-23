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
// Type Definitions
// --------------------
export type AccessCheckReason = 
  | 'expired'
  | 'no_cookie'
  | 'invalid_cookie'
  | 'rate_limited'
  | 'ip_blocked'
  | 'no_request'
  | 'build_time'
  | 'local_storage'
  | 'api_error'
  | 'valid';

// Re-export all types with proper AccessCheckReason
export type { 
  InnerCircleAccess as BaseInnerCircleAccess,
  AccessCheckOptions,
  KeyTier,
  StoredKey,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleStats,
  CleanupResult 
};

// Extend InnerCircleAccess with AccessCheckReason
export type InnerCircleAccess = BaseInnerCircleAccess & {
  reason?: AccessCheckReason;
};

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
// Backward compat constants
// --------------------
export const INNER_CIRCLE_CONFIG = {
  enabled: true,
  maxUnlocksDaily: Number(process.env.INNER_CIRCLE_MAX_UNLOCKS_DAILY || "20"),
  store: process.env.INNER_CIRCLE_STORE || "db",
  keyPrefix: "icl_",
  keyExpiryDays: 90,
  maxKeysPerMember: 3,
} as const;

// Alias for backward compatibility
export const withInnerCircleRateLimit = withInnerCircleAccess;

/**
 * Backward compatibility wrapper:
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
          verification: { 
            valid: false, 
            reason: "rate_limited" 
          } as VerifyInnerCircleKeyResult,
          rateLimit: rateLimitInfo,
          headers,
        };
      }
    }
  } catch {
    // If rate limiting fails, do not block verification
  }

  const verification = await verifyInnerCircleKey(key);
  return { verification, rateLimit: rateLimitInfo, headers };
}

// Straight aliases for backward compatibility
export const getPrivacySafeStatsWithRateLimit = getPrivacySafeStats;
export const createOrUpdateMemberAndIssueKeyWithRateLimit = createOrUpdateMemberAndIssueKey;

/**
 * ✅ Privacy-safe export with rate limiting and admin gate
 */
export async function getPrivacySafeKeyExportWithRateLimit(
  req: NextApiRequest, 
  res: NextApiResponse
): Promise<void> {
  const okRL = await requireRateLimit(
    req, 
    res, 
    (RATE_LIMIT_CONFIGS as any)?.ADMIN_EXPORT ?? RATE_LIMIT_CONFIGS.API_GENERAL, 
    "ic-export"
  );
  if (!okRL) return;

  const okAdmin = await requireAdmin(req, res);
  if (!okAdmin) return;

  // Privacy safe by design - never leak raw keys
  const stats = await getPrivacySafeStats().catch(() => null);

  res.status(200).json({
    ok: true,
    data: {
      export: [],
      note: "Privacy-safe export - no raw keys are exposed",
      stats,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Enhanced health check
 */
export const healthCheckEnhanced = async () => ({
  status: "ok" as const,
  timestamp: new Date().toISOString(),
  store: process.env.INNER_CIRCLE_STORE || "memory",
  version: "1.0.0",
});

// --------------------
// Utility Functions
// --------------------

/**
 * Create a valid InnerCircleAccess response
 */
export function createInnerCircleAccess(
  hasAccess: boolean, 
  reason?: AccessCheckReason, 
  token?: string
): InnerCircleAccess {
  return {
    hasAccess,
    ok: hasAccess,
    reason,
    token,
    checkedAt: new Date(),
  };
}

/**
 * Check if access is valid
 */
export function isValidAccess(access: InnerCircleAccess | null): boolean {
  return access?.hasAccess === true && access?.reason === 'valid';
}

/**
 * Check if access should be renewed
 */
export function shouldRenewAccess(access: InnerCircleAccess | null): boolean {
  if (!access) return true;
  
  const checkAge = Date.now() - access.checkedAt.getTime();
  return checkAge > 5 * 60 * 1000; // 5 minutes
}

// --------------------
// Default export (backward compatibility)
// --------------------
const innerCircle = {
  // Core functions
  withInnerCircleAccess,
  getInnerCircleAccess,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  createOrUpdateMemberAndIssueKey,
  
  // Backward compatibility
  withInnerCircleRateLimit,
  getPrivacySafeStatsWithRateLimit,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  getPrivacySafeKeyExportWithRateLimit,
  
  // Utility functions
  createInnerCircleAccess,
  isValidAccess,
  shouldRenewAccess,
  
  // Health and config
  healthCheckEnhanced,
  INNER_CIRCLE_CONFIG,
};

export default innerCircle;
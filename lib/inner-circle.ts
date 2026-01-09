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
 * Back-compat: older handlers expected `{ data, headers }`.
 * We return privacy-safe stats only (no PII).
 *
 * NOTE:
 * - `req` is optional because App Router uses NextRequest (not NextApiRequest).
 * - We only use `createRateLimitHeaders()` if it exists + can be called safely.
 */
export async function getPrivacySafeKeyExportWithRateLimit(
  params: { page?: number; limit?: number } = {},
  adminId = "admin",
  req?: any
): Promise<{ data: any; headers: Record<string, string> }> {
  const stats = await getPrivacySafeStats();

  const data = {
    exportedAt: new Date().toISOString(),
    adminId,
    params: {
      page: Number(params.page || 1),
      limit: Number(params.limit || 50),
    },
    stats,
    metadata: {
      format: "JSON",
      version: "1.0",
      generatedBy: "Inner Circle Admin API",
    },
  };

  // Try to create rate-limit headers using your real helper, if possible.
  // Many implementations accept a result object; we safely fallback otherwise.
  let headers: Record<string, string> = {};
  try {
    // If you have a limiter result in req context, wire it in here.
    // Otherwise, emit nothing (better than lying).
    const maybe = createRateLimitHeaders?.(undefined as any);
    if (maybe && typeof maybe === "object") {
      headers = Object.fromEntries(
        Object.entries(maybe).map(([k, v]) => [k, String(v)])
      );
    }
  } catch {
    headers = {};
  }

  return { data, headers };
}

// Straight aliases (some older code may import these names)
export const getPrivacySafeStatsWithRateLimit = getPrivacySafeStats;
export const createOrUpdateMemberAndIssueKeyWithRateLimit =
  createOrUpdateMemberAndIssueKey;
export const verifyInnerCircleKeyWithRateLimit = verifyInnerCircleKey;

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
  getPrivacySafeKeyExportWithRateLimit,
  getPrivacySafeStatsWithRateLimit,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  healthCheckEnhanced,

  INNER_CIRCLE_CONFIG,
};

export default innerCircle;
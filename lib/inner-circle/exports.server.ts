// lib/inner-circle/exports.server.ts
import "server-only";

export type { InnerCircleAccess, AccessCheckOptions } from "./access.server";
export {
  getInnerCircleAccess,
  withInnerCircleAccess,
} from "./access.server";

// If you have these “contract” helpers in access.server.ts, export them here:
export {
  getClientIp,
  rateLimitForRequestIp,
  createPublicApiHandler,
  createStrictApiHandler,
  withInnerCircleRateLimit,
  getPrivacySafeStatsWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  getPrivacySafeKeyExportWithRateLimit,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
} from "./access.server";

// Keys – server-side operations
export {
  generateAccessKey,
  storeKey,
  getKey,
  revokeKey,
  renewKey,
  incrementKeyUsage,
  getKeysByMember,
  getKeysByTier,
  getActiveKeys,
  cleanupExpiredKeys,
  isExpired,
  getMemoryStoreSize,
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  recordInnerCircleUnlock,
  cleanupExpiredData,
  getEmailHash,
} from "./keys.server";
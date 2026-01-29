// lib/inner-circle/exports.server.ts
import "server-only";

export type { InnerCircleAccess, AccessCheckOptions } from "./access.server";

export {
  getInnerCircleAccess,
  normalizeTier,
} from "./access.server";

// Keys – server-side operations (these are in keys.server.ts)
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
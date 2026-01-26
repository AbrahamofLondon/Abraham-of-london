// lib/server/inner-circle/keys.ts
// Server-side barrel file that re-exports Inner Circle functions

export {
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  recordInnerCircleUnlock,
  cleanupExpiredData,
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
  getEmailHash,
  type KeyTier,
  type StoredKey,
  type CreateOrUpdateMemberArgs,
  type IssuedKey,
  type VerifyInnerCircleKeyResult,
  type InnerCircleStats,
  type CleanupResult
} from "@/lib/inner-circle";

// Default export for convenience
export { default } from "@/lib/inner-circle";
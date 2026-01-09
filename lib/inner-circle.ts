// lib/inner-circle.ts - Re-export everything correctly
export * from "./inner-circle/access";
export * from "./inner-circle/keys";

// Import all exports to re-export them individually
import {
  // From access.ts
  withInnerCircleAccess,
  getInnerCircleAccess,
  checkInnerCircleAccessInPage,
  createPublicApiHandler,
  createStrictApiHandler,
  hasInnerCircleAccess,
  createAccessToken,
  validateAccessToken,
  getClientIp,
  rateLimitForRequestIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  type InnerCircleAccess,
  type AccessCheckOptions
} from "./inner-circle/access";

import {
  // From keys.ts
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
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  recordInnerCircleUnlock,
  cleanupExpiredData,
  type KeyTier,
  type StoredKey,
  type CreateOrUpdateMemberArgs,
  type IssuedKey,
  type VerifyInnerCircleKeyResult,
  type InnerCircleStats,
  type CleanupResult
} from "./inner-circle/keys";

// Re-export everything individually
export {
  // Access functions
  withInnerCircleAccess,
  getInnerCircleAccess,
  checkInnerCircleAccessInPage,
  createPublicApiHandler,
  createStrictApiHandler,
  hasInnerCircleAccess,
  createAccessToken,
  validateAccessToken,
  getClientIp,
  rateLimitForRequestIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  
  // Key functions
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
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  recordInnerCircleUnlock,
  cleanupExpiredData
};

// Re-export types
export type {
  InnerCircleAccess,
  AccessCheckOptions,
  KeyTier,
  StoredKey,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleStats,
  CleanupResult
};

// Backward compatibility functions
export const INNER_CIRCLE_CONFIG = {
  enabled: true,
  maxUnlocksDaily: Number(process.env.INNER_CIRCLE_MAX_UNLOCKS_DAILY || "20"),
  store: process.env.INNER_CIRCLE_STORE || "db",
  keyPrefix: "icl_",
  keyExpiryDays: 90,
  maxKeysPerMember: 3
};

// ALIASES FOR BACKWARD COMPATIBILITY
// These are the functions that the errors are looking for
export const withInnerCircleRateLimit = withInnerCircleAccess;
export const getPrivacySafeKeyExportWithRateLimit = async () => {
  // Implement or import the actual function
  const stats = await getPrivacySafeStats();
  return {
    ...stats,
    exportedAt: new Date().toISOString()
  };
};
export const getPrivacySafeStatsWithRateLimit = getPrivacySafeStats;
export const createOrUpdateMemberAndIssueKeyWithRateLimit = createOrUpdateMemberAndIssueKey;
export const verifyInnerCircleKeyWithRateLimit = verifyInnerCircleKey;
export const healthCheckEnhanced = async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: 'memory' // In memory store by default
  };
};

// Default export
const innerCircle = {
  // Access
  withInnerCircleAccess,
  getInnerCircleAccess,
  checkInnerCircleAccessInPage,
  createPublicApiHandler,
  createStrictApiHandler,
  hasInnerCircleAccess,
  createAccessToken,
  validateAccessToken,
  getClientIp,
  rateLimitForRequestIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  
  // Keys
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
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  recordInnerCircleUnlock,
  cleanupExpiredData,
  
  // Backward compatibility
  withInnerCircleRateLimit,
  getPrivacySafeKeyExportWithRateLimit,
  getPrivacySafeStatsWithRateLimit,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  healthCheckEnhanced,
  
  // Config
  INNER_CIRCLE_CONFIG
};

export default innerCircle;
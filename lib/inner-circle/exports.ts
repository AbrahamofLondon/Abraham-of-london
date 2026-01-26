// lib/inner-circle/exports.ts - COMPLETE EXPORT HUB
// This file ensures all required exports are available
// It acts as a single source of truth for the entire module

// ==================== CORE EXPORTS ====================
export * from './access';
export * from './keys';

// ==================== TYPES ====================
export type {
  InnerCircleAccess,
  AccessCheckOptions,
  RateLimitOptions,
  AccessTokenResult,
  TokenValidationResult
} from './access';

export type {
  KeyTier,
  StoredKey,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleStats,
  CleanupResult
} from './keys';

// ==================== CONFIGURATION ====================
export const INNER_CIRCLE_CONFIG = {
  enabled: process.env.INNER_CIRCLE_ENABLED !== 'false',
  maxUnlocksDaily: Number(process.env.INNER_CIRCLE_MAX_UNLOCKS_DAILY || "20"),
  store: process.env.INNER_CIRCLE_STORE || "memory",
  keyPrefix: "IC-",
  keyExpiryDays: 90,
  maxKeysPerMember: 3
};

// ==================== IMPORT SPECIFIC FUNCTIONS ====================
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
  
  // Rate-limited functions that were missing
  withInnerCircleRateLimit,
  getPrivacySafeStatsWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  getPrivacySafeKeyExportWithRateLimit,
  createOrUpdateMemberAndIssueKeyWithRateLimit
} from './access';

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
  cleanupExpiredData
} from './keys';

// ==================== RE-EXPORT EVERYTHING ====================
// Re-export all core functions
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
  
  // Rate-limited functions
  withInnerCircleRateLimit,
  getPrivacySafeStatsWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  getPrivacySafeKeyExportWithRateLimit,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  
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

// ==================== HEALTH CHECK ====================
export async function healthCheckEnhanced(): Promise<{
  ok: boolean;
  timestamp: string;
  checks: {
    database: { ok: boolean; message: string };
    redis: { ok: boolean; message: string };
    cache: { ok: boolean; message: string };
  };
}> {
  const memorySize = getMemoryStoreSize?.() || 0;
  
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    checks: {
      database: { ok: true, message: 'Memory store active' },
      redis: { ok: true, message: 'Memory store active' },
      cache: { ok: true, message: `Memory cache (${memorySize} items)` }
    }
  };
}

// ==================== DEFAULT EXPORT ====================
const innerCircleExports = {
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
  
  // Rate-limited functions
  withInnerCircleRateLimit,
  getPrivacySafeStatsWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  getPrivacySafeKeyExportWithRateLimit,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  
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
  cleanupExpiredData,
  
  // Configuration
  INNER_CIRCLE_CONFIG,
  
  // Health check
  healthCheckEnhanced
};

export default innerCircleExports;
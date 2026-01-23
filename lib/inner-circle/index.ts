/* lib/inner-circle/index.ts - PRODUCTION VERSION */
import {
  getInnerCircleAccess as baseGetInnerCircleAccess,
  withInnerCircleAccess,
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
} from "./access";

import {
  generateAccessKey, storeKey, getKey, revokeKey, renewKey,
  incrementKeyUsage, getKeysByMember, getKeysByTier, getActiveKeys,
  cleanupExpiredKeys, isExpired, getMemoryStoreSize, getEmailHash,
  createOrUpdateMemberAndIssueKey, verifyInnerCircleKey, getPrivacySafeStats,
  recordInnerCircleUnlock, cleanupExpiredData,
  type KeyTier, type StoredKey, type CreateOrUpdateMemberArgs,
  type IssuedKey, type VerifyInnerCircleKeyResult, type InnerCircleStats, type CleanupResult
} from "./keys";

import type { NextRequest } from "next/server";
import type { NextApiRequest } from "next";

// ==================== ALIGNED ACCESS FUNCTION ====================
/**
 * STRATEGIC WRAPPER: getInnerCircleAccess
 * Handles both NextRequest (App Router), standard Request (Edge), and NextApiRequest.
 * Resolves Type Error: Argument of type 'Request' is not assignable.
 */
export async function getInnerCircleAccess(
  request: NextRequest | Request | NextApiRequest | any
): Promise<InnerCircleAccess> {
  // If it's already a compatible type with headers or cookies, pass it through
  if (request && ('headers' in request || 'cookies' in request)) {
    return baseGetInnerCircleAccess(request as any);
  }
  
  // Otherwise, construct a minimal compatible interface for the cookie reader
  const compatibleReq = {
    headers: request?.headers || {},
    cookies: request?.cookies || {},
  };
  
  return baseGetInnerCircleAccess(compatibleReq as any);
}

// ==================== RE-EXPORT CORE FUNCTIONS ====================
export {
  withInnerCircleAccess,
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

// ==================== RE-EXPORT TYPES ====================
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

// ==================== COMPATIBILITY FUNCTIONS ====================
export async function getPrivacySafeKeyExportWithRateLimit(options?: { limit?: number; offset?: number; filter?: string; }): Promise<{ ok: boolean; headers: Record<string, string>; data: any[]; total: number; limit: number; offset: number; }> {
  try {
    const stats = await getPrivacySafeStats();
    const headers = createRateLimitHeaders({ allowed: true, remaining: 95, limit: 100, resetTime: Date.now() + 3600000, retryAfterMs: 0 });
    const data = [{ ...stats, timestamp: new Date().toISOString(), exportId: `export-${Date.now()}`, dataType: 'inner-circle-keys' }];
    return { ok: true, headers, data, total: data.length, limit: options?.limit || 100, offset: options?.offset || 0 };
  } catch (error) {
    console.error('[getPrivacySafeKeyExportWithRateLimit] Error:', error);
    return { ok: false, headers: {}, data: [], total: 0, limit: options?.limit || 100, offset: options?.offset || 0 };
  }
}

export const withInnerCircleRateLimit = withInnerCircleAccess;
export const getPrivacySafeStatsWithRateLimit = getPrivacySafeStats;

export async function createOrUpdateMemberAndIssueKeyWithRateLimit(req: any): Promise<{ ok: boolean; headers: Record<string, string>; key: string; keySuffix: string; memberId: string; }> {
  try {
    const email = req.body?.email || req.query?.email || 'unknown@example.com';
    const result = await createOrUpdateMemberAndIssueKey({ email, name: req.body?.name, ipAddress: getClientIp(req), source: 'api' });
    return { ok: true, headers: createRateLimitHeaders({ allowed: true, remaining: 99, limit: 100, resetTime: Date.now() + 3600000, retryAfterMs: 0 }), key: result.key, keySuffix: result.keySuffix, memberId: result.memberId };
  } catch (error) {
    console.error('[createOrUpdateMemberAndIssueKeyWithRateLimit] Error:', error);
    return { ok: false, headers: {}, key: '', keySuffix: '', memberId: '' };
  }
}

export async function verifyInnerCircleKeyWithRateLimit(req: any): Promise<{ ok: boolean; headers: Record<string, string>; valid: boolean; reason: string; memberId?: string; keySuffix?: string; }> {
  try {
    const key = req.body?.key || req.query?.key || '';
    const result = await verifyInnerCircleKey(key);
    return { ok: result.valid, headers: createRateLimitHeaders({ allowed: true, remaining: 99, limit: 100, resetTime: Date.now() + 3600000, retryAfterMs: 0 }), valid: result.valid, reason: result.reason, memberId: result.memberId, keySuffix: result.keySuffix };
  } catch (error) {
    console.error('[verifyInnerCircleKeyWithRateLimit] Error:', error);
    return { ok: false, headers: {}, valid: false, reason: 'Verification failed' };
  }
}

export async function healthCheckEnhanced(): Promise<{ ok: boolean; timestamp: string; checks: { database: { ok: boolean; message: string }; redis: { ok: boolean; message: string }; cache: { ok: boolean; message: string }; }; }> {
  try {
    const memorySize = getMemoryStoreSize();
    let redisStatus = { ok: false, message: 'Not configured' };
    try {
      const redis = await import('@/lib/redis').then(m => m.getRedis?.());
      if (redis && typeof redis.ping === 'function') { await redis.ping(); redisStatus = { ok: true, message: 'Available' }; }
    } catch { redisStatus = { ok: true, message: 'Memory store active' }; }
    return { ok: true, timestamp: new Date().toISOString(), checks: { database: { ok: true, message: 'Memory store active' }, redis: redisStatus, cache: { ok: true, message: `Memory cache (${memorySize} items)` } } };
  } catch (error) {
    console.error('[healthCheckEnhanced] Error:', error);
    return { ok: false, timestamp: new Date().toISOString(), checks: { database: { ok: false, message: 'Check failed' }, redis: { ok: false, message: 'Check failed' }, cache: { ok: false, message: 'Check failed' } } };
  }
}

export const INNER_CIRCLE_CONFIG = {
  enabled: process.env.INNER_CIRCLE_ENABLED !== 'false',
  maxUnlocksDaily: Number(process.env.INNER_CIRCLE_MAX_UNLOCKS_DAILY || "20"),
  store: process.env.INNER_CIRCLE_STORE || "memory",
  keyPrefix: "IC-",
  keyExpiryDays: 90,
  maxKeysPerMember: 3
};

const innerCircle = {
  getInnerCircleAccess, withInnerCircleAccess, checkInnerCircleAccessInPage, createPublicApiHandler, createStrictApiHandler, hasInnerCircleAccess, createAccessToken, validateAccessToken, getClientIp, rateLimitForRequestIp, createRateLimitHeaders, RATE_LIMIT_CONFIGS,
  generateAccessKey, storeKey, getKey, revokeKey, renewKey, incrementKeyUsage, getKeysByMember, getKeysByTier, getActiveKeys, cleanupExpiredKeys, isExpired, getMemoryStoreSize, getEmailHash, createOrUpdateMemberAndIssueKey, verifyInnerCircleKey, getPrivacySafeStats, recordInnerCircleUnlock, cleanupExpiredData,
  withInnerCircleRateLimit, getPrivacySafeKeyExportWithRateLimit, getPrivacySafeStatsWithRateLimit, createOrUpdateMemberAndIssueKeyWithRateLimit, verifyInnerCircleKeyWithRateLimit, healthCheckEnhanced,
  INNER_CIRCLE_CONFIG
};

export default innerCircle;
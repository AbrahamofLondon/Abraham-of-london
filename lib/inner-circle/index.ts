/* eslint-disable no-console */
/**
 * Public Inner Circle module surface.
 * Updated with Redis rate limiting integration.
 *
 * Use in:
 * - pages/api/**
 * - server utilities
 *
 * Do NOT import this into client components.
 */

import innerCircleStore, {
  type InnerCircleStatus,
  type CreateOrUpdateMemberArgs,
  type IssuedKey,
  type VerifyInnerCircleKeyResult,
  type InnerCircleMember,
  type AdminExportRow,
  type CleanupResult,
  type PaginationParams,
  type PaginatedResult,
  type PrivacySafeKeyRow,
  type MemberKeyRow,
  type ActiveKeyRow,
} from "@/lib/server/inner-circle-store";

/* ============================================================================
   PUBLIC FUNCTION EXPORTS (DIRECT PASSTHROUGH)
   ============================================================================ */

export const createOrUpdateMemberAndIssueKey =
  innerCircleStore.createOrUpdateMemberAndIssueKey;

export const verifyInnerCircleKey = innerCircleStore.verifyInnerCircleKey;

export const getPrivacySafeStats = innerCircleStore.getPrivacySafeStats;

export const getPrivacySafeKeyRows = innerCircleStore.getPrivacySafeKeyRows;

export const getPrivacySafeKeyExport = innerCircleStore.getPrivacySafeKeyExport;

export const deleteMemberByEmail = innerCircleStore.deleteMemberByEmail;

export const cleanupExpiredData = innerCircleStore.cleanupExpiredData;

export const getClientIp = innerCircleStore.getClientIp;

export const getMemberByEmail = innerCircleStore.getMemberByEmail;

export const getMemberKeys = innerCircleStore.getMemberKeys;

export const getActiveKeysForMember = innerCircleStore.getActiveKeysForMember;

export const recordInnerCircleUnlock = innerCircleStore.recordInnerCircleUnlock;

export const revokeInnerCircleKey = innerCircleStore.revokeInnerCircleKey;

export const suspendKey = innerCircleStore.suspendKey;

export const renewKey = innerCircleStore.renewKey;

export const healthCheck = innerCircleStore.healthCheck;

/* ============================================================================
   RATE LIMITING FUNCTIONS FOR INNER CIRCLE
   ============================================================================ */

// Import rate limiting with Redis support - use dynamic imports to avoid circular deps
let rateLimitModule: any = null;
let getClientIpFromRequest: any = null;
let createRateLimitHeaders: any = null;
let RATE_LIMIT_CONFIGS: any = null;

// Dynamic import to avoid circular dependencies
async function getRateLimitModule() {
  if (rateLimitModule) return rateLimitModule;
  
  try {
    const module = await import("@/lib/server/rateLimit");
    rateLimitModule = module;
    getClientIpFromRequest = module.getClientIp || module.getClientIpFromRequest;
    createRateLimitHeaders = module.createRateLimitHeaders;
    RATE_LIMIT_CONFIGS = module.RATE_LIMIT_CONFIGS;
  } catch (error) {
    console.warn('[InnerCircle] Rate limit module not available:', error);
    // Create fallbacks
    RATE_LIMIT_CONFIGS = {
      INNER_CIRCLE_REGISTER_EMAIL: { limit: 3, windowMs: 3600000, keyPrefix: "ic-reg-email" },
      INNER_CIRCLE_UNLOCK: { limit: 30, windowMs: 600000, keyPrefix: "ic-unlock" },
      INNER_CIRCLE_ADMIN_EXPORT: { limit: 5, windowMs: 300000, keyPrefix: "ic-admin-export" },
    };
    
    getClientIpFromRequest = (req: any) => {
      if (req.headers?.['x-forwarded-for']) {
        const forwarded = req.headers['x-forwarded-for'];
        return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]?.trim();
      }
      return req.socket?.remoteAddress || 'unknown';
    };
    
    createRateLimitHeaders = (result: any) => ({
      'X-Rate-Limit-Remaining': result.remaining?.toString() || '0',
      'X-Rate-Limit-Limit': result.limit?.toString() || '0',
      'X-Rate-Limit-Reset': result.resetTime?.toString() || '0',
    });
    
    rateLimitModule = {
      rateLimit: async () => ({
        allowed: true,
        remaining: 999,
        limit: 1000,
        retryAfterMs: 0,
        resetTime: Date.now() + 60000,
      }),
    };
  }
  return rateLimitModule;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs: number;
  resetTime: number;
};

/**
 * Rate limit for Inner Circle registration attempts
 */
export async function rateLimitInnerCircleRegistration(
  email: string,
  ip: string
): Promise<RateLimitResult> {
  const module = await getRateLimitModule();
  const key = `inner_circle_reg:${ip}:${email.toLowerCase().trim()}`;
  return module.rateLimit(key, RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER_EMAIL || { limit: 3, windowMs: 3600000, keyPrefix: "ic-reg-email" });
}

/**
 * Rate limit for Inner Circle access attempts (by IP)
 */
export async function rateLimitInnerCircleAccess(
  ip: string
): Promise<RateLimitResult> {
  const module = await getRateLimitModule();
  const key = `inner_circle_access:${ip}`;
  return module.rateLimit(key, RATE_LIMIT_CONFIGS.INNER_CIRCLE_UNLOCK || { limit: 30, windowMs: 600000, keyPrefix: "ic-unlock" });
}

/**
 * Rate limit for Inner Circle admin operations
 */
export async function rateLimitInnerCircleAdmin(
  adminId: string,
  operation: string
): Promise<RateLimitResult> {
  const module = await getRateLimitModule();
  const key = `inner_circle_admin:${adminId}:${operation}`;
  return module.rateLimit(key, RATE_LIMIT_CONFIGS.INNER_CIRCLE_ADMIN_EXPORT || { limit: 5, windowMs: 300000, keyPrefix: "ic-admin-export" });
}

/**
 * Check multiple rate limits for Inner Circle operations
 */
export async function checkInnerCircleRateLimits(
  req: any,
  email?: string
): Promise<{
  ipResult: RateLimitResult;
  emailResult?: RateLimitResult;
  headers: Record<string, string>;
}> {
  await getRateLimitModule();
  const ip = getClientIpFromRequest(req);
  
  // Always check IP-based rate limiting
  const ipResult = await rateLimitInnerCircleAccess(ip);
  
  // Check email-based rate limiting if email provided
  let emailResult: RateLimitResult | undefined;
  if (email) {
    emailResult = await rateLimitInnerCircleRegistration(email, ip);
  }
  
  // Determine the worst result for headers
  const worstResult = !ipResult.allowed ? ipResult : 
                     (emailResult && !emailResult.allowed) ? emailResult : 
                     ipResult;
  
  const headers = createRateLimitHeaders(worstResult);
  
  return {
    ipResult,
    emailResult,
    headers
  };
}

/**
 * Middleware for Inner Circle API routes
 */
export function withInnerCircleRateLimit(
  options: {
    requireEmail?: boolean;
    adminOperation?: boolean;
    adminId?: string;
  } = {}
) {
  return async function handler(req: any, res: any, next?: any) {
    try {
      await getRateLimitModule();
      const ip = getClientIpFromRequest(req);
      let rateLimitResult: RateLimitResult;
      
      if (options.adminOperation && options.adminId) {
        // Admin operation rate limiting
        const operation = req.method + ':' + req.url;
        rateLimitResult = await rateLimitInnerCircleAdmin(options.adminId, operation);
      } else if (options.requireEmail) {
        // Registration/email-based rate limiting
        const body = await parseRequestJson(req);
        const email = body?.email;
        
        if (!email) {
          res.status(400).json({ error: 'Email is required' });
          return;
        }
        
        rateLimitResult = await rateLimitInnerCircleRegistration(email, ip);
      } else {
        // General access rate limiting
        rateLimitResult = await rateLimitInnerCircleAccess(ip);
      }
      
      // Add rate limit headers
      const headers = createRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      if (!rateLimitResult.allowed) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded for Inner Circle operation',
          retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000)
        });
        return;
      }
      
      if (next) {
        next();
      }
      
    } catch (error) {
      console.error('[InnerCircleRateLimit] Error:', error);
      // Fail open - don't block legitimate traffic
      if (next) {
        next();
      }
    }
  };
}

/* ============================================================================
   ENHANCED VERIFICATION WITH RATE LIMITING
   ============================================================================ */

/**
 * Enhanced verification with rate limiting and audit logging
 */
export async function verifyInnerCircleKeyWithRateLimit(
  key: string,
  req?: any
): Promise<{
  verification: VerifyInnerCircleKeyResult;
  rateLimit?: RateLimitResult;
  headers?: Record<string, string>;
}> {
  const verification = await innerCircleStore.verifyInnerCircleKey(key);
  
  // Apply rate limiting if request context provided
  if (req) {
    await getRateLimitModule();
    const ip = getClientIpFromRequest(req);
    const rateLimitResult = await rateLimitInnerCircleAccess(ip);
    const headers = createRateLimitHeaders(rateLimitResult);
    
    // If verification failed, still track the attempt
    if (!verification.valid) {
      console.warn(`[InnerCircle] Failed verification attempt from ${ip}`);
    }
    
    return {
      verification,
      rateLimit: rateLimitResult,
      headers
    };
  }
  
  return { verification };
}

/**
 * Enhanced member creation with rate limiting
 */
export async function createOrUpdateMemberAndIssueKeyWithRateLimit(
  args: CreateOrUpdateMemberArgs,
  req?: any
): Promise<{
  result: {
    member: InnerCircleMember;
    key: IssuedKey;
  };
  rateLimit?: RateLimitResult;
  headers?: Record<string, string>;
}> {
  // Apply rate limiting if request context provided
  if (req) {
    await getRateLimitModule();
    const ip = getClientIpFromRequest(req);
    const rateLimitResult = await rateLimitInnerCircleRegistration(args.email, ip);
    
    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded: Try again in ${Math.ceil(rateLimitResult.retryAfterMs / 1000)} seconds`);
    }
  }
  
  const result = await innerCircleStore.createOrUpdateMemberAndIssueKey(args);
  
  if (req) {
    await getRateLimitModule();
    const ip = getClientIpFromRequest(req);
    const rateLimitResult = await rateLimitInnerCircleRegistration(args.email, ip);
    const headers = createRateLimitHeaders(rateLimitResult);
    
    return {
      result,
      rateLimit: rateLimitResult,
      headers
    };
  }
  
  return { result };
}

/* ============================================================================
   BACKWARD COMPAT: NORMALIZED CLEANUP ALIAS
   ============================================================================ */

export type CleanupOldDataStats = {
  deletedMembers: number;
  deletedKeys: number;
  total: number;
  rateLimitInfo?: {
    storage: 'memory' | 'redis';
    redisAvailable: boolean;
  };
};

function normalizeCleanupStats(raw: unknown): CleanupOldDataStats {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

  const removed = n(obj.removed);
  const totalLegacy = n(obj.total);
  const deletedMembers = n(obj.deletedMembers);
  const deletedKeys = n(obj.deletedKeys);
  const totalNew = n(obj.total);

  if (deletedMembers > 0 || deletedKeys > 0) {
    const total = totalNew || deletedMembers + deletedKeys;
    return { deletedMembers, deletedKeys, total };
  }

  return {
    deletedMembers: removed,
    deletedKeys: 0,
    total: totalLegacy || removed,
  };
}

export async function cleanupOldData(): Promise<CleanupOldDataStats> {
  const raw = await innerCircleStore.cleanupExpiredData();
  const stats = normalizeCleanupStats(raw);
  
  // Add rate limiting storage info
  try {
    const { getRateLimiterStats } = await import('@/lib/rate-limit');
    const rateLimitStats = await getRateLimiterStats();
    stats.rateLimitInfo = {
      storage: rateLimitStats.isRedisAvailable ? 'redis' : 'memory',
      redisAvailable: rateLimitStats.isRedisAvailable,
    };
  } catch (error) {
    stats.rateLimitInfo = {
      storage: 'memory',
      redisAvailable: false,
    };
  }
  
  return stats;
}

/* ============================================================================
   ENHANCED ADMIN FUNCTIONS WITH RATE LIMITING
   ============================================================================ */

/**
 * Enhanced admin export with rate limiting
 */
export async function getPrivacySafeKeyExportWithRateLimit(
  params: PaginationParams,
  adminId: string,
  req?: any
): Promise<{
  data: PaginatedResult<PrivacySafeKeyRow>;
  rateLimit?: RateLimitResult;
  headers?: Record<string, string>;
}> {
  // Apply admin rate limiting if request context provided
  if (req) {
    await getRateLimitModule();
    const rateLimitResult = await rateLimitInnerCircleAdmin(adminId, 'export');
    
    if (!rateLimitResult.allowed) {
      throw new Error('Admin export rate limit exceeded');
    }
  }
  
  const data = await innerCircleStore.getPrivacySafeKeyExport(params);
  
  if (req) {
    await getRateLimitModule();
    const rateLimitResult = await rateLimitInnerCircleAdmin(adminId, 'export');
    const headers = createRateLimitHeaders(rateLimitResult);
    
    return {
      data,
      rateLimit: rateLimitResult,
      headers
    };
  }
  
  return { data };
}

/**
 * Enhanced stats with rate limiting
 */
export async function getPrivacySafeStatsWithRateLimit(
  adminId: string,
  req?: any
): Promise<{
  stats: InnerCircleStatus;
  rateLimit?: RateLimitResult;
  headers?: Record<string, string>;
}> {
  // Apply admin rate limiting if request context provided
  if (req) {
    await getRateLimitModule();
    const rateLimitResult = await rateLimitInnerCircleAdmin(adminId, 'stats');
    
    if (!rateLimitResult.allowed) {
      throw new Error('Admin stats rate limit exceeded');
    }
  }
  
  const stats = await innerCircleStore.getPrivacySafeStats();
  
  if (req) {
    await getRateLimitModule();
    const rateLimitResult = await rateLimitInnerCircleAdmin(adminId, 'stats');
    const headers = createRateLimitHeaders(rateLimitResult);
    
    return {
      stats,
      rateLimit: rateLimitResult,
      headers
    };
  }
  
  return { stats };
}

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

async function parseRequestJson(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  
  if (req.body && typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }
  
  // For Next.js API routes
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      return await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk: any) => data += chunk);
        req.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      return {};
    }
  }
  
  return {};
}

/* ============================================================================
   TYPES RE-EXPORT
   ============================================================================ */

export type {
  InnerCircleStatus,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleMember,
  AdminExportRow,
  CleanupResult,
  PaginationParams,
  PaginatedResult,
  PrivacySafeKeyRow,
  MemberKeyRow,
  ActiveKeyRow,
};

/* ============================================================================
   EMAIL EXPORT (Lazy Load with Enhanced Error Handling)
   ============================================================================ */

let sendEmailFn: any = async () => ({ 
  success: false, 
  error: "Email module not loaded",
  fallback: true 
});

let emailModuleAvailable = false;

try {
  // Using dynamic import for better error handling
  const emailModule = await import("@/lib/inner-circle/email");
  if (emailModule.sendInnerCircleEmail) {
    sendEmailFn = emailModule.sendInnerCircleEmail;
    emailModuleAvailable = true;
    console.log('[InnerCircle] Email module loaded successfully');
  }
} catch (e) {
  console.warn('[InnerCircle] Email module not available, using fallback:', e);
}

export const sendInnerCircleEmail = sendEmailFn;
export { emailModuleAvailable };

/* ============================================================================
   CONFIGURATION & ENVIRONMENT
   ============================================================================ */

export const INNER_CIRCLE_CONFIG = {
  rateLimiting: {
    enabled: true,
    storage: process.env.REDIS_URL ? 'redis' : 'memory' as 'redis' | 'memory',
    configs: {
      register: RATE_LIMIT_CONFIGS?.INNER_CIRCLE_REGISTER || { limit: 20, windowMs: 900000, keyPrefix: "ic-reg" },
      registerEmail: RATE_LIMIT_CONFIGS?.INNER_CIRCLE_REGISTER_EMAIL || { limit: 3, windowMs: 3600000, keyPrefix: "ic-reg-email" },
      unlock: RATE_LIMIT_CONFIGS?.INNER_CIRCLE_UNLOCK || { limit: 30, windowMs: 600000, keyPrefix: "ic-unlock" },
      admin: RATE_LIMIT_CONFIGS?.INNER_CIRCLE_ADMIN_EXPORT || { limit: 5, windowMs: 300000, keyPrefix: "ic-admin-export" },
    }
  },
  environment: process.env.NODE_ENV,
  redisAvailable: !!process.env.REDIS_URL,
  emailAvailable: emailModuleAvailable,
};

/* ============================================================================
   DEFAULT EXPORT WITH ENHANCED FUNCTIONALITY
   ============================================================================ */

const enhancedInnerCircleStore = {
  // Original store functions
  ...innerCircleStore,
  
  // Enhanced functions with rate limiting
  verifyInnerCircleKeyWithRateLimit,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  getPrivacySafeKeyExportWithRateLimit,
  getPrivacySafeStatsWithRateLimit,
  
  // Rate limiting functions
  rateLimitInnerCircleRegistration,
  rateLimitInnerCircleAccess,
  rateLimitInnerCircleAdmin,
  checkInnerCircleRateLimits,
  withInnerCircleRateLimit,
  
  // Configuration
  config: INNER_CIRCLE_CONFIG,
  
  // Cleanup with enhanced stats
  cleanupOldData,
  
  // Rate limiting headers utility
  createRateLimitHeaders: (result: any) => {
    return {
      'X-Rate-Limit-Remaining': result.remaining?.toString() || '0',
      'X-Rate-Limit-Limit': result.limit?.toString() || '0',
      'X-Rate-Limit-Reset': result.resetTime?.toString() || '0',
    };
  },
  
  // Get rate limit configs
  getRateLimitConfigs: () => RATE_LIMIT_CONFIGS,
  
  // Health check with rate limiting info
  healthCheckEnhanced: async () => {
    const basicHealth = await innerCircleStore.healthCheck();
    
    try {
      const { getRateLimiterStats } = await import('@/lib/rate-limit');
      const rateLimitStats = await getRateLimiterStats();
      
      return {
        ...basicHealth,
        rateLimiting: {
          enabled: INNER_CIRCLE_CONFIG.rateLimiting.enabled,
          storage: INNER_CIRCLE_CONFIG.rateLimiting.storage,
          stats: rateLimitStats,
        },
        environment: INNER_CIRCLE_CONFIG.environment,
      };
    } catch (error) {
      return {
        ...basicHealth,
        rateLimiting: {
          enabled: INNER_CIRCLE_CONFIG.rateLimiting.enabled,
          storage: INNER_CIRCLE_CONFIG.rateLimiting.storage,
          stats: { error: 'Rate limit stats unavailable' },
        },
        environment: INNER_CIRCLE_CONFIG.environment,
      };
    }
  }
};

export default enhancedInnerCircleStore;

// ============================================================================
// EXPORT EVERYTHING NEEDED
// ============================================================================

export { 
  withInnerCircleRateLimit,
  getPrivacySafeKeyExportWithRateLimit,
  getPrivacySafeStatsWithRateLimit,
  createRateLimitHeaders: enhancedInnerCircleStore.createRateLimitHeaders,
  INNER_CIRCLE_CONFIG,
  healthCheckEnhanced: enhancedInnerCircleStore.healthCheckEnhanced,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  // Export all the functions that were missing
  sendInnerCircleEmail,
  emailModuleAvailable,
  cleanupOldData,
  rateLimitInnerCircleRegistration,
  rateLimitInnerCircleAccess,
  rateLimitInnerCircleAdmin,
  checkInnerCircleRateLimits,
  getRateLimitConfigs: enhancedInnerCircleStore.getRateLimitConfigs,
  // Export the base store functions
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  getPrivacySafeKeyRows,
  getPrivacySafeKeyExport,
  deleteMemberByEmail,
  cleanupExpiredData,
  getClientIp,
  getMemberByEmail,
  getMemberKeys,
  getActiveKeysForMember,
  recordInnerCircleUnlock,
  revokeInnerCircleKey,
  suspendKey,
  renewKey,
  healthCheck,
  // Type exports
  type RateLimitResult,
  type CleanupOldDataStats,
};

// Export all types
export type {
  InnerCircleStatus,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleMember,
  AdminExportRow,
  CleanupResult,
  PaginationParams,
  PaginatedResult,
  PrivacySafeKeyRow,
  MemberKeyRow,
  ActiveKeyRow,
};
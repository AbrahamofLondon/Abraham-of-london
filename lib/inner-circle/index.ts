// lib/inner-circle/index.ts
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

// Import rate limiting with Redis support
import { 
  rateLimit,
  getClientIp as getClientIpFromRequest,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  type RateLimitResult 
} from "@/lib/rate-limit";

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

/**
 * Rate limit for Inner Circle registration attempts
 */
export async function rateLimitInnerCircleRegistration(
  email: string,
  ip: string
): Promise<RateLimitResult> {
  const key = `inner_circle_reg:${ip}:${email.toLowerCase().trim()}`;
  return rateLimit(key, RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER_EMAIL);
}

/**
 * Rate limit for Inner Circle access attempts (by IP)
 */
export async function rateLimitInnerCircleAccess(
  ip: string
): Promise<RateLimitResult> {
  const key = `inner_circle_access:${ip}`;
  return rateLimit(key, RATE_LIMIT_CONFIGS.INNER_CIRCLE_UNLOCK);
}

/**
 * Rate limit for Inner Circle admin operations
 */
export async function rateLimitInnerCircleAdmin(
  adminId: string,
  operation: string
): Promise<RateLimitResult> {
  const key = `inner_circle_admin:${adminId}:${operation}`;
  return rateLimit(key, RATE_LIMIT_CONFIGS.INNER_CIRCLE_ADMIN_EXPORT);
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
          retryAfter: rateLimitResult.blockUntil 
            ? Math.ceil((rateLimitResult.blockUntil - Date.now()) / 1000) 
            : undefined
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
    const ip = getClientIpFromRequest(req);
    const rateLimitResult = await rateLimitInnerCircleRegistration(args.email, ip);
    
    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded: ${rateLimitResult.blockUntil ? 'Try again later' : 'Too many attempts'}`);
    }
  }
  
  const result = await innerCircleStore.createOrUpdateMemberAndIssueKey(args);
  
  if (req) {
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
    const { getRateLimitStorageInfo } = await import('@/lib/server/rate-limit-unified');
    const storageInfo = await getRateLimitStorageInfo(RATE_LIMIT_CONFIGS.INNER_CIRCLE_ADMIN_EXPORT);
    stats.rateLimitInfo = {
      storage: storageInfo.storage,
      redisAvailable: storageInfo.redisAvailable,
    };
  } catch (error) {
    // Ignore if rate limit module not available
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
    const rateLimitResult = await rateLimitInnerCircleAdmin(adminId, 'export');
    
    if (!rateLimitResult.allowed) {
      throw new Error('Admin export rate limit exceeded');
    }
  }
  
  const data = await innerCircleStore.getPrivacySafeKeyExport(params);
  
  if (req) {
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
    const rateLimitResult = await rateLimitInnerCircleAdmin(adminId, 'stats');
    
    if (!rateLimitResult.allowed) {
      throw new Error('Admin stats rate limit exceeded');
    }
  }
  
  const stats = await innerCircleStore.getPrivacySafeStats();
  
  if (req) {
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

// Re-export RateLimitResult from our unified rate limit system
export { RateLimitResult };

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
      register: RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER,
      registerEmail: RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER_EMAIL,
      unlock: RATE_LIMIT_CONFIGS.INNER_CIRCLE_UNLOCK,
      admin: RATE_LIMIT_CONFIGS.INNER_CIRCLE_ADMIN_EXPORT,
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
  createRateLimitHeaders,
  
  // Get rate limit configs
  getRateLimitConfigs: () => RATE_LIMIT_CONFIGS,
  
  // Health check with rate limiting info
  healthCheckEnhanced: async () => {
    const basicHealth = await innerCircleStore.healthCheck();
    const rateLimitStats = await (async () => {
      try {
        const { getRateLimiterStats } = await import('@/lib/rate-limit');
        return await getRateLimiterStats();
      } catch (error) {
        return { error: 'Rate limit stats unavailable' };
      }
    })();
    
    return {
      ...basicHealth,
      rateLimiting: {
        enabled: INNER_CIRCLE_CONFIG.rateLimiting.enabled,
        storage: INNER_CIRCLE_CONFIG.rateLimiting.storage,
        stats: rateLimitStats,
      },
      environment: INNER_CIRCLE_CONFIG.environment,
    };
  }
};

export default enhancedInnerCircleStore;
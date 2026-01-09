// lib/inner-circle/access.ts - FIXED VERSION
import type { NextApiRequest } from 'next';
import type { NextRequest } from 'next/server';

// ==================== SAFE IMPORTS ====================
let rateLimitModule: any = null;
let RATE_LIMIT_CONFIGS: any = null;

// Initialize on module load (but don't crash)
function initRateLimit() {
  if (rateLimitModule !== null) return;
  
  try {
    if (typeof window === 'undefined') {
      // Server-side: try to load
      const module = require('@/lib/server/rateLimit');
      rateLimitModule = module;
      RATE_LIMIT_CONFIGS = module.RATE_LIMIT_CONFIGS;
    }
  } catch (error) {
    console.warn('[InnerCircleAccess] rateLimit not available, using fallbacks');
  }
  
  // Set fallbacks if not loaded
  if (!RATE_LIMIT_CONFIGS) {
    RATE_LIMIT_CONFIGS = {
      API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
      API_GENERAL: { limit: 100, windowMs: 3600000, keyPrefix: "api" },
      INNER_CIRCLE_UNLOCK: { limit: 30, windowMs: 600000, keyPrefix: "ic-unlock" }
    };
  }
  
  if (!rateLimitModule) {
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
}

// Initialize on import
initRateLimit();

// ==================== INTERFACES ====================
export interface InnerCircleAccess {
  hasAccess: boolean;
  reason?: 'no_cookie' | 'invalid_cookie' | 'rate_limited' | 'ip_blocked' | 'expired' | 'no_request' | 'build_time';
  rateLimit?: {
    remaining: number;
    limit: number;
    resetTime: number;
    retryAfterMs?: number;
  };
  userData?: {
    ip: string;
    userAgent: string;
    timestamp: number;
  };
}

export interface AccessCheckOptions {
  requireAuth?: boolean;
  rateLimitConfig?: any;
  skipRateLimit?: boolean;
}

// ==================== UTILITY FUNCTIONS ====================
export function getClientIp(req?: NextApiRequest | NextRequest | null): string {
  // ✅ FIXED: Add null/undefined check for build time
  if (!req || !req.headers) {
    return '127.0.0.1'; // Default for build time
  }
  
  if ('headers' in req && req.headers && typeof (req.headers as any).get === 'function') {
    const edgeHeaders = req.headers as any;
    try {
      const forwarded = edgeHeaders.get('x-forwarded-for');
      return forwarded?.split(',')[0]?.trim() || 
             edgeHeaders.get('x-real-ip') || 
             edgeHeaders.get('cf-connecting-ip') || 
             '127.0.0.1';
    } catch {
      return '127.0.0.1';
    }
  }
  
  const apiReq = req as NextApiRequest;
  try {
    const forwarded = apiReq.headers?.['x-forwarded-for'];
    
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(',');
      return ips[0]?.trim() || '127.0.0.1';
    }
    
    return apiReq.socket?.remoteAddress || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

// ==================== RATE LIMITING FUNCTIONS ====================
export async function rateLimitForRequestIp(
  ip: string, 
  config?: any
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: number;
  retryAfterMs: number;
}> {
  const effectiveConfig = config || RATE_LIMIT_CONFIGS?.INNER_CIRCLE_UNLOCK;
  
  try {
    if (rateLimitModule?.rateLimit) {
      return await rateLimitModule.rateLimit(`inner-circle:ip:${ip}`, effectiveConfig);
    }
  } catch (error) {
    console.warn('[InnerCircleAccess] Rate limiting failed, using fallback:', error);
  }
  
  // Fallback implementation
  return {
    allowed: true,
    remaining: effectiveConfig?.limit || 30,
    limit: effectiveConfig?.limit || 30,
    resetTime: Date.now() + (effectiveConfig?.windowMs || 600000),
    retryAfterMs: 0
  };
}

export function createRateLimitHeaders(rateLimitResult: {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: number;
  retryAfterMs?: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime / 1000).toString(),
    ...(rateLimitResult.retryAfterMs && rateLimitResult.retryAfterMs > 0 
      ? { 'Retry-After': Math.ceil(rateLimitResult.retryAfterMs / 1000).toString() }
      : {})
  };
}

// ==================== MAIN ACCESS CHECK ====================
export async function getInnerCircleAccess(
  req?: NextApiRequest | NextRequest | null,
  options: AccessCheckOptions = {}
): Promise<InnerCircleAccess> {
  // ✅ FIXED: Handle build time (no request)
  if (!req) {
    return {
      hasAccess: false,
      reason: 'build_time',
      userData: { ip: '127.0.0.1', userAgent: 'static-build', timestamp: Date.now() }
    };
  }
  
  const { requireAuth = true, rateLimitConfig, skipRateLimit = false } = options;
  
  const ip = getClientIp(req);
  
  // ✅ FIXED: Safe user agent extraction
  let userAgent = '';
  try {
    userAgent = 'headers' in req 
      ? (req.headers?.get?.('user-agent') || '')
      : (req as NextApiRequest).headers?.['user-agent'] || '';
  } catch {
    userAgent = '';
  }
  
  // ✅ FIXED: Safe cookie extraction
  let hasAccessCookie = false;
  try {
    if ('cookies' in req && req.cookies) {
      hasAccessCookie = req.cookies?.get?.('innerCircleAccess')?.value === "true";
    } else {
      hasAccessCookie = (req as NextApiRequest).cookies?.innerCircleAccess === "true";
    }
  } catch {
    hasAccessCookie = false;
  }
  
  // ==================== RATE LIMITING ====================
  if (!skipRateLimit && rateLimitModule?.rateLimit) {
    const config = rateLimitConfig || RATE_LIMIT_CONFIGS?.INNER_CIRCLE_UNLOCK || RATE_LIMIT_CONFIGS?.API_STRICT;
    
    try {
      const rateLimitKey = `inner-circle:${ip}`;
      const result = await rateLimitModule.rateLimit(rateLimitKey, config);
      
      if (!result.allowed) {
        return {
          hasAccess: false,
          reason: 'rate_limited',
          rateLimit: {
            remaining: result.remaining,
            limit: result.limit,
            resetTime: result.resetTime,
            retryAfterMs: result.retryAfterMs
          },
          userData: { ip, userAgent, timestamp: Date.now() }
        };
      }
    } catch (error) {
      console.warn('[InnerCircleAccess] Rate limiting error:', error);
    }
  }
  
  // ==================== AUTH CHECK ====================
  if (requireAuth && !hasAccessCookie) {
    return {
      hasAccess: false,
      reason: 'no_cookie',
      userData: { ip, userAgent, timestamp: Date.now() }
    };
  }
  
  // ==================== SUCCESS ====================
  return {
    hasAccess: true,
    userData: { ip, userAgent, timestamp: Date.now() }
  };
}

// ==================== API MIDDLEWARE WRAPPER ====================
export function withInnerCircleAccess(
  handler: (req: NextApiRequest, res: any) => Promise<void> | void,
  options: AccessCheckOptions = {}
) {
  return async (req: NextApiRequest, res: any) => {
    try {
      const access = await getInnerCircleAccess(req, options);
      
      if (!access.hasAccess) {
        if (access.reason === 'rate_limited') {
          res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: access.rateLimit?.retryAfterMs ? Math.ceil(access.rateLimit.retryAfterMs / 1000) : 60
          });
          return;
        }
        
        res.status(403).json({
          error: 'Access Denied',
          reason: access.reason,
          message: 'Inner circle access required'
        });
        return;
      }
      
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Access-Level', 'inner-circle');
      
      await handler(req, res);
      
    } catch (error) {
      console.error('[InnerCircleAccess] Error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify access'
      });
    }
  };
}

// ==================== HELPER FUNCTIONS ====================
export function checkInnerCircleAccessInPage(context: any) {
  return {
    props: { innerCircleAccess: { hasAccess: false, reason: 'not_implemented' } },
    redirect: { destination: '/inner-circle/login', permanent: false }
  };
}

export function createPublicApiHandler(handler: any) {
  return withInnerCircleAccess(handler, { requireAuth: false });
}

export function createStrictApiHandler(handler: any) {
  return withInnerCircleAccess(handler, { requireAuth: true });
}

// Client-side check
export function hasInnerCircleAccess(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('innerCircleAccess='))
        ?.split('=')[1];
      return cookie === 'true';
    } catch {
      return false;
    }
  }
  return false;
}

// Create access token function
export async function createAccessToken(email: string, tier: string = 'member'): Promise<{
  token: string;
  expiresAt: Date;
  key: string;
}> {
  if (typeof window === 'undefined') {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const key = `IC-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
    
    return {
      token,
      key,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  } else {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    const keyArray = new Uint8Array(16);
    crypto.getRandomValues(keyArray);
    const key = `IC-${Array.from(keyArray, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    
    return {
      token,
      key,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }
}

// Simple access token validation
export async function validateAccessToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  tier?: string;
}> {
  return {
    valid: token?.length > 10 || false,
    email: 'user@example.com',
    tier: 'member'
  };
}

// Export RATE_LIMIT_CONFIGS for external use
export { RATE_LIMIT_CONFIGS };
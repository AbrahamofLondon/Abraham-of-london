// lib/inner-circle/access.ts - updated with fallbacks
import type { NextApiRequest } from 'next';
import type { NextRequest } from 'next/server';

// ==================== SAFE IMPORTS ====================
let rateLimitModule: any = null;
let RATE_LIMIT_CONFIGS: any = null;

try {
  const module = require('@/lib/server/rate-limit-unified');
  rateLimitModule = module;
  RATE_LIMIT_CONFIGS = module.RATE_LIMIT_CONFIGS;
} catch (error) {
  console.warn('[InnerCircleAccess] rate-limit-unified not available, using fallbacks');
  RATE_LIMIT_CONFIGS = {
    API_STRICT: { limit: 30, windowMs: 60000 },
    API_GENERAL: { limit: 100, windowMs: 60000 },
    INNER_CIRCLE: { limit: 30, windowMs: 60000 }
  };
}

// ==================== INTERFACES ====================
export interface InnerCircleAccess {
  hasAccess: boolean;
  reason?: 'no_cookie' | 'invalid_cookie' | 'rate_limited' | 'ip_blocked' | 'expired';
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
function getClientIp(req: NextApiRequest | NextRequest): string {
  if ('headers' in req && req.headers && typeof (req.headers as any).get === 'function') {
    const edgeHeaders = req.headers as any;
    return edgeHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  }
  
  const apiReq = req as NextApiRequest;
  const forwarded = apiReq.headers['x-forwarded-for'];
  
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(',');
    return ips[0]?.trim() || 'unknown';
  }
  
  return apiReq.socket?.remoteAddress || 'unknown';
}

// ==================== MAIN ACCESS CHECK ====================
export async function getInnerCircleAccess(
  req: NextApiRequest | NextRequest,
  options: AccessCheckOptions = {}
): Promise<InnerCircleAccess> {
  const { requireAuth = true, rateLimitConfig, skipRateLimit = false } = options;
  
  const ip = getClientIp(req);
  const userAgent = 'headers' in req 
    ? (req.headers.get('user-agent') || '')
    : (req as NextApiRequest).headers['user-agent'] || '';
  
  const hasAccessCookie = 'cookies' in req
    ? req.cookies?.get('innerCircleAccess')?.value === "true"
    : (req as NextApiRequest).cookies?.innerCircleAccess === "true";
  
  // ==================== RATE LIMITING ====================
  if (!skipRateLimit) {
    const config = rateLimitConfig || RATE_LIMIT_CONFIGS?.INNER_CIRCLE || RATE_LIMIT_CONFIGS?.API_STRICT;
    
    // Simple rate limiting check
    const rateLimitKey = `inner-circle:${ip}`;
    const now = Date.now();
    
    // Check if rate limit module is available
    if (rateLimitModule?.withEdgeRateLimit && 'nextUrl' in req) {
      try {
        const { allowed, result } = await rateLimitModule.withEdgeRateLimit(
          req as NextRequest,
          config
        );
        
        if (!allowed) {
          return {
            hasAccess: false,
            reason: 'rate_limited',
            rateLimit: {
              remaining: result?.remaining || 0,
              limit: result?.limit || config.limit,
              resetTime: result?.resetTime || (now + config.windowMs),
              retryAfterMs: result?.retryAfterMs
            },
            userData: { ip, userAgent, timestamp: now }
          };
        }
      } catch (error) {
        // Rate limiting failed, continue without it
        console.warn('[InnerCircleAccess] Rate limiting error:', error);
      }
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
            retryAfter: access.rateLimit?.retryAfterMs
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
      
      // Call handler
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

// ==================== EXPORT HELPER FUNCTIONS ====================
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
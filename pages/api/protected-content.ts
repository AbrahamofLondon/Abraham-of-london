import { NextApiRequest, NextApiResponse } from 'next';
import type { NextRequest } from 'next/server';

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

/* -------------------------------------------------------------------------- */
/* 1. ACCESS CONTROL INTERFACES & TYPES                                      */
/* -------------------------------------------------------------------------- */

interface InnerCircleAccess {
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

interface AccessCheckOptions {
  requireAuth?: boolean;
  rateLimitConfig?: {
    windowMs: number;
    limit: number;
    keyPrefix: string;
  };
  skipRateLimit?: boolean;
}

/* -------------------------------------------------------------------------- */
/* 2. UNIFIED ACCESS CHECK FUNCTION                                          */
/* -------------------------------------------------------------------------- */

export async function getInnerCircleAccess(
  req: NextApiRequest | NextRequest,
  options: AccessCheckOptions = {}
): Promise<InnerCircleAccess> {
  const { requireAuth = true, rateLimitConfig, skipRateLimit = false } = options;
  
  // Get client IP
  let ip: string;
  if ('nextUrl' in req) {
    // NextRequest (from middleware)
    try {
      const rateLimitModule = await import('@/lib/server/rate-limit-unified');
      ip = rateLimitModule.default.getClientIp(req);
    } catch {
      // Fallback IP extraction for NextRequest
      ip = req.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || 
           req.headers?.get('x-real-ip') || 
           'unknown';
    }
  } else {
    // NextApiRequest (from API route)
    const forwarded = req.headers['x-forwarded-for'];
    ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded || '');
    ip = ip.split(',')[0]?.trim() || 
         (req.headers['x-real-ip'] as string) || 
         req.socket?.remoteAddress || 
         'unknown';
  }
  
  const userAgent = 'headers' in req 
    ? (req as NextApiRequest).headers['user-agent'] || '' 
    : req.headers?.get('user-agent') || '';
  
  const hasAccessCookie = 'cookies' in req 
    ? req.cookies?.[INNER_CIRCLE_COOKIE_NAME] === "true"
    : false;
  
  // ==================== RATE LIMITING ====================
  if (!skipRateLimit) {
    try {
      // Get rate limit config
      const rateLimitModule = await import('@/lib/server/rate-limit-unified');
      const RATE_LIMIT_CONFIGS = rateLimitModule.default.RATE_LIMIT_CONFIGS;
      const config = rateLimitConfig || RATE_LIMIT_CONFIGS.API_STRICT;
      
      let rateLimitResult: any;
      
      // Try Redis-based rate limiting first
      try {
        const redisModule = await import('@/lib/rate-limit-redis');
        // Use redisRateLimit export
        const redisRateLimiter = await redisModule.redisRateLimit({
          windowMs: config.windowMs,
          max: config.limit,
          keyPrefix: config.keyPrefix,
        });
        
        // Create request-like object for rate limiter
        const reqForCheck = {
          url: 'url' in req ? req.url : '/api/protected-content',
          headers: {
            'x-forwarded-for': ip,
            'user-agent': userAgent
          }
        };
        
        rateLimitResult = await redisRateLimiter.check(reqForCheck);
      } catch (redisError) {
        console.warn('Redis rate limiting failed, falling back:', redisError);
        
        // Fallback to unified rate limiting
        try {
          // Create a minimal request object for unified rate limit
          const reqForCheck = {
            nextUrl: new URL('url' in req ? req.url || '/' : '/', 'http://localhost'),
            headers: new Headers({ 
              'x-forwarded-for': ip,
              'user-agent': userAgent
            }),
            url: 'url' in req ? req.url : '/api/protected-content'
          };
          
          // Use withEdgeRateLimit for checking
          const rateLimitModule = await import('@/lib/server/rate-limit-unified');
          const withEdgeRateLimit = rateLimitModule.default.withEdgeRateLimit;
          
          // Create a mock handler to intercept rate limit check
          let capturedResult: any = null;
          const mockHandler = (req: any, res: any) => {
            capturedResult = res.locals?.rateLimit || { allowed: true, remaining: config.limit - 1 };
          };
          
          const wrappedHandler = withEdgeRateLimit(mockHandler, config);
          await wrappedHandler(reqForCheck as any, {
            locals: {},
            setHeader: () => {},
            status: () => ({ json: () => {} })
          } as any);
          
          rateLimitResult = capturedResult || {
            allowed: true,
            remaining: config.limit - 1,
            limit: config.limit,
            resetTime: Date.now() + config.windowMs,
            retryAfterMs: 0
          };
        } catch (unifiedError) {
          console.warn('Unified rate limiting also failed:', unifiedError);
          // Last resort fallback
          rateLimitResult = {
            allowed: true,
            remaining: config.limit - 1,
            limit: config.limit,
            resetTime: Date.now() + config.windowMs,
            retryAfterMs: 0
          };
        }
      }
      
      if (rateLimitResult && rateLimitResult.remaining === 0) {
        return {
          hasAccess: false,
          reason: 'rate_limited',
          rateLimit: {
            remaining: 0,
            limit: rateLimitResult.limit || config.limit,
            resetTime: rateLimitResult.resetTime || Date.now() + config.windowMs,
            retryAfterMs: rateLimitResult.retryAfterMs
          },
          userData: { ip, userAgent, timestamp: Date.now() }
        };
      }
    } catch (rateLimitError) {
      console.warn('Rate limiting check failed, allowing request:', rateLimitError);
      // If rate limiting fails, allow the request
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

/* -------------------------------------------------------------------------- */
/* 3. MIDDLEWARE WRAPPER FOR API ROUTES                                       */
/* -------------------------------------------------------------------------- */

export function withInnerCircleAccess(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: AccessCheckOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const access = await getInnerCircleAccess(req, options);
      
      // Add access info to request object for handler use
      (req as any).innerCircleAccess = access;
      
      if (!access.hasAccess) {
        // Set rate limit headers if available
        if (access.rateLimit) {
          try {
            const rateLimitModule = await import('@/lib/server/rate-limit-unified');
            const headers = rateLimitModule.default.createRateLimitHeaders(access.rateLimit);
            Object.entries(headers).forEach(([key, value]) => {
              res.setHeader(key, value);
            });
          } catch (headerError) {
            console.warn('Failed to set rate limit headers:', headerError);
          }
        }
        
        // Choose appropriate response
        if (access.reason === 'rate_limited') {
          const retryAfter = Math.ceil((access.rateLimit?.retryAfterMs || 60000) / 1000);
          res.setHeader('Retry-After', retryAfter);
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter,
            resetIn: access.rateLimit?.resetTime ? access.rateLimit.resetTime - Date.now() : undefined
          });
        }
        
        // For auth failures, redirect to login or return 403
        const accept = req.headers.accept || '';
        const prefersHtml = accept.includes('text/html') || accept.includes('*/*');
        
        if (prefersHtml && req.url && !req.url.startsWith('/api/')) {
          // Redirect to login page for browser requests
          const encodedUrl = encodeURIComponent(req.url || '/');
          return res.redirect(302, `/inner-circle/login?returnTo=${encodedUrl}&reason=${access.reason}`);
        } else {
          // Return JSON for API requests
          return res.status(403).json({
            error: 'Access Denied',
            reason: access.reason,
            message: 'Inner circle access required',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Add security headers to successful responses
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('X-Access-Level', 'inner-circle');
      
      try {
        // Try to add request ID
        const { randomUUID } = await import('crypto');
        res.setHeader('X-Request-ID', randomUUID());
      } catch {
        // Fallback if crypto is not available
        res.setHeader('X-Request-ID', `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      }
      
      // Call the original handler
      return handler(req, res);
      
    } catch (error) {
      console.error('[InnerCircleAccess] Error checking access:', error);
      
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify access',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/* -------------------------------------------------------------------------- */
/* 4. EXAMPLE PROTECTED API HANDLER                                           */
/* -------------------------------------------------------------------------- */

// Example usage with the middleware wrapper
const protectedContentHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Access info is available on the request object
  const access = (req as any).innerCircleAccess;
  
  // You can use the access data for logging or additional checks
  console.log(`[API] Protected content accessed by ${access.userData?.ip}`);
  
  // Return protected content
  return res.status(200).json({
    success: true,
    data: {
      message: 'Welcome to the Inner Circle',
      protectedContent: [
        { id: 1, title: 'Exclusive Strategy', content: '...' },
        { id: 2, title: 'Private Analysis', content: '...' },
        { id: 3, title: 'Member-only Resources', content: '...' }
      ],
      accessedAt: new Date().toISOString(),
      accessedBy: access.userData?.ip
    },
    metadata: {
      rateLimit: access.rateLimit ? {
        remaining: access.rateLimit.remaining,
        limit: access.rateLimit.limit,
        resetsAt: new Date(access.rateLimit.resetTime).toISOString()
      } : undefined
    }
  });
};

// Export the wrapped handler
export default withInnerCircleAccess(protectedContentHandler, {
  requireAuth: true,
  // Use fallback config that matches the structure
  rateLimitConfig: {
    windowMs: 60000,
    limit: 30,
    keyPrefix: 'protected_content'
  }
});

/* -------------------------------------------------------------------------- */
/* 5. UTILITY FUNCTIONS FOR SPECIFIC USE CASES                                */
/* -------------------------------------------------------------------------- */

export async function checkInnerCircleAccessInPage(
  context: any // Next.js page context
): Promise<{
  props: { innerCircleAccess: InnerCircleAccess };
  redirect?: { destination: string; permanent: boolean };
}> {
  const { req } = context;
  const access = await getInnerCircleAccess(req, { requireAuth: true });
  
  if (!access.hasAccess) {
    return {
      redirect: {
        destination: `/inner-circle/locked?returnTo=${req.url || '/'}&reason=${access.reason}`,
        permanent: false
      },
      props: { innerCircleAccess: access }
    };
  }
  
  return {
    props: { innerCircleAccess: access }
  };
}

export function createPublicApiHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withInnerCircleAccess(handler, {
    requireAuth: false,
    rateLimitConfig: {
      windowMs: 60000,
      limit: 100,
      keyPrefix: 'public_api'
    }
  });
}

export function createStrictApiHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withInnerCircleAccess(handler, {
    requireAuth: true,
    rateLimitConfig: {
      windowMs: 60000,
      limit: 30,
      keyPrefix: 'strict_api'
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 6. EXPORT TYPES FOR USE IN OTHER FILES                                     */
/* -------------------------------------------------------------------------- */

export type { InnerCircleAccess, AccessCheckOptions };
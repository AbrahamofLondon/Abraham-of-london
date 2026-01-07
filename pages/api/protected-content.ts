import { NextApiRequest, NextApiResponse } from 'next';
import { getClientIp } from '@/lib/server/rate-limit-unified';
import { withEdgeRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/server/rate-limit-unified';
import { rateLimitRedis } from '@/lib/rate-limit-redis';

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
    ip = getClientIp(req);
  } else {
    // NextApiRequest (from API route)
    ip = req.headers['x-forwarded-for']?.[0] || 
         req.headers['x-real-ip'] as string || 
         req.socket?.remoteAddress || 
         'unknown';
  }
  
  const userAgent = req.headers['user-agent'] || '';
  const hasAccessCookie = req.cookies?.[INNER_CIRCLE_COOKIE_NAME] === "true";
  
  // ==================== RATE LIMITING ====================
  if (!skipRateLimit) {
    const config = rateLimitConfig || RATE_LIMIT_CONFIGS.API_STRICT;
    
    let rateLimitResult;
    if (rateLimitRedis) {
      // Use Redis-based rate limiting
      rateLimitResult = await rateLimitRedis.check(ip, {
        windowMs: config.windowMs,
        max: config.limit,
        keyPrefix: config.keyPrefix,
      });
    } else {
      // Fallback to in-memory rate limiting
      const { result } = await withEdgeRateLimit(
        // Create a minimal NextRequest-like object
        { nextUrl: new URL(req.url || '/', 'http://localhost'), 
          headers: new Headers({ 'x-forwarded-for': ip }) } as any,
        config
      );
      rateLimitResult = result;
    }
    
    if (rateLimitResult?.remaining === 0) {
      return {
        hasAccess: false,
        reason: 'rate_limited',
        rateLimit: {
          remaining: 0,
          limit: config.limit,
          resetTime: Date.now() + (rateLimitResult?.retryAfterMs || config.windowMs),
          retryAfterMs: rateLimitResult?.retryAfterMs
        },
        userData: { ip, userAgent, timestamp: Date.now() }
      };
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
          const { createRateLimitHeaders } = await import('@/lib/server/rate-limit-unified');
          const headers = createRateLimitHeaders(access.rateLimit);
          Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
        }
        
        // Choose appropriate response
        if (access.reason === 'rate_limited') {
          res.setHeader('Retry-After', Math.ceil((access.rateLimit?.retryAfterMs || 60000) / 1000));
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: access.rateLimit?.retryAfterMs,
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
      res.setHeader('X-Request-ID', crypto.randomUUID());
      
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
  rateLimitConfig: RATE_LIMIT_CONFIGS.API_STRICT
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
    rateLimitConfig: RATE_LIMIT_CONFIGS.API_GENERAL
  });
}

export function createStrictApiHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return withInnerCircleAccess(handler, {
    requireAuth: true,
    rateLimitConfig: RATE_LIMIT_CONFIGS.API_STRICT
  });
}
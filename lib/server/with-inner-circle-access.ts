// lib/server/with-inner-circle-access.ts
/**
 * Inner circle access middleware with fallbacks
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// ==================== SAFE IMPORTS ====================
let rateLimitModule: any = null;

try {
  const module = require('@/lib/server/rate-limit-unified');
  rateLimitModule = module;
} catch (error) {
  console.warn('[withInnerCircleAccess] rate-limit-unified not available');
}

// ==================== MAIN MIDDLEWARE ====================
export function withInnerCircleAccess(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: {
    requireAuth?: boolean;
    rateLimitConfig?: any;
  } = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const { requireAuth = true } = options;
      
      // Check access cookie
      const hasAccess = req.cookies?.innerCircleAccess === "true";
      
      if (requireAuth && !hasAccess) {
        res.status(403).json({
          error: 'Access Denied',
          message: 'Inner circle access required'
        });
        return;
      }
      
      // Apply rate limiting if module is available
      if (rateLimitModule?.withApiRateLimit) {
        const rateLimitConfig = options.rateLimitConfig || rateLimitModule.RATE_LIMIT_CONFIGS?.INNER_CIRCLE;
        if (rateLimitConfig) {
          const rateLimitedHandler = rateLimitModule.withApiRateLimit(handler, rateLimitConfig);
          return rateLimitedHandler(req, res);
        }
      }
      
      // Call handler without rate limiting
      await handler(req, res);
      
    } catch (error) {
      console.error('[withInnerCircleAccess] Error:', error);
      res.status(500).json({
        error: 'Internal Server Error'
      });
    }
  };
}

export default withInnerCircleAccess;

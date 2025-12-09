import type { NextApiRequest, NextApiResponse } from 'next';
import { cleanupOldData } from '@/lib/server/innerCircleStore';
import { 
  rateLimitForRequestIp, 
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  getClientIp 
} from '@/lib/server/rateLimit';

function isAdminAuthenticated(req: NextApiRequest): boolean {
  const adminToken = req.headers['x-admin-token'] || req.headers['authorization'];
  return adminToken === process.env.ADMIN_API_KEY || 
         process.env.NODE_ENV === 'development';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      ok: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ 
      ok: false, 
      error: 'Unauthorized. Admin access required.' 
    });
  }

  // Stricter rate limiting for cleanup operations
  const ip = getClientIp(req);
  const rateLimitResult = rateLimitForRequestIp(
    req, 
    'inner-circle-admin-cleanup', 
    { ...RATE_LIMIT_CONFIGS.ADMIN_OPERATIONS, limit: 3 } // Only 3 cleanups per hour
  );

  if (!rateLimitResult.result.allowed) {
    const headers = createRateLimitHeaders(rateLimitResult.result);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    return res.status(429).json({ 
      ok: false, 
      error: 'Too many cleanup requests. Please wait before trying again.' 
    });
  }

  try {
    const { force } = req.body;
    
    // Optional: Add confirmation for forced cleanup
    if (force && !req.headers['x-confirm-force-cleanup']) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Force cleanup requires confirmation header x-confirm-force-cleanup' 
      });
    }

    const result = await cleanupOldData();

    // Add rate limit headers
    const headers = createRateLimitHeaders(rateLimitResult.result);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(200).json({ 
      ok: true, 
      message: 'Cleanup completed successfully.',
      result,
      cleanedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Admin Cleanup] Error:', error);
    
    return res.status(500).json({ 
      ok: false, 
      error: 'Cleanup failed. Please try again.' 
    });
  }
}
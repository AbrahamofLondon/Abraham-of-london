import type { NextApiRequest, NextApiResponse } from 'next';
import { revokeInnerCircleKey } from '@/lib/server/innerCircleStore';
import { 
  rateLimitForRequestIp, 
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  getClientIp 
} from '@/lib/server/rateLimit';

// Admin auth helper (you should replace with your actual admin auth)
function isAdminAuthenticated(req: NextApiRequest): boolean {
  // TODO: Implement your actual admin authentication
  // Example: check for admin session, JWT, or API key
  const adminToken = req.headers['x-admin-token'] || req.headers['authorization'];
  return adminToken === process.env.ADMIN_API_KEY || 
         process.env.NODE_ENV === 'development'; // Allow in dev for testing
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      ok: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  // Admin authentication check
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ 
      ok: false, 
      error: 'Unauthorized. Admin access required.' 
    });
  }

  // Rate limiting for admin operations
  const ip = getClientIp(req);
  const rateLimitResult = rateLimitForRequestIp(
    req, 
    'inner-circle-admin-revoke', 
    RATE_LIMIT_CONFIGS.ADMIN_OPERATIONS
  );

  if (!rateLimitResult.result.allowed) {
    const headers = createRateLimitHeaders(rateLimitResult.result);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    return res.status(429).json({ 
      ok: false, 
      error: 'Too many admin requests. Please try again later.' 
    });
  }

  try {
    const { key, reason, revokedBy } = req.body;

    if (!key) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Access key is required.' 
      });
    }

    const success = await revokeInnerCircleKey(
      key, 
      revokedBy || 'admin_api', 
      reason || 'admin_revocation'
    );

    if (!success) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Key not found or already revoked.' 
      });
    }

    // Add rate limit headers to response
    const headers = createRateLimitHeaders(rateLimitResult.result);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(200).json({ 
      ok: true, 
      message: 'Key successfully revoked.',
      revokedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Admin Revoke] Error:', error);
    
    // Don't expose internal errors
    return res.status(500).json({ 
      ok: false, 
      error: 'Revocation failed. Please try again.' 
    });
  }
}
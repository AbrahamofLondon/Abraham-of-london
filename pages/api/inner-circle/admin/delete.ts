import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteMemberByEmail } from '@/lib/server/innerCircleStore';
import { 
  rateLimitForRequestIp, 
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  getClientIp 
} from '@/lib/server/rateLimit';

// Admin auth helper (same as above)
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

  // Rate limiting
  const ip = getClientIp(req);
  const rateLimitResult = rateLimitForRequestIp(
    req, 
    'inner-circle-admin-delete', 
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
    const { email, reason } = req.body;

    if (!email) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Email address is required.' 
      });
    }

    const success = await deleteMemberByEmail(email);

    if (!success) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Member not found.' 
      });
    }

    // Add rate limit headers
    const headers = createRateLimitHeaders(rateLimitResult.result);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(200).json({ 
      ok: true, 
      message: 'Member successfully deleted.',
      deletedAt: new Date().toISOString(),
      note: reason ? `Reason: ${reason}` : undefined
    });

  } catch (error) {
    console.error('[Admin Delete] Error:', error);
    
    return res.status(500).json({ 
      ok: false, 
      error: 'Deletion failed. Please try again.' 
    });
  }
}
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrivacySafeStats } from '@/lib/server/innerCircleStore';
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
  // Allow both GET and POST for flexibility
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ 
      ok: false, 
      error: 'Method not allowed. Use GET or POST.' 
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
    'inner-circle-admin-stats', 
    RATE_LIMIT_CONFIGS.ADMIN_API
  );

  if (!rateLimitResult.result.allowed) {
    const headers = createRateLimitHeaders(rateLimitResult.result);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    return res.status(429).json({ 
      ok: false, 
      error: 'Too many requests. Please try again later.' 
    });
  }

  try {
    const stats = await getPrivacySafeStats();

    // Add cache headers for efficiency (5 minutes)
    res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
    
    // Add rate limit headers
    const headers = createRateLimitHeaders(rateLimitResult.result);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(200).json({ 
      ok: true, 
      stats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    
    return res.status(500).json({ 
      ok: false, 
      error: 'Failed to retrieve statistics.' 
    });
  }
}
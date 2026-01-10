// pages/api/inner-circle/verify.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  verifyInnerCircleKeyWithRateLimit, 
  createRateLimitHeaders 
} from '@/lib/inner-circle';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    const { verification, rateLimit, headers } = await verifyInnerCircleKeyWithRateLimit(key, req);
    
    // Add rate limit headers
    if (headers) {
      Object.entries(headers).forEach(([headerKey, value]) => {
        res.setHeader(headerKey, value);
      });
    }

    // Add our own headers
    res.setHeader('X-Inner-Circle-Valid', verification.valid.toString());
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json({
      valid: verification.valid,
      member: verification.member,
      expiresAt: verification.expiresAt,
      rateLimit: rateLimit ? {
        allowed: rateLimit.allowed,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      } : undefined,
    });

  } catch (error: any) {
    console.error('[InnerCircle] Verification error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

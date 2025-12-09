import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  combinedRateLimit, 
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  getClientIp 
} from '@/lib/server/rateLimit';
import { getMemberByEmail } from '@/lib/server/innerCircleStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, error: 'Email is required' });
    }

    // Apply strict rate limiting for resend requests
    const ip = getClientIp(req);
    const rateLimitResult = combinedRateLimit(
      req,
      email,
      'inner-circle-resend',
      RATE_LIMIT_CONFIGS.INNER_CIRCLE_RESEND,
      RATE_LIMIT_CONFIGS.INNER_CIRCLE_RESEND_EMAIL
    );

    if (!rateLimitResult.allowed) {
      const headers = createRateLimitHeaders(rateLimitResult.ipResult);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      return res.status(429).json({ 
        ok: false, 
        error: 'Too many resend requests. Please try again later.' 
      });
    }

    // Check if member exists
    const member = await getMemberByEmail(email);
    
    if (!member) {
      // Return generic message for security (don't reveal if email exists)
      return res.status(200).json({ 
        ok: true, 
        message: 'If your email is registered, you will receive a new key shortly.' 
      });
    }

    // TODO: Implement actual resend logic
    // 1. Get active keys for member
    // 2. Resend the latest active key via email
    // 3. Log the resend action
    
    const headers = createRateLimitHeaders(rateLimitResult.ipResult);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(200).json({ 
      ok: true, 
      message: 'If your email is registered, you will receive a new key shortly.' 
    });

  } catch (error) {
    console.error('[InnerCircle Resend] Error:', error);
    return res.status(500).json({ ok: false, error: 'Resend failed. Please try again.' });
  }
}
// pages/api/inner-circle/verify.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyInnerCircleKey } from '@/lib/server/inner-circle-store';
import { 
  rateLimitForRequestIp, 
  RATE_LIMIT_CONFIGS, 
  createRateLimitHeaders 
} from '@/lib/server/rateLimit';

type VerifyResponse = {
  valid: boolean;
  reason?: string;
  keySuffix?: string;
  error?: string;
};

/**
 * THE VERIFICATION ENGINE
 * Validates incoming access keys against the persistent file store.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>
) {
  // 1. Method Restriction
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ valid: false, error: 'Method not allowed' });
  }

  // 2. High-Frequency Rate Limiting
  // Protects the vault against brute-force key guessing.
  const rateLimitResult = rateLimitForRequestIp(
    req, 
    'inner-circle-verify', 
    RATE_LIMIT_CONFIGS.PUBLIC_API
  );

  const headers = createRateLimitHeaders(rateLimitResult.result);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

  if (!rateLimitResult.result.allowed) {
    return res.status(429).json({ 
      valid: false, 
      error: 'Too many verification attempts. Please wait.' 
    });
  }

  try {
    const { key } = req.body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ valid: false, error: 'Access key is required.' });
    }

    // 3. Execution of Store Logic
    // This checks for existence, 'active' status, and expiration date.
    const result = await verifyInnerCircleKey(key.trim());

    if (result.valid) {
      console.info(`[Vault Access] Key verified: ...${result.keySuffix}`);
      return res.status(200).json({ 
        valid: true, 
        keySuffix: result.keySuffix 
      });
    }

    // 4. Failure Response
    // We return 'valid: false' but keep the reason generic for security.
    return res.status(200).json({ 
      valid: false, 
      reason: result.reason || 'invalid_credentials' 
    });

  } catch (error) {
    console.error('[Vault Error] Verification exception:', error);
    return res.status(500).json({ valid: false, error: 'Internal verification failure.' });
  }
}
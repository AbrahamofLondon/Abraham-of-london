import type { NextApiRequest, NextApiResponse } from 'next';
import { revokeInnerCircleKey } from '@/lib/server/innerCircleStore';
import { 
  rateLimitForRequestIp, 
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  getClientIp 
} from '@/lib/server/rateLimit';

/**
 * ADMIN AUTHORITY CHECK
 * Strictly validates against the system master key.
 */
function isAdminAuthenticated(req: NextApiRequest): boolean {
  const adminToken = req.headers['x-inner-circle-admin-key'] || req.headers['authorization'];
  if (!adminToken || typeof adminToken !== 'string') return false;
  
  return adminToken === process.env.INNER_CIRCLE_ADMIN_KEY;
}

type RevokeResponse = {
  ok: boolean;
  message?: string;
  revokedAt?: string;
  error?: string;
};

/**
 * ACCESS REVOCATION ENGINE - Unified Production Version
 * Hardened for immediate invalidation of cryptographic keys and audit logging.
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<RevokeResponse>
) {
  // 1. Method Authority
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Revocation requires POST authorization.' });
  }

  // 2. Authentication Perimeter
  if (!isAdminAuthenticated(req)) {
    console.error(`[Security Alert] Unauthorized revocation attempt from IP: ${getClientIp(req)}`);
    return res.status(401).json({ ok: false, error: 'Unauthorized. System Admin key required.' });
  }

  // 3. Administrative Rate Limiting
  const rateLimitResult = rateLimitForRequestIp(
    req, 
    'inner-circle-admin-revoke', 
    RATE_LIMIT_CONFIGS.ADMIN_OPERATIONS
  );

  // Apply operational transparency headers
  const headers = createRateLimitHeaders(rateLimitResult.result);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

  if (!rateLimitResult.result.allowed) {
    return res.status(429).json({ 
      ok: false, 
      error: 'Operational limit reached. Administrative actions are throttled.' 
    });
  }

  try {
    const { key, reason, revokedBy } = req.body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ ok: false, error: 'Target access key is required.' });
    }

    // 4. Cryptographic Invalidation
    // This flips the status in the persistent store and adds an audit record.
    const success = await revokeInnerCircleKey(
      key.trim(), 
      revokedBy || 'system_admin_console', 
      reason || 'Administrative revocation'
    );

    if (!success) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Key not found or already in an invalid state.' 
      });
    }

    console.info(`[Admin Action] Key Revoked: ${key.slice(-4)} | Reason: ${reason}`);

    return res.status(200).json({ 
      ok: true, 
      message: 'Access key has been successfully invalidated.',
      revokedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Admin Action] Exception during revocation:', error);
    return res.status(500).json({ ok: false, error: 'Revocation subsystem failure.' });
  }
}
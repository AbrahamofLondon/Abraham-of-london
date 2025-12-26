import type { NextApiRequest, NextApiResponse } from 'next';
import innerCircleStore from '@/lib/server/inner-circle-store';
import { 
  rateLimitForRequestIp, 
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  getClientIp 
} from '@/lib/server/rateLimit';

/**
 * ADMIN AUTHORITY CHECK
 * Synchronized with the System Admin master key.
 */
function isAdminAuthenticated(req: NextApiRequest): boolean {
  const adminToken = req.headers['x-inner-circle-admin-key'] || req.headers['authorization'];
  if (!adminToken || typeof adminToken !== 'string') return false;
  
  return adminToken === process.env.INNER_CIRCLE_ADMIN_KEY;
}

type DeleteResponse = {
  ok: boolean;
  message?: string;
  deletedAt?: string;
  error?: string;
  note?: string;
};

/**
 * IDENTITY TERMINATION ENGINE - Unified Production Version
 * Hardened for administrative surgical deletions and data privacy compliance.
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<DeleteResponse>
) {
  // 1. Method Authority
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Surgical deletion requires POST authorization.' });
  }

  // 2. Authentication Perimeter
  if (!isAdminAuthenticated(req)) {
    console.error(`[Security Alert] Unauthorized deletion attempt from IP: ${getClientIp(req)}`);
    return res.status(401).json({ ok: false, error: 'Unauthorized. System Admin key required.' });
  }

  // 3. Administrative Rate Limiting
  const rateLimitResult = rateLimitForRequestIp(
    req, 
    'inner-circle-admin-delete', 
    RATE_LIMIT_CONFIGS.ADMIN_OPERATIONS
  );

  // Apply headers for operational transparency
  const headers = createRateLimitHeaders(rateLimitResult.result);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

  if (!rateLimitResult.result.allowed) {
    return res.status(429).json({ 
      ok: false, 
      error: 'Operational limit reached. Administrative actions are throttled.' 
    });
  }

  try {
    const { email, reason } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ ok: false, error: 'Target identity (email) is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 4. Surgical Deletion Execution
    // This removes the member and all associated cryptographic keys.
    const success = await innerCircleStore.deleteMemberByEmail(normalizedEmail);

    if (!success) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Identity not found in the Vault store.' 
      });
    }

    console.info(`[Admin Action] Member deleted: ${normalizedEmail}${reason ? ` | Reason: ${reason}` : ''}`);

    return res.status(200).json({ 
      ok: true, 
      message: 'Identity and associated keys successfully purged.',
      deletedAt: new Date().toISOString(),
      note: reason ? `Reason provided: ${reason}` : undefined
    });
  } catch (error) {
    console.error('[Admin Action] Exception during surgical deletion:', error);
    return res.status(500).json({ ok: false, error: 'Purge subsystem failure. Action aborted.' });
  }
}
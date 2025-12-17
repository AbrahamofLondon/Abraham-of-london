import type { NextApiRequest, NextApiResponse } from 'next';
import { cleanupOldData } from '@/lib/server/inner-circle-store';
import { 
  rateLimitForRequestIp, 
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  getClientIp 
} from '@/lib/server/rateLimit';

/**
 * ADMIN AUTHORITY CHECK
 * Strictly validates the administrative key against environment secrets.
 */
function isAdminAuthenticated(req: NextApiRequest): boolean {
  const adminToken = req.headers['x-inner-circle-admin-key'] || req.headers['authorization'];
  if (!adminToken || typeof adminToken !== 'string') return false;
  
  // Direct comparison with the system-level master key
  return adminToken === process.env.INNER_CIRCLE_ADMIN_KEY;
}

type CleanupResponse = {
  ok: boolean;
  message?: string;
  stats?: {
    deletedMembers: number;
    deletedKeys: number;
  };
  error?: string;
  cleanedAt?: string;
};

/**
 * THE MAINTENANCE ENGINE - Unified Production Version
 * Hardened for system integrity and periodic data hygiene.
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<CleanupResponse>
) {
  // 1. Method Authority
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Maintenance requires POST authorization.' });
  }

  // 2. Authentication Perimeter
  if (!isAdminAuthenticated(req)) {
    console.error(`[Security Alert] Unauthorized cleanup attempt from IP: ${getClientIp(req)}`);
    return res.status(401).json({ ok: false, error: 'Unauthorized. System Admin key required.' });
  }

  // 3. Administrative Rate Limiting
  // Only 3 cleanup operations allowed per hour to prevent accidental database thrashing.
  const rateLimitResult = rateLimitForRequestIp(
    req, 
    'inner-circle-admin-cleanup', 
    { ...RATE_LIMIT_CONFIGS.ADMIN_OPERATIONS, limit: 3 }
  );

  // Apply headers for operational transparency
  const headers = createRateLimitHeaders(rateLimitResult.result);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

  if (!rateLimitResult.result.allowed) {
    return res.status(429).json({ 
      ok: false, 
      error: 'Operational limit reached. Cleanup is restricted to 3 runs per hour.' 
    });
  }

  try {
    // 4. Execution of Hygiene Logic
    // This removes expired keys and members who have exceeded the data retention period.
    const result = await cleanupOldData();

    console.info(`[System Maintenance] Cleanup successful: ${result.deletedMembers} members removed.`);

    return res.status(200).json({ 
      ok: true, 
      message: 'Vault hygiene completed successfully.',
      stats: {
        deletedMembers: result.deletedMembers,
        deletedKeys: result.deletedKeys
      },
      cleanedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[System Maintenance] Exception during cleanup:', error);
    return res.status(500).json({ ok: false, error: 'hygiene subsystem failure. Maintenance aborted.' });
  }
}
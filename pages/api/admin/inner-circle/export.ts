import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getPrivacySafeStats, 
  getPrivacySafeKeyExport 
} from '@/lib/server/innerCircleStore';
import { 
  rateLimitForRequestIp, 
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  getClientIp 
} from '@/lib/server/rateLimit';

// Standard response types aligned with the Admin Console UI
type AdminExportRow = {
  created_at: string;
  status: "active" | "revoked";
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
};

type AdminExportResponse = {
  ok: boolean;
  rows?: AdminExportRow[];
  stats?: any;
  generatedAt?: string;
  error?: string;
};

/**
 * THE INTELLIGENCE ENGINE - Unified Production Version
 * Hardened for administrative oversight without compromising user privacy.
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<AdminExportResponse>
) {
  // 1. Method Authority
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, error: 'Method requires GET for secure export.' });
  }

  // 2. Authentication Perimeter (Bearer Token Contract)
  const ADMIN_BEARER_TOKEN = process.env.INNER_CIRCLE_ADMIN_KEY; // Re-syncing with your ENV naming
  const authHeader = req.headers.authorization;
  
  if (!ADMIN_BEARER_TOKEN || !authHeader?.startsWith("Bearer ")) {
    console.error(`[Security Alert] Unauthorized export attempt from IP: ${getClientIp(req)}`);
    return res.status(401).json({ ok: false, error: 'Authorization required.' });
  }

  const token = authHeader.substring(7);
  if (token !== ADMIN_BEARER_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Invalid security credentials.' });
  }

  // 3. Administrative Rate Limiting
  const rateLimitResult = rateLimitForRequestIp(
    req, 
    'inner-circle-admin-export', 
    RATE_LIMIT_CONFIGS.ADMIN_API
  );

  const headers = createRateLimitHeaders(rateLimitResult.result);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

  if (!rateLimitResult.result.allowed) {
    return res.status(429).json({ 
      ok: false, 
      error: 'Intelligence requests are throttled. Please wait before re-exporting.' 
    });
  }

  try {
    // 4. Data Aggregation & Privacy Masking
    // We execute concurrently to minimize database connection time.
    const [stats, rows] = await Promise.all([
      getPrivacySafeStats(),
      getPrivacySafeKeyExport()
    ]);

    // 5. Response Integrity
    return res.status(200).json({ 
      ok: true, 
      stats,
      rows: rows as AdminExportRow[],
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Admin Intelligence] System Exception:', error);
    return res.status(500).json({ ok: false, error: 'Export subsystem failure.' });
  }
}
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPrivacySafeStats, getPrivacySafeKeyExport } from '@/lib/server/innerCircleStore';
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

type AdminExportResponse = {
  ok: boolean;
  rows?: any[];
  stats?: any;
  generatedAt?: string;
  error?: string;
};

/**
 * THE INTELLIGENCE ENGINE - Unified Production Version
 * Provides telemetry and privacy-safe data exports for administrative oversight.
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<AdminExportResponse>
) {
  // 1. Method Authority (GET for viewing, POST for specific filtered exports)
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ ok: false, error: 'Method requires GET or POST for data retrieval.' });
  }

  // 2. Authentication Perimeter
  if (!isAdminAuthenticated(req)) {
    console.error(`[Security Alert] Unauthorized stats access attempt from IP: ${getClientIp(req)}`);
    return res.status(401).json({ ok: false, error: 'Unauthorized. System Admin key required.' });
  }

  // 3. Administrative Rate Limiting
  const rateLimitResult = rateLimitForRequestIp(
    req, 
    'inner-circle-admin-stats', 
    RATE_LIMIT_CONFIGS.ADMIN_API
  );

  // Apply operational transparency headers
  const headers = createRateLimitHeaders(rateLimitResult.result);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

  if (!rateLimitResult.result.allowed) {
    return res.status(429).json({ 
      ok: false, 
      error: 'Operational limit reached. Intelligence requests are throttled.' 
    });
  }

  try {
    // 4. Data Aggregation
    // getPrivacySafeStats returns high-level numbers (totals, active vs inactive)
    // getPrivacySafeKeyExport returns row-level data with hashed emails and key suffixes
    const [stats, rows] = await Promise.all([
      getPrivacySafeStats(),
      getPrivacySafeKeyExport()
    ]);

    // 5. Cache Management (5-minute window for performance)
    res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');

    return res.status(200).json({ 
      ok: true, 
      stats,
      rows,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Admin Intelligence] System Exception:', error);
    return res.status(500).json({ ok: false, error: 'Telemetry subsystem failure.' });
  }
}
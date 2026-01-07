/* pages/api/admin/inner-circle/export.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { 
  getPrivacySafeKeyExportWithRateLimit, 
  getPrivacySafeStatsWithRateLimit,
  withInnerCircleRateLimit,
  createRateLimitHeaders 
} from "@/lib/inner-circle";

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
  rateLimit?: {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: number;
  };
};

// Apply rate limiting middleware
const rateLimitedHandler = withInnerCircleRateLimit({ 
  adminOperation: true, 
  adminId: 'export' 
})(async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminExportResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ 
      ok: false, 
      error: "Method requires GET for secure export." 
    });
  }

  // Admin authentication
  const ADMIN_BEARER_TOKEN = process.env.INNER_CIRCLE_ADMIN_KEY;
  const authHeader = req.headers.authorization;

  if (!ADMIN_BEARER_TOKEN || !authHeader?.startsWith("Bearer ")) {
    const { getClientIp } = await import('@/lib/rate-limit');
    console.error(`[Security Alert] Unauthorized export attempt from IP: ${getClientIp(req)}`);
    return res.status(401).json({ 
      ok: false, 
      error: "Authorization required." 
    });
  }

  const token = authHeader.slice(7);
  if (token !== ADMIN_BEARER_TOKEN) {
    return res.status(401).json({ 
      ok: false, 
      error: "Invalid security credentials." 
    });
  }

  try {
    // Get pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    // Get admin ID from token (extract from JWT or use token hash)
    const adminId = `admin_${Buffer.from(token).toString('hex').slice(0, 16)}`;
    
    // Fetch data with rate limiting
    const [{ data: exportData, rateLimit: exportRateLimit }, { stats, rateLimit: statsRateLimit }] = await Promise.all([
      getPrivacySafeKeyExportWithRateLimit(
        { page, limit },
        adminId,
        req
      ),
      getPrivacySafeStatsWithRateLimit(adminId, req)
    ]);

    // Use the stricter rate limit result
    const rateLimit = !exportRateLimit?.allowed ? exportRateLimit : 
                     (!statsRateLimit?.allowed ? statsRateLimit : exportRateLimit);

    // Add rate limit headers
    if (rateLimit) {
      const headers = createRateLimitHeaders(rateLimit);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    // Transform rows to match expected format
    const rows = (exportData.items || []).map((row: any) => ({
      created_at: row.createdAt || new Date().toISOString(),
      status: (row.status || 'active').toLowerCase(),
      key_suffix: row.keySuffix || '',
      email_hash_prefix: row.emailHashPrefix || '',
      total_unlocks: row.totalUnlocks || 0,
    }));

    return res.status(200).json({
      ok: true,
      stats: {
        ...stats,
        page: exportData.page,
        limit: exportData.limit,
        totalPages: exportData.totalPages,
        totalItems: exportData.totalItems,
      },
      rows,
      generatedAt: new Date().toISOString(),
      rateLimit: rateLimit ? {
        allowed: rateLimit.allowed,
        remaining: rateLimit.remaining,
        limit: rateLimit.limit,
        resetAt: rateLimit.resetAt,
      } : undefined,
    });

  } catch (error: any) {
    console.error("[Admin Intelligence] System Exception:", error);
    
    // Check if it's a rate limit error
    if (error.message.includes('Rate limit') || error.message.includes('too many')) {
      return res.status(429).json({
        ok: false,
        error: "Intelligence requests are throttled. Please wait before re-exporting.",
        generatedAt: new Date().toISOString(),
      });
    }
    
    return res.status(500).json({ 
      ok: false, 
      error: "Export subsystem failure.",
      generatedAt: new Date().toISOString(),
    });
  }
});

export default rateLimitedHandler;
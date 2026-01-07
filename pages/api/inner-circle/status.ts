/* pages/api/inner-circle/status.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { 
  getPrivacySafeStatsWithRateLimit, 
  INNER_CIRCLE_CONFIG 
} from "@/lib/inner-circle";

type StatusResponse =
  | {
      ok: true;
      now: string;
      env: {
        nodeEnv: string;
        siteUrl: string | null;
        hasDbUrl: boolean;
        redisAvailable: boolean;
        rateLimiting: {
          enabled: boolean;
          storage: 'redis' | 'memory';
        };
      };
      stats: { 
        totalMembers: number; 
        totalKeys: number;
        activeKeys: number;
        revokedKeys: number;
      };
      system: {
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        rateLimitConfig: typeof INNER_CIRCLE_CONFIG.rateLimiting;
      };
    }
  | { 
      ok: false; 
      now: string; 
      error: string;
      details?: any;
    };

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<StatusResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ 
      ok: false, 
      now: new Date().toISOString(), 
      error: "Method not allowed" 
    });
  }

  try {
    // Get admin ID from query param or default to public
    const adminId = req.query.adminId as string || 'public';
    
    // Get stats with rate limiting
    const { stats, rateLimit } = await getPrivacySafeStatsWithRateLimit(adminId, req);
    
    // Add rate limit headers if available
    if (rateLimit) {
      const { createRateLimitHeaders } = await import('@/lib/inner-circle');
      const headers = createRateLimitHeaders(rateLimit);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    // Check database connection
    const hasDbUrl = Boolean(
      process.env.INNER_CIRCLE_DB_URL ?? 
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL
    );

    // System info
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return res.status(200).json({
      ok: true,
      now: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV || "unknown",
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
        hasDbUrl,
        redisAvailable: INNER_CIRCLE_CONFIG.redisAvailable,
        rateLimiting: {
          enabled: INNER_CIRCLE_CONFIG.rateLimiting.enabled,
          storage: INNER_CIRCLE_CONFIG.rateLimiting.storage,
        },
      },
      stats: {
        totalMembers: stats.totalMembers,
        totalKeys: stats.totalKeys,
        activeKeys: stats.activeKeys,
        revokedKeys: stats.revokedKeys,
      },
      system: {
        uptime,
        memoryUsage,
        rateLimitConfig: INNER_CIRCLE_CONFIG.rateLimiting,
      },
    });

  } catch (error: any) {
    console.error('[InnerCircle] Status error:', error);
    
    return res.status(500).json({
      ok: false,
      now: new Date().toISOString(),
      error: error?.message || "status_failed",
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }
}
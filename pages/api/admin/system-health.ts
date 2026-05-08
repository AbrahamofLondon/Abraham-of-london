import type { NextApiRequest, NextApiResponse } from "next";
import { getRedisStats, safePing } from "@/lib/redis-safe";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { getRateLimiterStats } from "@/lib/server/rate-limit-unified";

type HealthResponse = {
  ok: boolean;
  timestamp: string;
  environment?: string;
  runtime?: string;
  subsystems?: Record<string, unknown>;
  overallStatus?: string;
  performanceScore?: number;
  warnings?: string[];
  error?: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>,
) {
  const timestamp = new Date().toISOString();

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, timestamp, error: "Method not allowed" });
  }

  if (!(await requireAdminServer(req, res, {
    routeKey: "admin-system-health",
    rateLimit: { limit: 30, windowMs: 15 * 60_000 },
  }))) return;

  try {
    const [redisStats, rateLimiter, redisPing] = await Promise.all([
      getRedisStats(),
      getRateLimiterStats(),
      safePing(),
    ]);

    const cachePerformance = redisStats.available && redisPing ? 100 : 50;
    const rateLimitPerformance = rateLimiter.totalKeys < 5000 ? 100 : 60;
    const avgScore = Math.round((cachePerformance + rateLimitPerformance) / 2);

    const warnings: string[] = [];
    if (!redisStats.available) warnings.push("Redis unreachable");
    if (avgScore < 70) warnings.push("System performance is suboptimal");

    return res.status(redisPing && avgScore > 50 ? 200 : 503).json({
      ok: redisPing && avgScore > 50,
      timestamp,
      environment: process.env.NODE_ENV || "unknown",
      runtime: "nodejs",
      subsystems: {
        cache: {
          status: redisPing ? "healthy" : "degraded",
          metrics: { ...redisStats, ping: redisPing },
          performanceScore: cachePerformance,
        },
        rateLimiter: {
          status: rateLimiter.totalKeys > 10000 ? "critical" : "healthy",
          metrics: rateLimiter,
          performanceScore: rateLimitPerformance,
        },
      },
      overallStatus: avgScore > 80 ? "operational" : "degraded",
      performanceScore: avgScore,
      warnings,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      timestamp,
      error: "Health Check Failed",
      message: error?.message || "Unknown error",
    });
  }
}

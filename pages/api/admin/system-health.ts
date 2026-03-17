// pages/api/admin/system-health.ts - HARMONISED EDGE VERSION
import type { NextRequest } from 'next/server';
import { getRedisStats, safePing } from '@/lib/redis-safe';
import { getRateLimiterStats } from '@/lib/server/rate-limit-unified';

export const config = {
  runtime: 'edge', // ⚡ Keep it lightning fast and compatible
};

export default async function handler(req: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    // 1. AUTHENTICATION & METHOD GATE 🛡️
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), { status: 405 });
    }

    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
    }

    // 2. GATHER SUBSYSTEM DATA 📡
    // Using a simple Promise.all (if one fails, it moves to catch block for high-integrity reporting)
    const [redisStats, rateLimiter, redisPing] = await Promise.all([
      getRedisStats(),
      getRateLimiterStats(),
      safePing(),
    ]);

    // 3. HARMONISE METRICS & SCORING 📊
    // Corrected: using .totalKeys as defined in the rateLimiter type
    const cachePerformance = redisStats.available && redisPing ? 100 : 50;
    const rateLimitPerformance = rateLimiter.totalKeys < 5000 ? 100 : 60;
    
    const subsystems = {
      cache: {
        status: redisPing ? "healthy" : "degraded",
        metrics: { ...redisStats, ping: redisPing },
        performanceScore: cachePerformance
      },
      rateLimiter: {
        // Corrected: using .totalKeys for threshold check
        status: rateLimiter.totalKeys > 10000 ? "critical" : "healthy",
        metrics: rateLimiter,
        performanceScore: rateLimitPerformance
      }
    };

    // Calculate Overall Score (Average of subsystems)
    const avgScore = Math.round((cachePerformance + rateLimitPerformance) / 2);

    // 4. FINAL CONSOLIDATED REPORT 📝
    const report = {
      ok: redisPing && avgScore > 50,
      timestamp,
      environment: process.env.NODE_ENV || 'unknown',
      runtime: 'edge',
      subsystems,
      overallStatus: avgScore > 80 ? "operational" : "degraded",
      performanceScore: avgScore,
      warnings: [] as string[]
    };

    // Logic-based warnings
    if (!redisStats.available) report.warnings.push('Redis unreachable - falling back to local memory');
    if (avgScore < 70) report.warnings.push('System performance is suboptimal');

    return new Response(JSON.stringify(report, null, 2), {
      status: report.ok ? 200 : 503,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' 
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Health Check Failed',
      message: error.message,
      timestamp
    }), { status: 500 });
  }
}
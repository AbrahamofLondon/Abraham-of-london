/* pages/api/admin/system-health.ts - FIXED VERSION */
import type { NextApiRequest, NextApiResponse } from "next";
import os from "node:os";
import { createHash } from "node:crypto";
import prisma from "@/lib/prisma";
import { redisClient } from "@/lib/redis"; // ✅ CHANGED FROM 'redis' TO 'redisClient'
import { requireAdmin, requireRateLimit } from "@/lib/server/guards";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { getCacheStats } from "@/lib/server/cache";

// ✅ REMOVE RUNTIME DECLARATION OR FIX IT
// Remove this line completely:
// export const runtime = 'nodejs';

// If you need to keep it, use this format for Pages Router:
export const config = {
  api: {
    externalResolver: true,
  },
};

// Simplified types for now
interface SubsystemHealth {
  status: "healthy" | "degraded" | "critical" | "unknown";
  metrics: Record<string, any>;
  lastCheck: string;
  performanceScore: number;
}

interface HealthReport {
  timestamp: string;
  requestId: string;
  environment: string;
  version: string;
  uptime: number;
  subsystems: {
    database: SubsystemHealth;
    content: SubsystemHealth;
    cache: SubsystemHealth;
    system: SubsystemHealth;
  };
  overallStatus: "operational" | "degraded" | "critical";
  performanceScore: number;
  recommendations?: string[];
}

/**
 * SYSTEM HEALTH - SIMPLIFIED VERSION
 * Basic health check without complex dependencies
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = createHash('md5').update(`${Date.now()}-${Math.random()}`).digest('hex');
  const _startTime = Date.now();

  try {
    // 1. ADMIN AUTH (basic check)
    const auth = await requireAdmin(req, res);
    if (!auth.ok) {
      return jsonErr(res, 403, "UNAUTHORIZED", "Admin access required");
    }

    // 2. RATE LIMITING
    try {
      await requireRateLimit(req, res);
    } catch (error) {
      return jsonErr(res, 429, "RATE_LIMITED", "Too many requests");
    }

    // 3. RUN CHECKS
    const [databaseHealth, contentHealth, cacheHealth, systemHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkContentHealth(),
      checkCacheHealth(),
      checkSystemHealth(),
    ]);

    // 4. CALCULATE OVERALL
    const subsystems = {
      database: databaseHealth,
      content: contentHealth,
      cache: cacheHealth,
      system: systemHealth,
    };

    const overallStatus = calculateOverallStatus(subsystems);
    const performanceScore = calculatePerformanceScore(subsystems);

    // 5. PREPARE REPORT
    const healthReport: HealthReport = {
      timestamp: new Date().toISOString(),
      requestId,
      environment: process.env.NODE_ENV || "development",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      uptime: process.uptime(),
      subsystems,
      overallStatus,
      performanceScore,
    };

    return jsonOk(res, healthReport);

  } catch (error) {
    console.error('[HEALTH_CHECK_ERROR]', error);
    return jsonErr(res, 500, "INTERNAL_ERROR", "Health check failed");
  }
}

// SIMPLIFIED CHECKS
async function checkDatabaseHealth(): Promise<SubsystemHealth> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      status: "healthy",
      metrics: { connected: true },
      lastCheck: new Date().toISOString(),
      performanceScore: 100,
    };
  } catch (error) {
    return {
      status: "critical",
      metrics: { error: error instanceof Error ? error.message : "Database unreachable" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0,
    };
  }
}

async function checkContentHealth(): Promise<SubsystemHealth> {
  try {
    // Dynamic import to avoid build issues
    const contentlayerModule = await import('@/lib/contentlayer');
    const hydrated = contentlayerModule.isContentlayerLoaded?.() || false;
    const totalDocs = contentlayerModule.getAllContentlayerDocs?.()?.length || 0;
    
    return {
      status: hydrated && totalDocs > 0 ? "healthy" : "degraded",
      metrics: { 
        hydrated, 
        totalDocuments: totalDocs,
        contentEngine: "Contentlayer" 
      },
      lastCheck: new Date().toISOString(),
      performanceScore: hydrated ? 100 : 50,
    };
  } catch (error) {
    return {
      status: "degraded",
      metrics: { error: error instanceof Error ? error.message : "Content system unavailable" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0,
    };
  }
}

async function checkCacheHealth(): Promise<SubsystemHealth> {
  try {
    let redisConnected = false;
    if (redisClient && process.env.REDIS_URL) {
      await redisClient.ping();
      redisConnected = true;
    }
    
    const cacheStats = getCacheStats();
    
    return {
      status: redisConnected ? "healthy" : "degraded",
      metrics: { 
        redisConnected,
        ...cacheStats 
      },
      lastCheck: new Date().toISOString(),
      performanceScore: redisConnected ? 100 : 50,
    };
  } catch (error) {
    return {
      status: "degraded",
      metrics: { error: error instanceof Error ? error.message : "Cache system error" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0,
    };
  }
}

async function checkSystemHealth(): Promise<SubsystemHealth> {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = usedMem / totalMem;
    
    const status = memoryUsage > 0.9 ? "critical" : "healthy";
    
    return {
      status,
      metrics: {
        memory: {
          total: formatBytes(totalMem),
          used: formatBytes(usedMem),
          free: formatBytes(freeMem),
          usage: Math.round(memoryUsage * 100),
        },
        cpu: {
          cores: os.cpus().length,
        },
        uptime: os.uptime(),
      },
      lastCheck: new Date().toISOString(),
      performanceScore: memoryUsage > 0.9 ? 10 : 100,
    };
  } catch (error) {
    return {
      status: "critical",
      metrics: { error: error instanceof Error ? error.message : "System check failed" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0,
    };
  }
}

// HELPER FUNCTIONS
function calculateOverallStatus(subsystems: HealthReport['subsystems']): HealthReport['overallStatus'] {
  const statuses = Object.values(subsystems).map(s => s.status);
  
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("degraded")) return "degraded";
  return "operational";
}

function calculatePerformanceScore(subsystems: HealthReport['subsystems']): number {
  const scores = Object.values(subsystems)
    .map(s => s.performanceScore)
    .filter(score => !isNaN(score));
  
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

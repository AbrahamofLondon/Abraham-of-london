// pages/api/admin/system-health.ts - FIXED WITH CORRECT IMPORTS
import type { NextApiRequest, NextApiResponse } from "next";
import os from "os";
import { createHash } from "crypto";

// CORRECT IMPORTS - Use what's actually available in your project
import { redisClient } from "@/lib/redis";
import prisma from "@/lib/prisma";

// SIMPLIFIED TYPES
type HealthStatus = "healthy" | "degraded" | "critical" | "unknown";

interface SubsystemHealth {
  status: HealthStatus;
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

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<HealthReport>>
) {
  const requestId = createHash('md5').update(`${Date.now()}-${Math.random()}`).digest('hex');

  try {
    // 1. BASIC AUTH CHECK (Admin only)
    if (!req.headers.authorization || req.headers.authorization !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return res.status(403).json({
        ok: false,
        error: "UNAUTHORIZED - Admin access required"
      });
    }

    // 2. METHOD CHECK
    if (req.method !== 'GET') {
      return res.status(405).json({
        ok: false,
        error: "METHOD_NOT_ALLOWED - Use GET"
      });
    }

    // 3. RUN HEALTH CHECKS
    const [databaseHealth, contentHealth, cacheHealth, systemHealth] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkContentHealth(),
      checkCacheHealth(),
      checkSystemHealth()
    ]);

    // 4. PROCESS RESULTS
    const subsystems = {
      database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : {
        status: "critical" as const,
        metrics: { error: "Database check failed" },
        lastCheck: new Date().toISOString(),
        performanceScore: 0
      },
      content: contentHealth.status === 'fulfilled' ? contentHealth.value : {
        status: "degraded" as const,
        metrics: { error: "Content check failed" },
        lastCheck: new Date().toISOString(),
        performanceScore: 0
      },
      cache: cacheHealth.status === 'fulfilled' ? cacheHealth.value : {
        status: "degraded" as const,
        metrics: { error: "Cache check failed" },
        lastCheck: new Date().toISOString(),
        performanceScore: 0
      },
      system: systemHealth.status === 'fulfilled' ? systemHealth.value : {
        status: "critical" as const,
        metrics: { error: "System check failed" },
        lastCheck: new Date().toISOString(),
        performanceScore: 0
      }
    };

    // 5. CALCULATE OVERALL STATUS
    const overallStatus = calculateOverallStatus(subsystems);
    const performanceScore = calculatePerformanceScore(subsystems);

    // 6. PREPARE FINAL REPORT
    const healthReport: HealthReport = {
      timestamp: new Date().toISOString(),
      requestId,
      environment: process.env.NODE_ENV || "development",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      uptime: process.uptime(),
      subsystems,
      overallStatus,
      performanceScore
    };

    return res.status(200).json({
      ok: true,
      data: healthReport
    });

  } catch (error) {
    console.error('[HEALTH_CHECK_ERROR]', error);
    
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error during health check"
    });
  }
}

// SIMPLIFIED CHECKS - USING DIRECT IMPORTS
async function checkDatabaseHealth(): Promise<SubsystemHealth> {
  try {
    if (!prisma) {
      throw new Error('Prisma client not available');
    }

    // Simple connection test
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      status: "healthy",
      metrics: { connected: true },
      lastCheck: new Date().toISOString(),
      performanceScore: 100
    };
  } catch (error) {
    return {
      status: "critical",
      metrics: { error: error instanceof Error ? error.message : "Database unreachable" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0
    };
  }
}

async function checkContentHealth(): Promise<SubsystemHealth> {
  try {
    // Try dynamic import to avoid build issues if contentlayer isn't always available
    const contentlayer = await import('@/lib/contentlayer').catch(() => null);
    
    if (!contentlayer) {
      return {
        status: "degraded",
        metrics: { loaded: false, error: "Contentlayer module not found" },
        lastCheck: new Date().toISOString(),
        performanceScore: 0
      };
    }

    // Try different possible function names
    const isLoaded = contentlayer.isContentlayerLoaded?.() || false;
    const getAllDocs = contentlayer.getAllContentlayerDocs || contentlayer.getAllDocuments || (() => []);
    const totalDocs = getAllDocs().length || 0;

    return {
      status: isLoaded && totalDocs > 0 ? "healthy" : "degraded",
      metrics: { 
        loaded: isLoaded,
        totalDocuments: totalDocs,
        engine: "Contentlayer"
      },
      lastCheck: new Date().toISOString(),
      performanceScore: isLoaded ? 100 : 50
    };
  } catch (error) {
    return {
      status: "degraded",
      metrics: { error: error instanceof Error ? error.message : "Content system check failed" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0
    };
  }
}

async function checkCacheHealth(): Promise<SubsystemHealth> {
  try {
    // Check if Redis is configured
    if (!process.env.REDIS_URL) {
      return {
        status: "degraded",
        metrics: { 
          redisAvailable: false, 
          reason: "REDIS_URL not configured" 
        },
        lastCheck: new Date().toISOString(),
        performanceScore: 50
      };
    }

    // Check if redisClient is available
    if (!redisClient) {
      return {
        status: "degraded",
        metrics: { redisAvailable: false, reason: "Redis client not initialized" },
        lastCheck: new Date().toISOString(),
        performanceScore: 50
      };
    }

    // Test Redis connection with ping
    const start = Date.now();
    
    // Handle different redis client APIs
    let response;
    if (typeof redisClient.ping === 'function') {
      response = await redisClient.ping();
    } else if (typeof redisClient.command === 'function') {
      response = await redisClient.command('PING');
    } else {
      // Try generic call
      response = await (redisClient as any).ping?.();
    }
    
    const latencyMs = Date.now() - start;

    return {
      status: "healthy",
      metrics: { 
        redisAvailable: true, 
        latencyMs,
        responseTime: `${latencyMs}ms`,
        response: response || "OK"
      },
      lastCheck: new Date().toISOString(),
      performanceScore: latencyMs < 100 ? 100 : latencyMs < 500 ? 80 : 60
    };
  } catch (error) {
    return {
      status: "degraded",
      metrics: { error: error instanceof Error ? error.message : "Redis connection failed" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0
    };
  }
}

async function checkSystemHealth(): Promise<SubsystemHealth> {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = usedMem / totalMem;
    
    const cpuCount = os.cpus().length;
    const loadAvg = os.loadavg()[0]; // 1 minute load average
    const loadPerCore = loadAvg / cpuCount;
    
    let status: HealthStatus = "healthy";
    if (memoryUsage > 0.9 || loadPerCore > 1.0) {
      status = "critical";
    } else if (memoryUsage > 0.7 || loadPerCore > 0.7) {
      status = "degraded";
    }

    return {
      status,
      metrics: {
        memory: {
          total: formatBytes(totalMem),
          used: formatBytes(usedMem),
          free: formatBytes(freeMem),
          usagePercent: Math.round(memoryUsage * 100)
        },
        cpu: {
          cores: cpuCount,
          loadAverage: loadAvg.toFixed(2),
          loadPerCore: loadPerCore.toFixed(2)
        },
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch()
      },
      lastCheck: new Date().toISOString(),
      performanceScore: calculateSystemScore(memoryUsage, loadPerCore)
    };
  } catch (error) {
    return {
      status: "critical",
      metrics: { error: error instanceof Error ? error.message : "System metrics unavailable" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0
    };
  }
}

// HELPER FUNCTIONS
function calculateOverallStatus(subsystems: HealthReport['subsystems']): HealthReport['overallStatus'] {
  const statusPriority = {
    critical: 3,
    degraded: 2,
    unknown: 1,
    healthy: 0
  };

  const highestStatus = Object.values(subsystems)
    .reduce((prev, current) => 
      statusPriority[current.status] > statusPriority[prev.status] ? current : prev
    );

  switch (highestStatus.status) {
    case 'critical': return 'critical';
    case 'degraded': return 'degraded';
    default: return 'operational';
  }
}

function calculatePerformanceScore(subsystems: HealthReport['subsystems']): number {
  const scores = Object.values(subsystems).map(s => s.performanceScore);
  const validScores = scores.filter(s => !isNaN(s) && s >= 0);
  
  if (validScores.length === 0) return 0;
  return Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
}

function calculateSystemScore(memoryUsage: number, loadPerCore: number): number {
  let score = 100;
  
  // Penalize for high memory usage
  if (memoryUsage > 0.9) score -= 50;
  else if (memoryUsage > 0.8) score -= 30;
  else if (memoryUsage > 0.7) score -= 15;
  else if (memoryUsage > 0.6) score -= 5;
  
  // Penalize for high CPU load
  if (loadPerCore > 1.0) score -= 40;
  else if (loadPerCore > 0.8) score -= 25;
  else if (loadPerCore > 0.6) score -= 10;
  else if (loadPerCore > 0.4) score -= 5;
  
  return Math.max(0, score);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// For Pages Router, add this config
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
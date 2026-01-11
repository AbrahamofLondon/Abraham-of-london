/* pages/api/admin/system-health.ts - FIXED VERSION */
import type { NextApiRequest, NextApiResponse } from "next";
import os from "node:os";
import { createHash } from "node:crypto";
import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis"; // ✅ CHANGED: Named export instead of default
import { requireAdmin, requireRateLimit } from "@/lib/server/guards";
import { jsonOk, jsonErr } from "@/lib/server/http";
import { getCacheStats } from "@/lib/server/cache";
import { getDatabaseMetrics } from "@/lib/server/database";
import { getContentStats } from "@/lib/server/content";
import { getSecurityStatus } from "@/lib/server/security";
import { sendHealthAlert } from "@/lib/server/alerts";
import { HealthCheckMetrics } from "@/types/health";
import { SecurityAuditLogger } from "@/lib/security/audit";
import { PerformanceMonitor } from "@/lib/monitoring/performance";

// ✅ REMOVE OR CHANGE RUNTIME FROM EDGE TO NODEJS
// Either remove this entirely (defaults to Node.js runtime)
// OR explicitly set to Node.js runtime:
export const runtime = 'nodejs'; // Changed from 'edge' to 'nodejs'

const auditLogger = new SecurityAuditLogger();
const performanceMonitor = new PerformanceMonitor();

// Configuration
const HEALTH_CONFIG = {
  maxDatabaseLatency: 1000, // 1 second
  maxMemoryUsage: 0.9, // 90% memory usage threshold
  minDiskSpace: 1024 * 1024 * 1024, // 1GB minimum free space
  cacheThresholds: {
    hitRate: 0.8, // 80% cache hit rate minimum
    latency: 50, // 50ms max cache latency
  },
  alertThresholds: {
    warning: 0.7,
    critical: 0.9,
  },
} as const;

interface SubsystemHealth {
  status: "healthy" | "degraded" | "critical" | "unknown";
  metrics: Record<string, any>;
  lastCheck: string;
  performanceScore: number; // 0-100
}

interface HealthReport extends HealthCheckMetrics {
  timestamp: string;
  requestId: string;
  environment: string;
  version: string;
  uptime: number;
  subsystems: {
    database: SubsystemHealth;
    content: SubsystemHealth;
    cache: SubsystemHealth;
    security: SubsystemHealth;
    system: SubsystemHealth;
    network: SubsystemHealth;
  };
  overallStatus: "operational" | "degraded" | "critical" | "maintenance";
  performanceScore: number;
  recommendations?: string[];
  alerts?: {
    level: "warning" | "critical";
    message: string;
    subsystem: string;
  }[];
}

/**
 * INSTITUTIONAL SYSTEM HEALTH - ENHANCED
 * Comprehensive diagnostic report for all system layers with performance metrics,
 * security auditing, and proactive alerting.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = createHash('md5').update(`${Date.now()}-${Math.random()}`).digest('hex');
  const startTime = Date.now();

  try {
    // 1. RATE LIMITING with enhanced tracking
    const rl = await requireRateLimit(req, res, "system-health", "admin", 10); // Reduced to 10 per minute
    if (!rl.ok) {
      await auditLogger.logRateLimitExceeded({
        endpoint: "system-health",
        ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userId: "system",
      });
      return;
    }

    // 2. ADMIN AUTH with enhanced security
    const auth = await requireAdmin(req, res, { requireMfa: true });
    if (!auth.ok) {
      await auditLogger.logUnauthorizedAccess({
        endpoint: "system-health",
        userId: auth.user?.id || "unknown",
        ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        reason: auth.error,
      });
      return;
    }

    // 3. PERFORMANCE MONITORING START
    await performanceMonitor.startTransaction("system-health-check");

    // 4. COMPREHENSIVE DIAGNOSTICS (parallel execution)
    const [
      databaseHealth,
      contentHealth,
      cacheHealth,
      securityHealth,
      systemHealth,
      networkHealth,
    ] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkContentHealth(),
      checkCacheHealth(),
      checkSecurityHealth(auth.admin),
      checkSystemHealth(),
      checkNetworkHealth(),
    ]);

    // 5. AGGREGATE RESULTS
    const subsystems = {
      database: processResult(databaseHealth, "database"),
      content: processResult(contentHealth, "content"),
      cache: processResult(cacheHealth, "cache"),
      security: processResult(securityHealth, "security"),
      system: processResult(systemHealth, "system"),
      network: processResult(networkHealth, "network"),
    };

    // 6. CALCULATE OVERALL STATUS
    const overallStatus = calculateOverallStatus(subsystems);
    const performanceScore = calculatePerformanceScore(subsystems);
    const alerts = generateAlerts(subsystems);
    const recommendations = generateRecommendations(subsystems);

    // 7. PREPARE COMPREHENSIVE REPORT
    const healthReport: HealthReport = {
      timestamp: new Date().toISOString(),
      requestId,
      environment: process.env.NODE_ENV || "development",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      uptime: process.uptime(),
      subsystems,
      overallStatus,
      performanceScore,
      metrics: await gatherSystemMetrics(),
      totalChecks: Object.keys(subsystems).length,
      failedChecks: Object.values(subsystems).filter(s => s.status !== "healthy").length,
      responseTime: Date.now() - startTime,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      alerts: alerts.length > 0 ? alerts : undefined,
    };

    // 8. AUDIT LOGGING
    await auditLogger.logHealthCheck({
      requestId,
      userId: auth.admin.id,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
      status: overallStatus,
      performanceScore,
      duration: Date.now() - startTime,
      subsystemStatuses: Object.entries(subsystems).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value.status
      }), {}),
    });

    // 9. PERFORMANCE MONITORING END
    await performanceMonitor.endTransaction("system-health-check", {
      duration: Date.now() - startTime,
      status: overallStatus,
      subsystems: Object.keys(subsystems),
    });

    // 10. ALERTING FOR CRITICAL ISSUES
    if (overallStatus === "critical" || alerts.some(a => a.level === "critical")) {
      await sendHealthAlert({
        level: "critical",
        system: "platform",
        message: `System health critical: ${overallStatus}`,
        data: {
          failingSubsystems: Object.entries(subsystems)
            .filter(([_, s]) => s.status === "critical")
            .map(([name]) => name),
          performanceScore,
          requestId,
        },
      });
    }

    // 11. CACHE HEALTH REPORT (for monitoring dashboards)
    if (process.env.REDIS_URL && redis) {
      await redis.setex(`health:${requestId}`, 300, JSON.stringify(healthReport));
    }

    // 12. RESPONSE WITH SECURITY HEADERS
    res.setHeader('X-Health-Check-ID', requestId);
    res.setHeader('X-System-Status', overallStatus);
    res.setHeader('X-Performance-Score', performanceScore.toString());

    return jsonOk(res, healthReport);

  } catch (error) {
    const errorId = `err_${Date.now()}`;
    console.error(`[SYSTEM_HEALTH_CRITICAL] ${errorId}:`, error);

    // Log critical failure
    await auditLogger.logHealthCheckFailure({
      errorId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      requestId: requestId || "unknown",
      timestamp: new Date().toISOString(),
    });

    // Send emergency alert
    await sendHealthAlert({
      level: "critical",
      system: "platform",
      message: `Health check handler crashed: ${errorId}`,
      data: { errorId, error: error instanceof Error ? error.message : "Unknown" },
    });

    return jsonErr(res, 500, "SYSTEM_CHECK_FAILED", 
      `Health check failed. Reference: ${errorId}`, 
      { errorId, timestamp: new Date().toISOString() }
    );
  }
}

// ============================================================================
// SUBSYSTEM HEALTH CHECKS
// ============================================================================

async function checkDatabaseHealth(): Promise<SubsystemHealth> {
  const startTime = Date.now();
  const metrics: Record<string, any> = {};

  try {
    // Basic connectivity
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    metrics.connectivityLatency = Date.now() - dbStart;

    // Get advanced metrics if available
    const advancedMetrics = await getDatabaseMetrics();
    Object.assign(metrics, advancedMetrics);

    // Check connection pool
    const poolInfo = await prisma.$queryRaw`
      SELECT count(*) as active_connections,
             max_conn as max_connections
      FROM pg_stat_activity,
           (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') settings
      WHERE datname = current_database()
    `;
    
    if (Array.isArray(poolInfo) && poolInfo[0]) {
      metrics.connectionPool = poolInfo[0];
    }

    // Run performance benchmark
    const perfStart = Date.now();
    const testQuery = await prisma.$queryRaw`
      SELECT COUNT(*) as user_count FROM "User" WHERE "emailVerified" IS NOT NULL
    `;
    metrics.queryPerformance = Date.now() - perfStart;
    
    if (Array.isArray(testQuery) && testQuery[0]) {
      metrics.userCount = testQuery[0].user_count;
    }

    const status = metrics.connectivityLatency > HEALTH_CONFIG.maxDatabaseLatency 
      ? "degraded" 
      : "healthy";

    const performanceScore = calculateSubsystemScore([
      { value: metrics.connectivityLatency, max: HEALTH_CONFIG.maxDatabaseLatency, weight: 0.4 },
      { value: metrics.queryPerformance || 0, max: 100, weight: 0.3 },
      { value: metrics.connectionPool?.connection_utilization || 0, max: 0.8, weight: 0.3 },
    ]);

    return {
      status,
      metrics,
      lastCheck: new Date().toISOString(),
      performanceScore,
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
    const metrics: Record<string, any> = {};
    
    // Check Contentlayer (if available)
    let hydrated = false;
    let totalDocs = 0;
    let contentError: string | undefined;

    try {
      // Dynamic import to avoid build-time issues
      const contentlayerModule = await import('@/lib/contentlayer');
      hydrated = contentlayerModule.isContentlayerLoaded?.() || false;
      totalDocs = contentlayerModule.getAllDocuments?.()?.length || 0;
      
      if (contentlayerModule.getContentStats) {
        const stats = await contentlayerModule.getContentStats();
        Object.assign(metrics, stats);
      }
    } catch (error) {
      contentError = error instanceof Error ? error.message : "Content layer unavailable";
      hydrated = false;
      totalDocs = 0;
    }

    metrics.hydrated = hydrated;
    metrics.totalDocuments = totalDocs;
    metrics.contentEngine = "Contentlayer2";
    metrics.error = contentError;

    // Check file system access
    const fs = await import('node:fs');
    const path = await import('node:path');
    
    const contentDir = path.join(process.cwd(), 'content');
    try {
      const stats = fs.statSync(contentDir);
      metrics.contentDirExists = stats.isDirectory();
      metrics.contentDirSize = await getDirectorySize(contentDir);
    } catch (error) {
      metrics.contentDirExists = false;
      metrics.contentDirError = error instanceof Error ? error.message : "Directory not found";
    }

    const status = hydrated && totalDocs > 0 ? "healthy" : contentError ? "critical" : "degraded";

    const performanceScore = calculateSubsystemScore([
      { value: hydrated ? 1 : 0, max: 1, weight: 0.4 },
      { value: totalDocs, max: 100, weight: 0.3, invert: true }, // More docs is better
      { value: metrics.contentDirExists ? 1 : 0, max: 1, weight: 0.3 },
    ]);

    return {
      status,
      metrics,
      lastCheck: new Date().toISOString(),
      performanceScore,
    };
  } catch (error) {
    return {
      status: "critical",
      metrics: { error: error instanceof Error ? error.message : "Content system error" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0,
    };
  }
}

async function checkCacheHealth(): Promise<SubsystemHealth> {
  const metrics: Record<string, any> = {};
  
  try {
    // Check Redis if configured
    if (process.env.REDIS_URL) {
      const startTime = Date.now();
      if (redis) {
        await redis.ping();
        metrics.redisLatency = Date.now() - startTime;
        metrics.redisConnected = true;

        // Get Redis info
        const info = await redis.info();
        metrics.redisInfo = {
          version: info.split('\n').find(line => line.startsWith('redis_version'))?.split(':')[1]?.trim(),
          uptime: info.split('\n').find(line => line.startsWith('uptime_in_seconds'))?.split(':')[1]?.trim(),
          memory: info.split('\n').find(line => line.startsWith('used_memory_human'))?.split(':')[1]?.trim(),
        };
      } else {
        metrics.redisConnected = false;
        metrics.redisError = "Redis client not available";
      }
    } else {
      metrics.redisConnected = false;
      metrics.redisNotConfigured = true;
    }

    // Check in-memory cache
    const cacheStats = getCacheStats();
    Object.assign(metrics, cacheStats);

    // Calculate cache efficiency
    const hitRate = cacheStats.hitRate || 0;
    const latency = metrics.redisLatency || 0;

    const status = hitRate < HEALTH_CONFIG.cacheThresholds.hitRate 
      ? "degraded" 
      : latency > HEALTH_CONFIG.cacheThresholds.latency 
        ? "degraded" 
        : "healthy";

    const performanceScore = calculateSubsystemScore([
      { value: hitRate, max: 1, weight: 0.5 },
      { value: latency, max: HEALTH_CONFIG.cacheThresholds.latency, weight: 0.3 },
      { value: metrics.redisConnected ? 1 : 0, max: 1, weight: 0.2 },
    ]);

    return {
      status,
      metrics,
      lastCheck: new Date().toISOString(),
      performanceScore,
    };
  } catch (error) {
    return {
      status: "critical",
      metrics: { error: error instanceof Error ? error.message : "Cache system error" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0,
    };
  }
}

async function checkSecurityHealth(admin: any): Promise<SubsystemHealth> {
  try {
    const metrics = await getSecurityStatus();
    
    // Add admin-specific metrics
    metrics.adminMethod = admin?.method || "unknown";
    metrics.adminPermissions = admin?.permissions || [];
    metrics.lastSecurityScan = new Date().toISOString();

    // Check environment security
    metrics.envVarsSecured = Boolean(process.env.INNER_CIRCLE_JWT_SECRET);
    metrics.httpsEnabled = process.env.NODE_ENV === "production";
    metrics.corsConfigured = Boolean(process.env.ALLOWED_ORIGINS);

    // Calculate security score
    const securityChecks = [
      metrics.envVarsSecured,
      metrics.httpsEnabled,
      metrics.corsConfigured,
      metrics.rateLimitingEnabled,
      metrics.auditLoggingEnabled,
    ].filter(Boolean).length;

    const securityScore = (securityChecks / 5) * 100;

    const status = securityScore >= 80 ? "healthy" : securityScore >= 50 ? "degraded" : "critical";

    return {
      status,
      metrics,
      lastCheck: new Date().toISOString(),
      performanceScore: securityScore,
    };
  } catch (error) {
    return {
      status: "critical",
      metrics: { error: error instanceof Error ? error.message : "Security check failed" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0,
    };
  }
}

async function checkSystemHealth(): Promise<SubsystemHealth> {
  const metrics: Record<string, any> = {};

  try {
    // CPU Usage
    const cpus = os.cpus();
    metrics.cpu = {
      cores: cpus.length,
      model: cpus[0]?.model,
      usage: process.cpuUsage(),
    };

    // Memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = usedMem / totalMem;

    metrics.memory = {
      total: formatBytes(totalMem),
      used: formatBytes(usedMem),
      free: formatBytes(freeMem),
      usage: Math.round(memoryUsage * 100),
    };

    // Disk Space
    const disk = await checkDiskSpace();
    Object.assign(metrics, disk);

    // Process Info
    metrics.process = {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
    };

    // Platform Info
    metrics.platform = {
      type: os.type(),
      release: os.release(),
      arch: os.arch(),
      hostname: os.hostname(),
    };

    // Determine status
    const status = memoryUsage > HEALTH_CONFIG.maxMemoryUsage 
      ? "critical" 
      : disk.freeBytes < HEALTH_CONFIG.minDiskSpace 
        ? "critical" 
        : "healthy";

    const performanceScore = calculateSubsystemScore([
      { value: memoryUsage, max: HEALTH_CONFIG.maxMemoryUsage, weight: 0.4 },
      { value: disk.freeBytes, max: HEALTH_CONFIG.minDiskSpace * 2, weight: 0.3 },
      { value: metrics.cpu.cores > 2 ? 1 : 0, max: 1, weight: 0.1 },
      { value: metrics.process.uptime > 3600 ? 1 : 0, max: 1, weight: 0.2 }, // > 1 hour
    ]);

    return {
      status,
      metrics,
      lastCheck: new Date().toISOString(),
      performanceScore,
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

async function checkNetworkHealth(): Promise<SubsystemHealth> {
  const metrics: Record<string, any> = {};

  try {
    // Network interfaces
    const interfaces = os.networkInterfaces();
    metrics.networkInterfaces = Object.entries(interfaces).reduce((acc, [name, iface]) => {
      if (iface) {
        acc[name] = iface.map(i => ({
          address: i.address,
          netmask: i.netmask,
          family: i.family,
          internal: i.internal,
        }));
      }
      return acc;
    }, {} as Record<string, any>);

    // External connectivity check (non-blocking)
    metrics.externalConnectivity = await checkExternalConnectivity();

    // Load average
    const loadAvg = os.loadavg();
    metrics.loadAverage = {
      '1min': loadAvg[0],
      '5min': loadAvg[1],
      '15min': loadAvg[2],
    };

    const status = metrics.externalConnectivity ? "healthy" : "degraded";

    const performanceScore = calculateSubsystemScore([
      { value: metrics.externalConnectivity ? 1 : 0, max: 1, weight: 0.5 },
      { value: 1 - (loadAvg[0] / os.cpus().length), max: 1, weight: 0.3 }, // Normalized load
      { value: Object.keys(interfaces).length > 0 ? 1 : 0, max: 1, weight: 0.2 },
    ]);

    return {
      status,
      metrics,
      lastCheck: new Date().toISOString(),
      performanceScore,
    };
  } catch (error) {
    return {
      status: "degraded",
      metrics: { error: error instanceof Error ? error.message : "Network check failed" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function processResult(result: PromiseSettledResult<SubsystemHealth>, subsystem: string): SubsystemHealth {
  if (result.status === "fulfilled") {
    return result.value;
  } else {
    return {
      status: "critical",
      metrics: { error: result.reason instanceof Error ? result.reason.message : "Unknown error" },
      lastCheck: new Date().toISOString(),
      performanceScore: 0,
    };
  }
}

function calculateOverallStatus(subsystems: HealthReport['subsystems']): HealthReport['overallStatus'] {
  const statuses = Object.values(subsystems).map(s => s.status);
  
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("degraded")) return "degraded";
  if (statuses.every(s => s === "healthy")) return "operational";
  
  return "degraded";
}

function calculatePerformanceScore(subsystems: HealthReport['subsystems']): number {
  const scores = Object.values(subsystems)
    .map(s => s.performanceScore)
    .filter(score => !isNaN(score));
  
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function calculateSubsystemScore(metrics: Array<{
  value: number;
  max: number;
  weight: number;
  invert?: boolean;
}>): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const metric of metrics) {
    let normalizedScore = metric.value / metric.max;
    if (normalizedScore > 1) normalizedScore = 1;
    if (metric.invert) normalizedScore = 1 - normalizedScore;
    
    totalScore += normalizedScore * metric.weight * 100;
    totalWeight += metric.weight;
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

function generateAlerts(subsystems: HealthReport['subsystems']): HealthReport['alerts'] {
  const alerts: HealthReport['alerts'] = [];

  for (const [name, subsystem] of Object.entries(subsystems)) {
    if (subsystem.status === "critical") {
      alerts.push({
        level: "critical",
        message: `${name} subsystem is in critical state`,
        subsystem: name,
      });
    } else if (subsystem.status === "degraded") {
      alerts.push({
        level: "warning",
        message: `${name} subsystem is degraded`,
        subsystem: name,
      });
    }
  }

  return alerts;
}

function generateRecommendations(subsystems: HealthReport['subsystems']): string[] {
  const recommendations: string[] = [];

  // Database recommendations
  if (subsystems.database.status === "degraded") {
    if (subsystems.database.metrics.connectivityLatency > 500) {
      recommendations.push("Consider database connection pool optimization");
    }
    if (subsystems.database.metrics.connectionPool?.connection_utilization > 0.8) {
      recommendations.push("Increase database connection pool size");
    }
  }

  // Memory recommendations
  if (subsystems.system.metrics.memory?.usage > 80) {
    recommendations.push("Consider increasing server memory or optimizing memory usage");
  }

  // Disk recommendations
  if (subsystems.system.metrics.freeBytes < HEALTH_CONFIG.minDiskSpace * 2) {
    recommendations.push("Free up disk space or increase storage capacity");
  }

  // Cache recommendations
  if (subsystems.cache.metrics.hitRate < HEALTH_CONFIG.cacheThresholds.hitRate) {
    recommendations.push("Review and optimize cache strategies");
  }

  return recommendations;
}

async function gatherSystemMetrics(): Promise<HealthCheckMetrics> {
  return {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    activeRequests: performanceMonitor.getActiveTransactions(),
    totalChecks: 6,
    failedChecks: 0, // Will be calculated by handler
    responseTime: 0, // Will be set by handler
  };
}

async function getDirectorySize(dir: string): Promise<number> {
  const fs = await import('node:fs');
  const path = await import('node:path');
  
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    console.error(`Error calculating directory size for ${dir}:`, error);
  }
  
  return totalSize;
}

async function checkDiskSpace(): Promise<Record<string, any>> {
  try {
    const { execSync } = await import('node:child_process');
    
    if (os.platform() === 'win32') {
      const output = execSync('wmic logicaldisk get size,freespace,caption').toString();
      // Parse Windows output
      return { platform: 'windows', rawOutput: output };
    } else {
      const output = execSync('df -k /').toString();
      const lines = output.trim().split('\n');
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        return {
          totalBytes: parseInt(parts[1]) * 1024,
          usedBytes: parseInt(parts[2]) * 1024,
          freeBytes: parseInt(parts[3]) * 1024,
          usage: parseInt(parts[4].replace('%', '')),
        };
      }
    }
  } catch (error) {
    console.error('Disk space check failed:', error);
  }
  
  return { error: "Disk space check unavailable" };
}

async function checkExternalConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://www.google.com', {
      signal: controller.signal,
      method: 'HEAD',
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    return false;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
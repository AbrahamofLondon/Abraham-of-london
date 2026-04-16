// pages/api/health.ts - Production Health Check with Monitoring
import type { NextApiRequest, NextApiResponse } from 'next';
import { getRedis } from '@/lib/redis';

// Types for health check responses
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
type ServiceStatus = {
  status: HealthStatus;
  latency?: number;
  message?: string;
};

type HealthResponse = {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    api: ServiceStatus;
    database: ServiceStatus;
    redis: ServiceStatus;
    contentlayer: ServiceStatus;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    system: {
      nodeVersion: string;
      platform: string;
      arch: string;
      cpus: number;
      loadAvg: number[];
      freeMemory: number;
      totalMemory: number;
    };
  };
  metadata: {
    app: string;
    region?: string;
    deploymentId?: string;
    buildId?: string;
    cached?: boolean;
    cacheAge?: number;
    responseTime?: number;
  };
};

// Cache health check results for 30 seconds
let cachedHealthCheck: HealthResponse | null = null;
let lastCheckTime = 0;
const CACHE_DURATION = 30000;

// Rate limiting for health checks
const healthCheckCounts = new Map<string, { count: number; lastReset: number }>();
const MAX_CHECKS_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW = 60000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientIp = req.headers['x-forwarded-for']?.[0] || req.socket.remoteAddress || 'unknown';
  
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      status: 'unhealthy',
      error: 'Rate limit exceeded',
      message: 'Too many health check requests'
    });
  }

  try {
    const now = Date.now();
    if (cachedHealthCheck && (now - lastCheckTime) < CACHE_DURATION) {
      cachedHealthCheck.metadata.cached = true;
      cachedHealthCheck.metadata.cacheAge = now - lastCheckTime;
      return respondWithHealth(res, cachedHealthCheck);
    }

    const startTime = Date.now();
    
    // ✅ Parallel Execution of all checks
    const [
      apiStatus,
      dbStatus,
      redisStatus,
      contentlayerStatus,
    ] = await Promise.allSettled([
      checkApiStatus(),
      checkDatabaseConnection(),
      checkRedisConnection(),
      checkContentlayerStatus(),
    ]);

    const latency = Date.now() - startTime;

    const serviceStatuses = [apiStatus, dbStatus, redisStatus, contentlayerStatus];

    const isDegraded = serviceStatuses.some(
      s => s.status === 'fulfilled' && s.value.status === 'degraded'
    );
    const isUnhealthy = serviceStatuses.some(
      s => s.status === 'rejected' || (s.status === 'fulfilled' && s.value.status === 'unhealthy')
    );

    const overallStatus: HealthStatus = isUnhealthy 
      ? 'unhealthy' 
      : isDegraded 
        ? 'degraded' 
        : 'healthy';

    const healthResponse: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      checks: {
        api: apiStatus.status === 'fulfilled' ? apiStatus.value : { status: 'unhealthy', message: 'API check failed' },
        database: dbStatus.status === 'fulfilled' ? dbStatus.value : { status: 'unhealthy', message: 'Database check failed' },
        redis: redisStatus.status === 'fulfilled' ? redisStatus.value : { status: 'unhealthy', message: 'Redis check failed' },
        contentlayer: contentlayerStatus.status === 'fulfilled' ? contentlayerStatus.value : { status: 'unhealthy', message: 'Contentlayer check failed' },
        memory: process.memoryUsage(),
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          cpus: require('os').cpus().length,
          loadAvg: require('os').loadavg(),
          freeMemory: require('os').freemem(),
          totalMemory: require('os').totalmem(),
        },
      },
      metadata: {
        app: 'Abraham of London',
        region: process.env.VERCEL_REGION || process.env.AWS_REGION || 'local',
        deploymentId: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA,
        buildId: process.env.NEXT_PUBLIC_BUILD_ID,
        responseTime: latency,
      },
    };

    cachedHealthCheck = healthResponse;
    lastCheckTime = now;

    return respondWithHealth(res, healthResponse);

  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// --- HELPER FUNCTIONS ---

function respondWithHealth(res: NextApiResponse, health: HealthResponse) {
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 206 : 503;

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('X-Health-Check', 'true');
  res.setHeader('X-Response-Time', health.metadata.responseTime?.toString() || '0');
  res.setHeader('X-Service-Status', health.status);

  return res.status(statusCode).json(health);
}

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const clientData = healthCheckCounts.get(clientIp);
  if (!clientData || (now - clientData.lastReset) > RATE_LIMIT_WINDOW) {
    healthCheckCounts.set(clientIp, { count: 1, lastReset: now });
    return true;
  }
  if (clientData.count >= MAX_CHECKS_PER_MINUTE) return false;
  clientData.count++;
  return true;
}

async function checkApiStatus(): Promise<ServiceStatus> {
  const start = Date.now();
  return { status: 'healthy', latency: Date.now() - start };
}

async function checkDatabaseConnection(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const dbModule = await import('@/lib/db');
    const checkFn = dbModule.checkDatabaseConnection || (() => Promise.resolve({ connected: false }));
    const result = await checkFn();
    return {
      status: result.connected ? 'healthy' : 'degraded',
      message: result.connected ? undefined : `Database: ${result.error || 'Not connected'}`,
      latency: Date.now() - start,
    };
  } catch (error) {
    return { status: 'degraded', message: 'Database check unavailable', latency: Date.now() - start };
  }
}

async function checkRedisConnection(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const redis = await getRedis();
    if (!redis) return { status: 'degraded', message: 'Redis not configured', latency: Date.now() - start };
    await redis.ping();
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', message: 'Redis connection failed', latency: Date.now() - start };
  }
}

/**
 * ✅ CHECK CONTENTLAYER STATUS
 * Verifies that the generated content manifest is present and contains documents.
 */
async function checkContentlayerStatus(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Route through the per-kind helper — avoids bundling the full
    // contentlayer barrel into the health endpoint's chunk.
    const { getAllContentlayerDocs } = await import("@/lib/contentlayer-helper");
    const allDocuments = getAllContentlayerDocs() || [];

    if (!allDocuments || allDocuments.length === 0) {
      return {
        status: 'degraded',
        message: 'Contentlayer: No documents found in manifest',
        latency: Date.now() - start,
      };
    }

    return {
      status: 'healthy',
      message: `Contentlayer: ${allDocuments.length} documents verified`,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Contentlayer: Manifest missing or inaccessible',
      latency: Date.now() - start,
    };
  }
}

export const config = {
  runtime: 'nodejs',
  api: { responseLimit: false, bodyParser: false },
};
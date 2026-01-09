// pages/api/health.ts - Production Health Check with Monitoring
import type { NextApiRequest, NextApiResponse } from 'next';
import { getRedis } from '@/lib/redis'; // Changed from getRedisClient to getRedis

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
const CACHE_DURATION = 30000; // 30 seconds

// Rate limiting for health checks
const healthCheckCounts = new Map<string, { count: number; lastReset: number }>();
const MAX_CHECKS_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientIp = req.headers['x-forwarded-for']?.[0] || req.socket.remoteAddress || 'unknown';
  
  // Apply rate limiting
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      status: 'unhealthy',
      error: 'Rate limit exceeded',
      message: 'Too many health check requests'
    });
  }

  try {
    // Check for cache
    const now = Date.now();
    if (cachedHealthCheck && (now - lastCheckTime) < CACHE_DURATION) {
      // Add cache indicator
      cachedHealthCheck.metadata.cached = true;
      cachedHealthCheck.metadata.cacheAge = now - lastCheckTime;
      return respondWithHealth(res, cachedHealthCheck);
    }

    // Run health checks in parallel
    const startTime = Date.now();
    
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

    // Determine overall status
    const serviceStatuses = [
      apiStatus,
      dbStatus,
      redisStatus,
      contentlayerStatus,
    ];

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

    // Build response
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

    // Cache the response
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

// Helper functions
function respondWithHealth(res: NextApiResponse, health: HealthResponse) {
  // Set appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 206 : 503;

  // Security headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Health-Check', 'true');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // Add monitoring headers
  res.setHeader('X-Response-Time', health.metadata.responseTime?.toString() || '0');
  res.setHeader('X-Service-Status', health.status);
  res.setHeader('X-Environment', health.environment);

  // Return response
  return res.status(statusCode).json(health);
}

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const clientData = healthCheckCounts.get(clientIp);

  if (!clientData || (now - clientData.lastReset) > RATE_LIMIT_WINDOW) {
    healthCheckCounts.set(clientIp, { count: 1, lastReset: now });
    return true;
  }

  if (clientData.count >= MAX_CHECKS_PER_MINUTE) {
    return false;
  }

  clientData.count++;
  return true;
}

async function checkApiStatus(): Promise<ServiceStatus> {
  const start = Date.now();
  
  try {
    // Simple self-check
    await Promise.resolve();
    
    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'API self-check failed',
      latency: Date.now() - start,
    };
  }
}

async function checkDatabaseConnection(): Promise<ServiceStatus> {
  const start = Date.now();
  
  try {
    // Try dynamic import
    const dbModule = await import('@/lib/db');
    const checkFn = dbModule.checkDatabaseConnection || (() => Promise.resolve({ connected: false, type: 'memory' }));
    const result = await checkFn();
    
    return {
      status: result.connected ? 'healthy' : 'degraded',
      message: result.connected ? undefined : `Database: ${result.error || 'Not connected'}`,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'degraded', // Not unhealthy because app can run without DB
      message: 'Database check module not available',
      latency: Date.now() - start,
    };
  }
}

async function checkRedisConnection(): Promise<ServiceStatus> {
  const start = Date.now();
  
  try {
    const redis = await getRedis();
    
    if (!redis) {
      return {
        status: 'degraded',
        message: 'Redis not configured',
        latency: Date.now() - start,
      };
    }

    await redis.ping();
    
    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Redis connection failed',
      latency: Date.now() - start,
    };
  }
}

// Optional: Liveness and readiness endpoints
export const config = {
  runtime: 'nodejs', // Use Node.js runtime for health checks
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};

// Separate liveness endpoint (simple)
export async function livenessHandler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

// Separate readiness endpoint (checks dependencies)
export async function readinessHandler(req: NextApiRequest, res: NextApiResponse) {
  const [dbReady, redisReady] = await Promise.allSettled([
    checkDatabaseConnection(),
    checkRedisConnection(),
  ]);

  const isReady = dbReady.status === 'fulfilled' && redisReady.status === 'fulfilled';

  res.setHeader('Cache-Control', 'no-cache');
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbReady.status === 'fulfilled' ? 'ready' : 'not ready',
      redis: redisReady.status === 'fulfilled' ? 'ready' : 'not ready',
    },
  });
}
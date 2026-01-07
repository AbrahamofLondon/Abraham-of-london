/* pages/api/inner-circle/health.ts */
import type { NextApiRequest, NextApiResponse } from 'next';
import { healthCheckEnhanced, INNER_CIRCLE_CONFIG } from '@/lib/inner-circle';

type HealthResponse = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: { status: 'up' | 'down' | 'degraded'; latency?: number };
    redis: { status: 'up' | 'down' | 'degraded'; available: boolean };
    rateLimiting: { 
      status: 'up' | 'down' | 'degraded'; 
      storage: 'redis' | 'memory';
      enabled: boolean;
    };
    email: { status: 'up' | 'down' | 'degraded'; available: boolean };
  };
  metrics?: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    totalMembers: number;
    totalKeys: number;
    rateLimitBuckets?: number;
  };
  errors?: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: 'down' },
        redis: { status: 'down', available: false },
        rateLimiting: { status: 'down', storage: 'memory', enabled: false },
        email: { status: 'down', available: false },
      },
      errors: ['Method not allowed']
    });
  }

  const errors: string[] = [];
  const timestamp = new Date().toISOString();

  try {
    const health = await healthCheckEnhanced();
    
    // Check individual services
    const services = {
      database: { 
        status: health.database === 'ok' ? 'up' : 'down' 
      } as const,
      redis: { 
        status: INNER_CIRCLE_CONFIG.redisAvailable ? 'up' : 'down',
        available: INNER_CIRCLE_CONFIG.redisAvailable,
      },
      rateLimiting: {
        status: health.rateLimiting?.enabled ? 'up' : 'degraded',
        storage: health.rateLimiting?.storage || 'memory',
        enabled: health.rateLimiting?.enabled || false,
      },
      email: {
        status: INNER_CIRCLE_CONFIG.emailAvailable ? 'up' : 'degraded',
        available: INNER_CIRCLE_CONFIG.emailAvailable,
      },
    };

    // Collect errors
    if (health.database !== 'ok') errors.push('Database connection issue');
    if (!INNER_CIRCLE_CONFIG.redisAvailable) errors.push('Redis not available');
    if (!INNER_CIRCLE_CONFIG.emailAvailable) errors.push('Email service not available');

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (services.database.status === 'down') status = 'unhealthy';
    else if (errors.length > 0) status = 'degraded';

    const metrics = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      totalMembers: health.totalMembers || 0,
      totalKeys: health.totalKeys || 0,
      rateLimitBuckets: health.rateLimiting?.stats?.totalBuckets,
    };

    return res.status(status === 'unhealthy' ? 500 : 200).json({
      status,
      timestamp,
      services,
      metrics,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('[InnerCircle] Health check error:', error);
    
    return res.status(500).json({
      status: 'unhealthy',
      timestamp,
      services: {
        database: { status: 'down' },
        redis: { status: 'down', available: false },
        rateLimiting: { status: 'down', storage: 'memory', enabled: false },
        email: { status: 'down', available: false },
      },
      errors: ['Health check failed', error.message],
    });
  }
}
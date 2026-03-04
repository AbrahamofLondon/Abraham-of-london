// lib/redis-enhanced/redis-enhanced.edge.ts
// Edge-compatible Redis client

// For edge runtime, we need a different approach
// This is a mock/facade that will be replaced by the actual implementation
// based on the runtime environment

import Redis from 'ioredis';

// Determine if we're in edge runtime
const isEdgeRuntime = typeof EdgeRuntime !== 'undefined';

// Create a Redis client factory
function createRedisClient() {
  if (isEdgeRuntime) {
    // For edge runtime, we'd use a different client like @upstash/redis
    // This is a placeholder - you'll need to install and configure @upstash/redis
    console.warn('Edge runtime detected - using mock Redis client');
    
    // Return a mock client that logs warnings
    return {
      get: async (key: string) => {
        console.warn(`Redis get called in edge runtime for key: ${key}`);
        return null;
      },
      set: async (key: string, value: any) => {
        console.warn(`Redis set called in edge runtime for key: ${key}`);
        return 'OK';
      },
      setex: async (key: string, seconds: number, value: any) => {
        console.warn(`Redis setex called in edge runtime for key: ${key}`);
        return 'OK';
      },
      del: async (key: string) => {
        console.warn(`Redis del called in edge runtime for key: ${key}`);
        return 1;
      },
      incr: async (key: string) => {
        console.warn(`Redis incr called in edge runtime for key: ${key}`);
        return 1;
      },
      expire: async (key: string, seconds: number) => {
        console.warn(`Redis expire called in edge runtime for key: ${key}`);
        return 1;
      },
      on: () => {},
      quit: async () => 'OK',
    };
  } else {
    // For Node.js runtime, use ioredis
    return new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }
}

const redis = createRedisClient();

export default redis;
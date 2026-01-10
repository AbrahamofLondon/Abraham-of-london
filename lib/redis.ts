// lib/redis.ts - CONDITIONAL IMPORTS
let redisClient: any = null;
let redisPromise: Promise<any> | null = null;

if (typeof window === 'undefined') {
  // Server-side: use ioredis
  const Redis = require('ioredis');
  
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisClient.on('error', (err: Error) => {
    console.error('[Redis] Error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected');
  });

  redisPromise = Promise.resolve(redisClient);
} else {
  // Client-side: use a mock/stub
  redisClient = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    quit: async () => 'OK',
    on: () => redisClient,
  };
  
  redisPromise = Promise.resolve(redisClient);
}

export { redisClient, redisPromise };
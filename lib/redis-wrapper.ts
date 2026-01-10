// lib/redis-wrapper.ts
let redisClient: any = null;

if (typeof window === 'undefined') {
  // Server-side only
  const Redis = require('ioredis');
  redisClient = new Redis(process.env.REDIS_URL);
} else {
  // Client-side stub
  redisClient = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve('OK'),
    on: () => ({})
  };
}

export default redisClient;
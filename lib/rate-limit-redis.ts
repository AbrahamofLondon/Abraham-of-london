// lib/rate-limit-redis.ts - Production Redis Rate Limiter
import redis, { createNamespacedClient } from './redis-enhanced';

export interface RedisRateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  blockDuration?: number;
  useRedis?: boolean;
}

export interface RedisRateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  blocked?: boolean;
  blockUntil?: number;
}

class RedisRateLimiter {
  private client: any;
  private namespace: string;

  constructor(namespace: string = 'rate-limit') {
    this.namespace = namespace;
    this.client = createNamespacedClient(namespace);
  }

  async check(key: string, config: RedisRateLimitConfig): Promise<RedisRateLimitResult> {
    const now = Date.now();
    const windowMs = config.windowMs;
    const max = config.max;
    const keyPrefix = config.keyPrefix || 'rl';
    const blockDuration = config.blockDuration || 0;
    
    const redisKey = `${keyPrefix}:${key}`;
    const blockKey = `${keyPrefix}:block:${key}`;
    
    // Check permanent block
    const isBlocked = await this.client.get(blockKey);
    if (isBlocked === '1') {
      return {
        allowed: false,
        remaining: 0,
        limit: max,
        resetAt: now + windowMs,
        blocked: true,
        blockUntil: now + 365 * 24 * 60 * 60 * 1000,
      };
    }
    
    // Get current bucket
    const bucketData = await this.client.get(redisKey);
    let bucket = bucketData ? JSON.parse(bucketData) : null;
    
    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: now + windowMs,
        firstRequestAt: now,
      };
    }
    
    // Check temporary block
    if (bucket.blockUntil && bucket.blockUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        limit: max,
        resetAt: bucket.resetAt,
        blocked: true,
        blockUntil: bucket.blockUntil,
      };
    }
    
    bucket.count += 1;
    await this.client.setex(
      redisKey,
      Math.ceil((bucket.resetAt - now) / 1000),
      JSON.stringify(bucket)
    );
    
    const allowed = bucket.count <= max;
    
    // Apply temporary block if limit exceeded
    if (!allowed && blockDuration && !bucket.blockUntil) {
      bucket.blockUntil = now + blockDuration;
      await this.client.setex(
        redisKey,
        Math.ceil((bucket.resetAt - now) / 1000),
        JSON.stringify(bucket)
      );
    }
    
    // Apply permanent block if configured
    if (!allowed && config.blockDuration === -1) {
      await this.client.set(blockKey, '1');
    }
    
    return {
      allowed,
      remaining: Math.max(max - bucket.count, 0),
      limit: max,
      resetAt: bucket.resetAt,
      blocked: !!bucket.blockUntil && bucket.blockUntil > now,
      blockUntil: bucket.blockUntil,
    };
  }

  async reset(key: string): Promise<boolean> {
    const keys = await this.client.keys(`${this.namespace}:*:${key}`);
    const blockKey = await this.client.keys(`${this.namespace}:*:block:${key}`);
    
    const allKeys = [...keys, ...blockKey];
    const results = await Promise.all(allKeys.map(k => 
      this.client.getClient().del(k.replace(`${this.namespace}:`, ''))
    ));
    
    return results.some(r => r);
  }

  async getStats() {
    const keys = await this.client.keys('*');
    const ping = await this.client.ping();
    
    return {
      namespace: this.namespace,
      totalKeys: keys.length,
      status: ping === 'PONG' ? 'connected' : 'disconnected',
      ping,
    };
  }
}

// Export singleton instances
export const rateLimitRedis = new RedisRateLimiter('rate-limit');
export const authRateLimitRedis = new RedisRateLimiter('auth-rate-limit');
export const apiRateLimitRedis = new RedisRateLimiter('api-rate-limit');

export default {
  rateLimitRedis,
  authRateLimitRedis,
  apiRateLimitRedis,
  RedisRateLimiter,
};
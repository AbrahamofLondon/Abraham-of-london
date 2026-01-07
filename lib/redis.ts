// lib/redis.ts - Completely dependency-free Redis stub
export interface RedisStats {
  connected: boolean;
  memory: Record<string, any>;
  clients: number;
  keys: number;
  uptime: number;
}

export interface RedisOptions {
  url?: string;
  maxRetries?: number;
  connectTimeout?: number;
  lazyConnect?: boolean;
}

class RedisClient {
  private isConnected = false;
  private isEnabled: boolean;
  private options: RedisOptions;
  private memoryStore = new Map<string, { value: string; expiresAt?: number }>();

  constructor(options: RedisOptions = {}) {
    this.isEnabled = !!process.env.REDIS_URL;
    this.options = {
      url: process.env.REDIS_URL,
      maxRetries: 3,
      connectTimeout: 10000,
      lazyConnect: true,
      ...options
    };
    
    // Auto-connect if enabled
    if (this.isEnabled && !this.options.lazyConnect) {
      this.connect();
    }
  }

  async connect(): Promise<void> {
    if (!this.isEnabled) {
      console.log('Redis disabled - no REDIS_URL configured');
      this.isConnected = false;
      return;
    }

    try {
      // Simulate connection attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      this.isConnected = true;
      console.log('Redis memory store initialized');
    } catch (error) {
      console.warn('Redis connection failed, using memory store:', error);
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const entry = this.memoryStore.get(key);
      
      if (!entry) {
        return null;
      }

      // Check if expired
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.memoryStore.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setex(key: string, ttl: number, value: string): Promise<boolean> {
    try {
      const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : undefined;
      this.memoryStore.set(key, { value, expiresAt });
      return true;
    } catch (error) {
      console.error('Redis setex error:', error);
      return false;
    }
  }

  async set(key: string, value: string): Promise<boolean> {
    try {
      this.memoryStore.set(key, { value });
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      return this.memoryStore.delete(key);
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async ping(): Promise<string> {
    return this.isConnected ? 'PONG' : '';
  }

  async getStats(): Promise<RedisStats> {
    const now = Date.now();
    const expiredKeys = Array.from(this.memoryStore.entries())
      .filter(([_, entry]) => entry.expiresAt && entry.expiresAt < now)
      .map(([key]) => key);

    // Clean up expired keys
    expiredKeys.forEach(key => this.memoryStore.delete(key));

    return {
      connected: this.isConnected,
      memory: {
        used_memory: this.memoryStore.size * 100, // Rough estimate
        maxmemory: 0,
        memory_fragmentation_ratio: 1.0
      },
      clients: 1,
      keys: this.memoryStore.size,
      uptime: Date.now() - (globalThis as any).__redis_start_time__ || Date.now()
    };
  }

  async keys(pattern: string): Promise<string[]> {
    const allKeys = Array.from(this.memoryStore.keys());
    
    // Simple pattern matching (supports * wildcard)
    if (pattern === '*') {
      return allKeys;
    }
    
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return allKeys.filter(key => regex.test(key));
    }
    
    return allKeys.filter(key => key === pattern);
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map(key => this.get(key)));
  }

  async quit(): Promise<void> {
    this.isConnected = false;
    this.memoryStore.clear();
  }

  isAvailable(): boolean {
    return this.isEnabled && this.isConnected;
  }

  // Additional helper methods
  async exists(key: string): Promise<boolean> {
    return this.memoryStore.has(key);
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = current ? parseInt(current, 10) + 1 : 1;
    await this.set(key, value.toString());
    return value;
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const entry = this.memoryStore.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttl * 1000;
      return true;
    }
    return false;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.memoryStore.get(key);
    if (!entry || !entry.expiresAt) {
      return -1; // No expire time
    }
    
    const remaining = Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    return remaining;
  }
}

// Singleton instance with lazy initialization
let redisInstance: RedisClient | null = null;

function getRedisClient(): RedisClient {
  if (!redisInstance) {
    redisInstance = new RedisClient();
    // Set start time for uptime calculation
    (globalThis as any).__redis_start_time__ = Date.now();
    
    // Auto-connect
    redisInstance.connect().catch(console.error);
  }
  return redisInstance;
}

// Export the singleton instance
const redis = getRedisClient();
export default redis;

// Also export the class for testing or custom instances
export { RedisClient };
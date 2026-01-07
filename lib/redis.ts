// lib/redis-enhanced.ts
export interface RedisStats {
  connected: boolean;
  mode: 'memory' | 'redis';
  memory: {
    used_memory: number;
    peak_memory: number;
    maxmemory: number;
    fragmentation: number;
  };
  clients: number;
  keys: number;
  uptime: number;
  hitRate: number;
  operations: {
    get: number;
    set: number;
    del: number;
    hits: number;
    misses: number;
  };
}

export interface RedisOptions {
  url?: string;
  maxRetries?: number;
  connectTimeout?: number;
  lazyConnect?: boolean;
  maxMemory?: number; // Max memory in bytes (0 = unlimited)
  cleanupInterval?: number; // Auto-cleanup interval in ms
  persistToDisk?: boolean; // Experimental: persist to localStorage in browser
}

interface RedisEntry {
  value: string;
  expiresAt?: number;
  createdAt: number;
  lastAccessed?: number;
  accessCount: number;
}

class EnhancedRedisClient {
  private isConnected = false;
  private isEnabled: boolean;
  private options: Required<RedisOptions>;
  private memoryStore = new Map<string, RedisEntry>();
  private stats = {
    get: 0,
    set: 0,
    del: 0,
    hits: 0,
    misses: 0,
    startTime: Date.now(),
    peakMemory: 0,
  };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private subscribers = new Map<string, Set<(channel: string, message: string) => void>>();

  constructor(options: RedisOptions = {}) {
    this.isEnabled = !!process.env.REDIS_URL;
    this.options = {
      url: process.env.REDIS_URL,
      maxRetries: 3,
      connectTimeout: 10000,
      lazyConnect: true,
      maxMemory: 0, // 0 = unlimited
      cleanupInterval: 30000, // 30 seconds
      persistToDisk: false,
      ...options
    };
    
    // Initialize persistent storage if enabled
    if (this.options.persistToDisk && typeof window !== 'undefined') {
      this.loadFromLocalStorage();
    }
    
    // Auto-connect if enabled
    if (this.isEnabled && !this.options.lazyConnect) {
      this.connect();
    }
    
    // Start cleanup interval
    this.startCleanup();
  }

  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
      this.enforceMemoryLimit();
    }, this.options.cleanupInterval);
    
    // Cleanup on exit
    if (typeof process !== 'undefined') {
      process.on('SIGTERM', () => this.quit());
      process.on('SIGINT', () => this.quit());
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.memoryStore.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.debug(`[Redis] Cleaned up ${expiredCount} expired keys`);
    }
  }

  private enforceMemoryLimit(): void {
    if (this.options.maxMemory <= 0) return;
    
    const currentMemory = this.memoryStore.size * 1024; // Rough estimate
    if (currentMemory <= this.options.maxMemory) return;
    
    // LRU eviction: Remove least recently accessed entries
    const entries = Array.from(this.memoryStore.entries())
      .sort((a, b) => (a[1].lastAccessed || 0) - (b[1].lastAccessed || 0));
    
    let freedMemory = 0;
    for (const [key, entry] of entries) {
      if (currentMemory - freedMemory <= this.options.maxMemory) break;
      
      this.memoryStore.delete(key);
      freedMemory += 1024; // Approximate per entry
    }
    
    if (freedMemory > 0) {
      console.debug(`[Redis] Freed ${freedMemory} bytes via LRU eviction`);
    }
  }

  private updateStats(): void {
    const currentMemory = this.memoryStore.size * 1024;
    if (currentMemory > this.stats.peakMemory) {
      this.stats.peakMemory = currentMemory;
    }
  }

  private async loadFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('redis_memory_store');
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        // Filter out expired entries
        for (const [key, entry] of Object.entries(data) as [string, any][]) {
          if (!entry.expiresAt || entry.expiresAt > now) {
            this.memoryStore.set(key, {
              value: entry.value,
              expiresAt: entry.expiresAt,
              createdAt: entry.createdAt || now,
              lastAccessed: entry.lastAccessed,
              accessCount: entry.accessCount || 0
            });
          }
        }
        
        console.debug(`[Redis] Loaded ${this.memoryStore.size} keys from localStorage`);
      }
    } catch (error) {
      console.warn('[Redis] Failed to load from localStorage:', error);
    }
  }

  private async saveToLocalStorage(): Promise<void> {
    if (typeof window === 'undefined' || !this.options.persistToDisk) return;
    
    try {
      const data: Record<string, any> = {};
      const now = Date.now();
      
      for (const [key, entry] of this.memoryStore.entries()) {
        if (!entry.expiresAt || entry.expiresAt > now) {
          data[key] = {
            value: entry.value,
            expiresAt: entry.expiresAt,
            createdAt: entry.createdAt,
            lastAccessed: entry.lastAccessed,
            accessCount: entry.accessCount
          };
        }
      }
      
      localStorage.setItem('redis_memory_store', JSON.stringify(data));
    } catch (error) {
      console.warn('[Redis] Failed to save to localStorage:', error);
    }
  }

  async connect(): Promise<void> {
    if (!this.isEnabled) {
      console.log('[Redis] Disabled - no REDIS_URL configured, using memory store');
      this.isConnected = false;
      return;
    }

    try {
      // Simulate connection attempt with timeout
      await Promise.race([
        new Promise(resolve => setTimeout(resolve, 100)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), this.options.connectTimeout)
        )
      ]);
      
      this.isConnected = true;
      console.log('[Redis] Memory store initialized');
    } catch (error) {
      console.warn('[Redis] Connection simulation failed:', error);
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      this.stats.get++;
      const entry = this.memoryStore.get(key);
      
      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.memoryStore.delete(key);
        this.stats.misses++;
        return null;
      }

      // Update access stats
      entry.lastAccessed = Date.now();
      entry.accessCount = (entry.accessCount || 0) + 1;
      this.memoryStore.set(key, entry);
      
      this.stats.hits++;
      this.updateStats();
      
      return entry.value;
    } catch (error) {
      console.error('[Redis] get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async setex(key: string, ttl: number, value: string): Promise<boolean> {
    try {
      this.stats.set++;
      const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : undefined;
      const entry: RedisEntry = {
        value,
        expiresAt,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0
      };
      
      this.memoryStore.set(key, entry);
      this.updateStats();
      
      // Auto-save if persistence enabled
      if (this.options.persistToDisk) {
        setTimeout(() => this.saveToLocalStorage(), 0);
      }
      
      return true;
    } catch (error) {
      console.error('[Redis] setex error:', error);
      return false;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (ttl !== undefined) {
      return this.setex(key, ttl, value);
    }
    
    try {
      this.stats.set++;
      const entry: RedisEntry = {
        value,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0
      };
      
      this.memoryStore.set(key, entry);
      this.updateStats();
      
      if (this.options.persistToDisk) {
        setTimeout(() => this.saveToLocalStorage(), 0);
      }
      
      return true;
    } catch (error) {
      console.error('[Redis] set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      this.stats.del++;
      const deleted = this.memoryStore.delete(key);
      
      if (deleted && this.options.persistToDisk) {
        setTimeout(() => this.saveToLocalStorage(), 0);
      }
      
      return deleted;
    } catch (error) {
      console.error('[Redis] del error:', error);
      return false;
    }
  }

  async ping(): Promise<string> {
    return this.isConnected ? 'PONG' : '';
  }

  async getStats(): Promise<RedisStats> {
    const now = Date.now();
    const uptime = now - this.stats.startTime;
    const totalOps = this.stats.get + this.stats.set + this.stats.del;
    const hitRate = totalOps > 0 ? (this.stats.hits / totalOps) * 100 : 0;
    
    this.cleanupExpired();
    this.updateStats();
    
    return {
      connected: this.isConnected,
      mode: this.isEnabled ? 'redis' : 'memory',
      memory: {
        used_memory: this.memoryStore.size * 1024,
        peak_memory: this.stats.peakMemory,
        maxmemory: this.options.maxMemory,
        fragmentation: 1.0
      },
      clients: 1,
      keys: this.memoryStore.size,
      uptime: Math.floor(uptime / 1000),
      hitRate,
      operations: {
        get: this.stats.get,
        set: this.stats.set,
        del: this.stats.del,
        hits: this.stats.hits,
        misses: this.stats.misses
      }
    };
  }

  async keys(pattern: string): Promise<string[]> {
    const allKeys = Array.from(this.memoryStore.keys());
    
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

  async mset(items: [string, string][]): Promise<boolean> {
    try {
      for (const [key, value] of items) {
        await this.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('[Redis] mset error:', error);
      return false;
    }
  }

  async quit(): Promise<void> {
    this.isConnected = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.options.persistToDisk) {
      await this.saveToLocalStorage();
    }
    
    this.memoryStore.clear();
    console.log('[Redis] Memory store cleared');
  }

  isAvailable(): boolean {
    return this.isEnabled && this.isConnected;
  }

  // Additional Redis-compatible methods
  async exists(key: string): Promise<boolean> {
    return this.memoryStore.has(key);
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = current ? parseInt(current, 10) + 1 : 1;
    await this.set(key, value.toString());
    return value;
  }

  async decr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = current ? parseInt(current, 10) - 1 : -1;
    await this.set(key, value.toString());
    return value;
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const entry = this.memoryStore.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttl * 1000;
      this.memoryStore.set(key, entry);
      
      if (this.options.persistToDisk) {
        setTimeout(() => this.saveToLocalStorage(), 0);
      }
      
      return true;
    }
    return false;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.memoryStore.get(key);
    if (!entry || !entry.expiresAt) {
      return -1;
    }
    
    const remaining = Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    return remaining;
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      const hashKey = `${key}:hash:${field}`;
      return await this.set(hashKey, value);
    } catch (error) {
      console.error('[Redis] hset error:', error);
      return false;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      const hashKey = `${key}:hash:${field}`;
      return await this.get(hashKey);
    } catch (error) {
      console.error('[Redis] hget error:', error);
      return null;
    }
  }

  async publish(channel: string, message: string): Promise<number> {
    const subscribers = this.subscribers.get(channel);
    if (subscribers) {
      subscribers.forEach(callback => callback(channel, message));
      return subscribers.size;
    }
    return 0;
  }

  async subscribe(channel: string, callback: (channel: string, message: string) => void): Promise<void> {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);
  }

  async unsubscribe(channel: string, callback?: (channel: string, message: string) => void): Promise<void> {
    if (!callback) {
      this.subscribers.delete(channel);
    } else {
      const subscribers = this.subscribers.get(channel);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    }
  }

  // Utility methods
  async clear(): Promise<void> {
    this.memoryStore.clear();
    this.stats = {
      get: 0,
      set: 0,
      del: 0,
      hits: 0,
      misses: 0,
      startTime: Date.now(),
      peakMemory: 0,
    };
    
    if (this.options.persistToDisk) {
      localStorage.removeItem('redis_memory_store');
    }
  }

  async getEntries(): Promise<Array<{ key: string; value: string; ttl?: number }>> {
    const now = Date.now();
    const entries: Array<{ key: string; value: string; ttl?: number }> = [];
    
    for (const [key, entry] of this.memoryStore.entries()) {
      if (!entry.expiresAt || entry.expiresAt > now) {
        entries.push({
          key,
          value: entry.value,
          ttl: entry.expiresAt ? Math.max(0, Math.ceil((entry.expiresAt - now) / 1000)) : undefined
        });
      }
    }
    
    return entries;
  }
}

// Singleton instance with lazy initialization
let redisInstance: EnhancedRedisClient | null = null;

function getRedisClient(options?: RedisOptions): EnhancedRedisClient {
  if (!redisInstance) {
    redisInstance = new EnhancedRedisClient(options);
  }
  return redisInstance;
}

// Export the singleton instance
const redis = getRedisClient();
export default redis;

// Also export the class for testing or custom instances
export { EnhancedRedisClient as RedisClient };

// Helper function to create a namespaced Redis client
export function createNamespacedClient(namespace: string) {
  const client = getRedisClient();
  
  return {
    async get(key: string): Promise<string | null> {
      return client.get(`${namespace}:${key}`);
    },
    
    async set(key: string, value: string, ttl?: number): Promise<boolean> {
      return client.set(`${namespace}:${key}`, value, ttl);
    },
    
    async setex(key: string, ttl: number, value: string): Promise<boolean> {
      return client.setex(`${namespace}:${key}`, ttl, value);
    },
    
    async del(key: string): Promise<boolean> {
      return client.del(`${namespace}:${key}`);
    },
    
    async exists(key: string): Promise<boolean> {
      return client.exists(`${namespace}:${key}`);
    },
    
    async incr(key: string): Promise<number> {
      return client.incr(`${namespace}:${key}`);
    },
    
    async expire(key: string, ttl: number): Promise<boolean> {
      return client.expire(`${namespace}:${key}`, ttl);
    },
    
    async ttl(key: string): Promise<number> {
      return client.ttl(`${namespace}:${key}`);
    },
    
    async keys(pattern: string): Promise<string[]> {
      const keys = await client.keys(`${namespace}:${pattern}`);
      return keys.map(key => key.replace(`${namespace}:`, ''));
    },
    
    async clearNamespace(): Promise<void> {
      const keys = await client.keys(`${namespace}:*`);
      await Promise.all(keys.map(key => client.del(key)));
    },
    
    getClient(): EnhancedRedisClient {
      return client;
    }
  };
}
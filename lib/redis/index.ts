// lib/redis/index.ts - Safe fallback
let redisInstance: any = null;

export function getRedis() {
  if (redisInstance) return redisInstance;
  
  // Return a mock Redis client for development
  redisInstance = {
    async get(key: string): Promise<string | null> {
      console.log(`[Redis Mock] GET ${key}`);
      return null;
    },
    
    async set(key: string, value: string, options?: any): Promise<string> {
      console.log(`[Redis Mock] SET ${key} = ${value.substring(0, 50)}...`);
      return 'OK';
    },
    
    async del(key: string): Promise<number> {
      console.log(`[Redis Mock] DEL ${key}`);
      return 1;
    },
    
    async sadd(key: string, ...members: string[]): Promise<number> {
      console.log(`[Redis Mock] SADD ${key} ${members.join(', ')}`);
      return members.length;
    },
    
    async srem(key: string, ...members: string[]): Promise<number> {
      console.log(`[Redis Mock] SREM ${key} ${members.join(', ')}`);
      return members.length;
    },
    
    async smembers(key: string): Promise<string[]> {
      console.log(`[Redis Mock] SMEMBERS ${key}`);
      return [];
    },
    
    async expire(key: string, seconds: number): Promise<number> {
      console.log(`[Redis Mock] EXPIRE ${key} ${seconds}s`);
      return 1;
    },
    
    async ping(): Promise<string> {
      return 'PONG';
    }
  };
  
  return redisInstance;
}

// For environments without Redis
export function initRedis() {
  console.log('[Redis] Using mock implementation');
  return getRedis();
}

// lib/redis-enhanced.ts
import { redis } from './redis-enhanced.edge';
import type { RedisInterface } from './redis-enhanced.edge';

export default redis;
export { redis };
export type { RedisInterface };

// Compatibility exports
export const getRedis = () => redis;
export const createNamespacedClient = (namespace: string): RedisInterface => {
  // Create a proxy that prefixes keys
  const handler: ProxyHandler<RedisInterface> = {
    get(target, prop) {
      const original = (target as any)[prop];
      if (typeof original === 'function') {
        return function(...args: any[]) {
          // Only prefix key arguments (first argument for most methods)
          if (args.length > 0 && typeof args[0] === 'string') {
            args[0] = `${namespace}:${args[0]}`;
          }
          return original.apply(target, args);
        };
      }
      return original;
    }
  };
  
  return new Proxy(redis, handler) as RedisInterface;
};
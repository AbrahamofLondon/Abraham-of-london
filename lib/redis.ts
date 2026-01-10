// lib/redis.ts
export { getRedis, redis, type RedisClient, createNamespacedClient } from "./redis-enhanced";
import redisClient from "./redis-enhanced";

// ALIAS FOR BACKWARD COMPATIBILITY
export const getRedisClient = getRedis;

export default redisClient;

// lib/redis/health-check.ts
import { getRedis, isRedisAvailable } from "./client";

export async function checkRedisHealth() {
  const status = {
    connected: false,
    ping: false,
    memory: null as string | null,
    keys: 0,
    error: null as string | null,
  };

  try {
    status.connected = isRedisAvailable();
    
    // Check if Redis is available and get the client
    if (status.connected) {
      const redis = getRedis();
      
      // Ensure redis exists before using it
      if (redis) {
        const pong = await redis.ping();
        status.ping = pong === "PONG";

        const info = await redis.info("memory");
        const usedMemory = info.match(/used_memory_human:(.*)/)?.[1]?.trim();
        status.memory = usedMemory || null;

        const keys = await redis.keys("vault:*");
        status.keys = keys.length;
      } else {
        status.connected = false;
        status.error = "Redis client is null despite reporting available";
      }
    }
  } catch (error) {
    status.error = error instanceof Error ? error.message : String(error);
    status.connected = false;
  }

  return status;
}
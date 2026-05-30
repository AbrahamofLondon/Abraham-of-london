// app/api/vault/status/route.ts
import { NextResponse } from "next/server";
import { checkRedisHealth, isRedisDisabled } from "@/lib/redis/client";
import { getAllPDFItems } from "@/lib/pdf-registry";

export async function GET() {
  // Check if Redis is intentionally disabled by configuration
  const redisDisabled = isRedisDisabled();

  if (redisDisabled) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      redis: {
        connected: false,
        ping: false,
        memory: null,
        keys: 0,
        error: null,
        disabled: true,
        intentional: true,
      },
      disk: {
        assets: getAllPDFItems({ includeMissing: false }).length,
      },
      status: "reserved",
      message: "Redis reserved — intentionally disabled. No active production dependency. No action required unless enabling cache-backed workflows.",
    });
  }

  const health = await checkRedisHealth();
  const diskAssets = getAllPDFItems({ includeMissing: false }).length;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    redis: {
      ...health,
      disabled: false,
      intentional: false,
    },
    disk: {
      assets: diskAssets,
    },
    status: health.connected ? "healthy" : "degraded",
    message: health.connected 
      ? "Vault operating normally" 
      : "Redis unavailable — check credentials and connection. If Redis is not needed, set REDIS_DISABLED=true.",
  });
}
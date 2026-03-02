// app/api/vault/status/route.ts
import { NextResponse } from "next/server";
import { checkRedisHealth } from "@/lib/redis/health-check";
import { getAllPDFItems } from "@/lib/pdf-registry";

export async function GET() {
  const health = await checkRedisHealth();
  const diskAssets = getAllPDFItems({ includeMissing: false }).length;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    redis: health,
    disk: {
      assets: diskAssets,
    },
    status: health.connected ? "healthy" : "degraded",
    message: health.connected 
      ? "Vault operating normally" 
      : "Redis unavailable - operating in cache-only mode",
  });
}
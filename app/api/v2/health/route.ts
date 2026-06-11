// app/api/v2/health/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ComponentStatus = "ok" | "degraded" | "unavailable";

type HealthCheck = {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  router: string;
  timestamp: string;
  components: Record<string, { status: ComponentStatus; detail?: string }>;
};

export async function GET() {
  const components: HealthCheck["components"] = {};

  // 1. App alive — always ok if we got here
  components.app = { status: "ok" };

  // 2. Database check
  try {
    const { prisma } = await import("@/lib/prisma.server");
    await prisma.$queryRaw`SELECT 1`;
    components.database = { status: "ok" };
  } catch (e) {
    components.database = {
      status: "unavailable",
      detail: "Database connection failed",
    };
  }

  // 3. Environment integrity — check critical production secrets exist
  const criticalEnvVars = [
    "NEXTAUTH_SECRET",
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "CRON_SECRET",
  ];
  const missingEnv = criticalEnvVars.filter((k) => !process.env[k]);
  if (missingEnv.length === 0) {
    components.env = { status: "ok" };
  } else {
    components.env = {
      status: "degraded",
      detail: `${missingEnv.length} critical variable(s) missing`,
    };
  }

  // 4. Stripe configured
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
    components.stripe = { status: "ok" };
  } else if (process.env.STRIPE_SECRET_KEY) {
    components.stripe = {
      status: "degraded",
      detail: "Webhook secret not configured",
    };
  } else {
    components.stripe = {
      status: "unavailable",
      detail: "Not configured",
    };
  }

  // 5. Redis status
  try {
    const { checkCanonicalRedisHealth } = await import("@/lib/redis-health");
    const redis = await checkCanonicalRedisHealth();
    if (redis.ok) {
      components.redis = { status: "ok", detail: redis.clientMode };
    } else {
      components.redis = {
        status: redis.required || redis.configured ? "unavailable" : "degraded",
        detail: `${redis.message} (${redis.clientMode})`,
      };
    }
  } catch {
    components.redis = {
      status: process.env.USE_REDIS === "true" ? "unavailable" : "degraded",
      detail: "Redis health check failed",
    };
  }

  // Derive overall status
  const statuses = Object.values(components).map((c) => c.status);
  let overall: HealthCheck["status"] = "healthy";

  if (statuses.includes("unavailable")) {
    // Database and required Redis are hard dependencies.
    if (components.database?.status === "unavailable" || components.redis?.status === "unavailable") {
      overall = "unhealthy";
    } else {
      overall = "degraded";
    }
  } else if (statuses.includes("degraded")) {
    overall = "degraded";
  }

  const body: HealthCheck = {
    status: overall,
    version: "v2",
    router: "app",
    timestamp: new Date().toISOString(),
    components,
  };

  const httpStatus = overall === "unhealthy" ? 503 : 200;

  return NextResponse.json(body, {
    status: httpStatus,
    headers: {
      "X-API-Version": "v2",
      "X-API-Router": "app",
      "Cache-Control": "no-store, private, max-age=0",
    },
  });
}

// netlify/functions/health-check.ts
import type {
  Handler,
  HandlerEvent,
  HandlerContext,
  HandlerResponse,
} from "@netlify/functions";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

interface BasicCheck {
  status: "pass" | "fail" | "warn";
  details?: string;
}

interface TimedCheck extends BasicCheck {
  duration: number;
  [key: string]: unknown;
}

interface DependencyStatus {
  status: "healthy" | "unhealthy" | "unknown";
  responseTime?: number;
  version?: string;
  error?: string;
}

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  environment: string;

  checks: {
    [key: string]: TimedCheck;
  };

  dependencies: {
    [key: string]: DependencyStatus;
  };

  system: {
    nodeVersion: string;
    platform: string;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: number;
  };

  services: {
    [key: string]: {
      status: "operational" | "degraded" | "down" | "unknown";
      lastChecked: string;
    };
  };
}

interface HealthCheckConfig {
  timeout: number;
  enableDetailedMetrics: boolean;
  checkDependencies: boolean;
  allowedOrigins: string[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIG: HealthCheckConfig = {
  timeout: 10000,
  enableDetailedMetrics: process.env.NODE_ENV === "production",
  checkDependencies: process.env.HEALTH_CHECK_FULL === "true",
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:3000,http://localhost:8888"
  ).split(","),
};

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function getCorsHeaders(origin?: string) {
  const allowedOrigin = CONFIG.allowedOrigins.includes(origin || "")
    ? origin
    : CONFIG.allowedOrigins[0];

  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowedOrigin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Health-Check-Token",
    "Access-Control-Max-Age": "86400",
    "X-Health-Check-Version": "1.0.0",
    "X-Response-Time": Date.now().toString(),
  };
}

function formatResponse(
  statusCode: number,
  data: unknown,
  origin?: string,
  extraHeaders: Record<string, string> = {}
): HandlerResponse {
  return {
    statusCode,
    headers: {
      ...getCorsHeaders(origin),
      ...extraHeaders,
    },
    body: JSON.stringify(data, null, CONFIG.enableDetailedMetrics ? 2 : 0),
  };
}

function measureTime<T>(
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = fn();

  if (result instanceof Promise) {
    return result.then((res) => ({
      result: res,
      duration: Date.now() - start,
    }));
  }

  return Promise.resolve({
    result,
    duration: Date.now() - start,
  });
}

// ---------------------------------------------------------------------------
// Health Check Components
// ---------------------------------------------------------------------------

async function checkEnvironment(): Promise<BasicCheck> {
  const requiredEnvVars = ["NODE_ENV", "NEXT_PUBLIC_SITE_URL"];
  const optionalEnvVars = ["RECAPTCHA_SECRET_KEY", "CLEAR_CACHE_SECRET", "RESEND_API_KEY"];

  const missingRequired = requiredEnvVars.filter((env) => !process.env[env]);
  const missingOptional = optionalEnvVars.filter((env) => !process.env[env]);

  if (missingRequired.length > 0) {
    return {
      status: "fail",
      details: `Missing required environment variables: ${missingRequired.join(", ")}`,
    };
  }

  if (missingOptional.length > 0) {
    return {
      status: "warn",
      details: `Missing optional environment variables: ${missingOptional.join(", ")}`,
    };
  }

  return { status: "pass" };
}

async function checkSystemResources(): Promise<BasicCheck> {
  try {
    const memoryUsage = process.memoryUsage();
    const total = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const used = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const pct = (used / total) * 100;

    if (pct > 90) {
      return {
        status: "fail",
        details: `High memory usage: ${used}MB/${total}MB (${pct.toFixed(1)}%)`,
      };
    }

    if (pct > 80) {
      return {
        status: "warn",
        details: `Elevated memory usage: ${used}MB/${total}MB (${pct.toFixed(1)}%)`,
      };
    }

    return {
      status: "pass",
      details: `Memory OK: ${used}MB/${total}MB (${pct.toFixed(1)}%)`,
    };
  } catch {
    return { status: "warn", details: "Unable to read system resources" };
  }
}

async function checkFunctionConnectivity(): Promise<BasicCheck> {
  try {
    return { status: "pass", details: "Function loaded successfully" };
  } catch (error) {
    return {
      status: "fail",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkExternalDependencies(): Promise<Record<string, DependencyStatus>> {
  const dependencies: Record<string, DependencyStatus> = {};

  // reCAPTCHA
  try {
    const start = Date.now();
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });

    dependencies.recaptcha = {
      status: response.ok ? "healthy" : "unhealthy",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    dependencies.recaptcha = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }

  // Main website
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      const start = Date.now();
      const response = await fetch(process.env.NEXT_PUBLIC_SITE_URL, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });

      dependencies.website = {
        status: response.ok ? "healthy" : "unhealthy",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      dependencies.website = {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  return dependencies;
}

// ---------------------------------------------------------------------------
// FIX — Flatten measureTime() results (resolves your TS error)
// ---------------------------------------------------------------------------

function flattenCheck(
  settled: PromiseSettledResult<{
    result: BasicCheck;
    duration: number;
  }>
): TimedCheck {
  if (settled.status === "fulfilled") {
    return {
      status: settled.value.result.status,
      duration: settled.value.duration,
      details: settled.value.result.details,
    };
  }

  return {
    status: "fail",
    duration: 0,
    details: "Check failed",
  };
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
  const origin = event.headers.origin || event.headers.Origin;
  const requestStartTime = Date.now();
  const isDetailed = event.queryStringParameters?.detailed === "true";
  const token = event.headers["x-health-check-token"] as string | undefined;

  if (event.httpMethod === "OPTIONS") {
    return formatResponse(204, {}, origin);
  }

  if (isDetailed && process.env.HEALTH_CHECK_TOKEN && token !== process.env.HEALTH_CHECK_TOKEN) {
    return formatResponse(401, { error: "Unauthorized" }, origin);
  }

  try {
    const overallStatus: HealthCheckResult = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      checks: {},
      dependencies: {},
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          percentage: Math.round(
            (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
          ),
        },
        uptime: Math.round(process.uptime()),
      },
      services: {},
    };

    // Run checks simultaneously
    const checks = await Promise.allSettled([
      measureTime(checkEnvironment),
      measureTime(checkSystemResources),
      measureTime(checkFunctionConnectivity),
    ]);

    // ----- FIXED ASSIGNMENTS -----
    overallStatus.checks.environment = flattenCheck(checks[0]);
    overallStatus.checks.system = flattenCheck(checks[1]);
    overallStatus.checks.connectivity = flattenCheck(checks[2]);
    // -----------------------------

    if (CONFIG.checkDependencies && isDetailed) {
      overallStatus.dependencies = await checkExternalDependencies();
    }

    const failed = Object.values(overallStatus.checks).filter((c) => c.status === "fail").length;
    const warns = Object.values(overallStatus.checks).filter((c) => c.status === "warn").length;

    if (failed > 0) overallStatus.status = "unhealthy";
    else if (warns > 0) overallStatus.status = "degraded";

    const responseTime = Date.now() - requestStartTime;

    return formatResponse(
      overallStatus.status === "unhealthy" ? 503 : 200,
      overallStatus,
      origin,
      {
        "X-Response-Time": responseTime.toString(),
        "X-Health-Status": overallStatus.status,
      }
    );
  } catch (error) {
    const errorResponse = {
      status: "unhealthy" as const,
      timestamp: new Date().toISOString(),
      error: "Health check system failure",
      details:
        process.env.NODE_ENV === "production"
          ? undefined
          : error instanceof Error
          ? error.message
          : "Unknown error",
    };

    return formatResponse(503, errorResponse, origin, {
      "X-Health-Status": "unhealthy",
      "X-Response-Time": (Date.now() - requestStartTime).toString(),
    });
  }
};

// ---------------------------------------------------------------------------
// Testing Exports
// ---------------------------------------------------------------------------

export const healthCheckComponents = {
  checkEnvironment,
  checkSystemResources,
  checkFunctionConnectivity,
  checkExternalDependencies,
};
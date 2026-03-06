// lib/server/http.ts - PRODUCTION SAFE (FIXED + BUILD-SAFE)
import type { NextApiRequest, NextApiResponse } from "next";
import { safeSlice } from "@/lib/utils/safe";

export type ApiOk<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
  timestamp?: string;
};

export type ApiErr = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
  meta?: Record<string, unknown>;
  timestamp?: string;
};

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export type SecurityHeaders = {
  [key: string]: string | string[];
};

const isProduction = (): boolean => {
  return typeof process !== "undefined" && !!process.env && process.env.NODE_ENV === "production";
};

const isDevelopment = (): boolean => {
  return typeof process !== "undefined" && !!process.env && process.env.NODE_ENV === "development";
};

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// ---- local string helpers (guaranteed string in/out)
function trimSlice(s: string, start: number, end: number): string {
  const t = s.trim();
  if (!t) return "";
  const a = Math.max(0, start | 0);
  const b = Math.max(a, end | 0);
  return t.slice(a, b);
}

function safeHeaderString(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0] ?? "";
  return "";
}

// Enhanced security headers with safe defaults
export function setSecurityHeaders(res: NextApiResponse, customHeaders: SecurityHeaders = {}): void {
  if (res.headersSent) {
    if (isDevelopment()) console.warn("[HTTP] Cannot set security headers: response already sent");
    return;
  }

  const baseHeaders: SecurityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy":
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
    "X-XSS-Protection": "1; mode=block",
    "X-DNS-Prefetch-Control": "off",
    "Strict-Transport-Security": isProduction()
      ? "max-age=31536000; includeSubDomains"
      : "max-age=0; includeSubDomains",
  };

  Object.entries({ ...baseHeaders, ...customHeaders }).forEach(([key, value]) => {
    try {
      res.setHeader(key, value as any);
    } catch (error) {
      if (isDevelopment()) console.warn(`[HTTP] Failed to set header "${key}":`, error);
    }
  });
}

export function jsonOk<T>(
  res: NextApiResponse,
  data: T,
  meta?: ApiOk<T>["meta"],
  statusCode: number = 200
): void {
  setSecurityHeaders(res);

  const payload: ApiOk<T> = {
    ok: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };

  const safeStatusCode = Math.max(200, Math.min(500, statusCode));
  res.status(safeStatusCode).json(payload);
}

export function jsonErr(
  res: NextApiResponse,
  status: number,
  code: string,
  message: string,
  details?: unknown,
  requestId?: string
): void {
  setSecurityHeaders(res);

  const safeStatus = Math.max(400, Math.min(599, status));

  const payload: ApiErr = {
    ok: false,
    error: {
      code,
      message: message || getDefaultErrorMessage(safeStatus),
      details: isProduction() ? undefined : details,
      requestId,
    },
    timestamp: new Date().toISOString(),
  };

  if (safeStatus === 429) {
    res.setHeader("Retry-After", "60");
  }

  res.status(safeStatus).json(payload);
}

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not Found";
    case 405:
      return "Method Not Allowed";
    case 429:
      return "Too Many Requests";
    case 500:
      return "Internal Server Error";
    case 502:
      return "Bad Gateway";
    case 503:
      return "Service Unavailable";
    default:
      return "Error";
  }
}

// SAFE: Request ID generation with better entropy
export function getRequestId(req: NextApiRequest): string {
  const headerVal = safeHeaderString(req.headers["x-request-id"]);
  if (headerVal.trim()) return trimSlice(headerVal, 0, 100);

  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto && typeof crypto.randomUUID === "function") {
      return `req_${crypto.randomUUID()}`;
    }
  } catch {
    // fall through
  }

  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `req_${timestamp}_${random}`;
}

export function methodNotAllowed(
  req: NextApiRequest,
  res: NextApiResponse,
  allowed: string[],
  requestId?: string
): void {
  const safeAllowed = allowed
    .map((m) => String(m || "").toUpperCase())
    .filter((m) => ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"].includes(m));

  res.setHeader("Allow", safeAllowed.join(", "));

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", safeAllowed.join(", "));
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
    res.setHeader("Access-Control-Max-Age", "86400");
  }

  return jsonErr(
    res,
    405,
    "METHOD_NOT_ALLOWED",
    `Allowed methods: ${safeAllowed.join(", ")}`,
    { allowed: safeAllowed },
    requestId
  );
}

// Legacy compatibility wrapper (for existing code)
export function methodNotAllowedLegacy(req: NextApiRequest, res: NextApiResponse, allowed: string[]) {
  return methodNotAllowed(req, res, allowed);
}

export function validateRequiredFields(
  req: NextApiRequest,
  fields: string[],
  location: "body" | "query" = "body"
): { isValid: boolean; missing: string[] } {
  const source: any = location === "body" ? req.body : req.query;
  const missing: string[] = [];

  fields.forEach((field) => {
    if (!source || source[field] === undefined || source[field] === null || source[field] === "") {
      missing.push(field);
    }
  });

  return { isValid: missing.length === 0, missing };
}

// SAFE: in-memory rate limit (simple use cases)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + config.windowMs };
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const reset = Math.ceil((entry.resetTime - now) / 1000);

  return {
    allowed: entry.count <= config.maxRequests,
    remaining,
    reset,
  };
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime + 60000) rateLimitStore.delete(key);
    }
  }, 60000);
}

// CORS helper for API routes
export function setCorsHeaders(res: NextApiResponse, origin: string = "*"): void {
  const safeOrigin = isProduction()
    ? origin === "*"
      ? "https://www.abrahamoflondon.org"
      : origin
    : origin;

  res.setHeader("Access-Control-Allow-Origin", safeOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
}

// Request logger (development only)
export function logRequest(req: NextApiRequest, res: NextApiResponse, startTime: number = Date.now()): void {
  if (!isDevelopment()) return;

  const duration = Date.now() - startTime;
  const requestId = getRequestId(req);
  const method = req.method || "UNKNOWN";
  const url = req.url || "/";
  const status = res.statusCode || 200;

  console.log(`[${new Date().toISOString()}] ${method} ${url} ${status} ${duration}ms [${requestId}]`);
}

// Type-safe middleware helper
export function withApiHandler<T = any>(
  handler: (req: NextApiRequest, res: NextApiResponse<T>) => Promise<void> | void,
  options: {
    methods?: string[];
    requireAuth?: boolean;
    validateBody?: (body: any) => boolean;
  } = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    const requestId = getRequestId(req);

    try {
      if (isDevelopment()) console.log(`[${requestId}] ${req.method} ${req.url}`);

      if (options.methods && req.method && !options.methods.includes(req.method)) {
        return methodNotAllowed(req, res, options.methods, requestId);
      }

      if (req.method === "OPTIONS") {
        setCorsHeaders(res);
        return res.status(200).end();
      }

      await handler(req, res);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = isDevelopment() && error instanceof Error ? error.stack : undefined;

      console.error(`[${requestId}] Handler error:`, errorMessage);

      return jsonErr(
        res,
        500,
        "INTERNAL_SERVER_ERROR",
        isProduction() ? "An internal error occurred" : errorMessage,
        errorStack,
        requestId
      );
    } finally {
      logRequest(req, res, startTime);
    }
  };
}
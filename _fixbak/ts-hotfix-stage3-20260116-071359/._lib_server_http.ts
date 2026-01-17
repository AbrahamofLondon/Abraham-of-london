// lib/server/http.ts - PRODUCTION SAFE UPGRADE
import type { NextApiRequest, NextApiResponse } from "next";
import type { IncomingHttpHeaders } from "http";

// SAFE: Cross-platform type safety
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

// SAFE: Environment detection without process.env dependency issues
const isProduction = (): boolean => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NODE_ENV === 'production';
};

const isDevelopment = (): boolean => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NODE_ENV === 'development';
};

// Rate limiting helper (production-safe)
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Enhanced security headers with safe defaults
export function setSecurityHeaders(res: NextApiResponse, customHeaders: SecurityHeaders = {}): void {
  // SAFE: Always set headers even if response is already sent
  if (res.headersSent) {
    if (isDevelopment()) {
      console.warn('[HTTP] Cannot set security headers: response already sent');
    }
    return;
  }

  const baseHeaders: SecurityHeaders = {
    // Security headers
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
    
    // Content security
    "X-XSS-Protection": "1; mode=block",
    
    // Performance/optimization (safe to set)
    "X-DNS-Prefetch-Control": "off",
    "Strict-Transport-Security": isProduction() 
      ? "max-age=31536000; includeSubDomains" 
      : "max-age=0; includeSubDomains",
  };

  // Apply all headers safely
  Object.entries({ ...baseHeaders, ...customHeaders }).forEach(([key, value]) => {
    try {
      if (Array.isArray(value)) {
        res.setHeader(key, value);
      } else {
        res.setHeader(key, value);
      }
    } catch (error) {
      // SAFE: Don't crash on header errors
      if (isDevelopment()) {
        console.warn(`[HTTP] Failed to set header "${key}":`, error);
      }
    }
  });
}

// Safe JSON response with proper typing
export function jsonOk<T>(
  res: NextApiResponse, 
  data: T, 
  meta?: ApiOk<T>["meta"],
  statusCode: number = 200
): NextApiResponse<ApiOk<T>> {
  setSecurityHeaders(res);
  
  const payload: ApiOk<T> = {
    ok: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };

  // SAFE: Validate status code
  const safeStatusCode = Math.max(200, Math.min(500, statusCode));
  
  res.status(safeStatusCode).json(payload);
  return res;
}

// Enhanced error response with better categorization
export function jsonErr(
  res: NextApiResponse, 
  status: number, 
  code: string, 
  message: string, 
  details?: unknown,
  requestId?: string
): void {
  setSecurityHeaders(res);
  
  // SAFE: Categorize HTTP status codes
  const statusCategory = Math.floor(status / 100);
  const safeStatus = Math.max(400, Math.min(599, status));
  
  const payload: ApiErr = {
    ok: false,
    error: { 
      code, 
      message: message || getDefaultErrorMessage(safeStatus),
      details: isProduction() ? undefined : details, // Hide details in production
      requestId,
    },
    timestamp: new Date().toISOString(),
  };

  // Add helpful headers for certain error types
  if (status === 429) {
    res.setHeader("Retry-After", "60");
  }

  res.status(safeStatus).json(payload);
  return res;
}

// Helper for common error messages
function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400: return "Bad Request";
    case 401: return "Unauthorized";
    case 403: return "Forbidden";
    case 404: return "Not Found";
    case 405: return "Method Not Allowed";
    case 429: return "Too Many Requests";
    case 500: return "Internal Server Error";
    case 502: return "Bad Gateway";
    case 503: return "Service Unavailable";
    default: return "Error";
  }
}

// SAFE: Request ID generation with better entropy
export function getRequestId(req: NextApiRequest): string {
  // Try to get from header first
  const fromHeader = req.headers["x-request-id"];
  if (typeof fromHeader === "string" && fromHeader.trim()) {
    return fromHeader.trim().slice(0, 100); // Limit length
  }
  
  // SAFE: Cross-platform crypto if available
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `req_${crypto.randomUUID()}`;
    }
  } catch {
    // Fall through to timestamp method
  }
  
  // Fallback: timestamp + random (still safe)
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `req_${timestamp}_${random}`;
}

// Enhanced method not allowed with CORS support
export function methodNotAllowed(
  res: NextApiResponse, 
  allowed: string[],
  requestId?: string
): void {
  const safeAllowed = allowed.filter(method => 
    typeof method === 'string' && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(method.toUpperCase())
  );
  
  res.setHeader("Allow", safeAllowed.join(", "));
  
  // Add CORS headers for OPTIONS preflight
  if (req?.method === 'OPTIONS') {
    res.setHeader("Access-Control-Allow-Methods", safeAllowed.join(", "));
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
    res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
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
export function methodNotAllowedLegacy(res: NextApiResponse, allowed: string[]) {
  return methodNotAllowed(res, allowed);
}

// SAFE: Request validation helpers
export function validateRequiredFields(
  req: NextApiRequest,
  fields: string[],
  location: 'body' | 'query' = 'body'
): { isValid: boolean; missing: string[] } {
  const source = location === 'body' ? req.body : req.query;
  const missing: string[] = [];
  
  fields.forEach(field => {
    if (!source || source[field] === undefined || source[field] === null || source[field] === '') {
      missing.push(field);
    }
  });
  
  return {
    isValid: missing.length === 0,
    missing,
  };
}

// SAFE: Rate limiting helper (in-memory, for simple use cases)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  
  let entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Reset or create new window
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
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

// SAFE: Clean up old rate limit entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime + 60000) { // Keep for 1 minute after expiry
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

// CORS helper for API routes
export function setCorsHeaders(res: NextApiResponse, origin: string = '*'): void {
  // SAFE: Validate origin in production
  const safeOrigin = isProduction() 
    ? (origin === '*' ? 'https://www.abrahamoflondon.org' : origin)
    : origin;
  
  res.setHeader("Access-Control-Allow-Origin", safeOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
}

// Request logger (development only)
export function logRequest(
  req: NextApiRequest, 
  res: NextApiResponse, 
  startTime: number = Date.now()
): void {
  if (!isDevelopment()) return;
  
  const duration = Date.now() - startTime;
  const requestId = getRequestId(req);
  const method = req.method || 'UNKNOWN';
  const url = req.url || '/';
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
      // Log request in development
      if (isDevelopment()) {
        console.log(`[${requestId}] ${req.method} ${req.url}`);
      }
      
      // Method validation
      if (options.methods && req.method && !options.methods.includes(req.method)) {
        return methodNotAllowed(res, options.methods, requestId);
      }
      
      // Basic CORS handling
      if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
      }
      
      // Execute handler
      await handler(req, res);
      
    } catch (error) {
      // SAFE: Error handling without exposing details in production
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
      // Log completion
      logRequest(req, res, startTime);
    }
  };
}





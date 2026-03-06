// proxy.ts — INSTITUTIONAL PERIMETER (Hardened for Build/Runtime)
// Edge-safe: 100% compatible with Edge Runtime. No Node.js modules.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { ROLE_HIERARCHY } from "@/types/auth";
import { readAccessCookie } from "@/lib/server/auth/cookies";

// ============================================================================
// Edge-safe utility functions (no Node.js dependencies)
// ============================================================================

const CANONICAL_HOST = "www.abrahamoflondon.org";

/**
 * Edge-safe IP extraction from NextRequest
 */
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const ips = xff.split(",").map(ip => ip.trim());
    return ips[0] || "0.0.0.0";
  }
  
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  
  return "0.0.0.0";
}

/**
 * Edge-safe rate limiting configuration
 */
const RATE_LIMIT_CONFIGS = {
  ADMIN: { limit: 30, windowMs: 60000 },
  API_GENERAL: { limit: 60, windowMs: 60000 },
} as const;

/**
 * Edge-safe rate limiting (in-memory, per instance)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
  limit: number;
}

async function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / options.windowMs)}`;
  
  const record = rateLimitStore.get(windowKey);
  
  if (!record || now >= record.resetAt) {
    rateLimitStore.set(windowKey, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    
    // Clean up old entries
    if (Math.random() < 0.01) {
      const keysToDelete: string[] = [];
      rateLimitStore.forEach((value, key) => {
        if (now > value.resetAt) keysToDelete.push(key);
      });
      keysToDelete.forEach(key => rateLimitStore.delete(key));
    }
    
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetAt: now + options.windowMs,
      limit: options.limit,
    };
  }
  
  if (record.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfterMs: record.resetAt - now,
      limit: options.limit,
    };
  }
  
  record.count += 1;
  
  return {
    allowed: true,
    remaining: options.limit - record.count,
    resetAt: record.resetAt,
    limit: options.limit,
  };
}

function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
    ...(result.retryAfterMs ? { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) } : {}),
  };
}

/**
 * Edge-safe admin IP check
 */
function isAllowedIp(ip: string): boolean {
  const allowedIps = process.env.ADMIN_ALLOWED_IPS?.split(",").map(ip => ip.trim()) || [];
  
  if (allowedIps.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[WARNING] No ADMIN_ALLOWED_IPS configured");
    }
    return true;
  }
  
  return allowedIps.includes(ip) || allowedIps.includes("0.0.0.0/0");
}

/**
 * Edge-safe sensitive operation check
 */
function isSensitiveOperation(pathname: string, method: string): boolean {
  const sensitivePaths = [
    "/api/admin/users",
    "/api/admin/roles",
    "/api/vault/delete",
    "/api/vault/transfer",
  ];
  
  const sensitiveMethods = ["POST", "PUT", "DELETE", "PATCH"];
  
  return sensitivePaths.some(p => pathname.startsWith(p)) && 
         sensitiveMethods.includes(method);
}

// ============================================================================
// Path utilities
// ============================================================================

const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/contact",
  "/api/health",
  "/api/middleware-health",
  "/api/access",
  "/api/inner-circle",
  "/api/check-access",
  "/api/access-check",
  "/api/v2/access",
  "/api/debug",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/assets",
  "/fonts",
  "/images",
  "/inner-circle/login",
  "/inner-circle/unlock",
  "/admin/login",
  "/strategy-room",
  "/api/strategy-room/submit",
  "/api/strategy-room/analyze",
] as const;

function isPublicPath(pathname: string): boolean {
  if (pathname === "/strategy-room/success") return false;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function safeReturnTo(req: NextRequest): string {
  const url = req.nextUrl.clone();
  url.searchParams.delete("callbackUrl");
  url.searchParams.delete("returnTo");
  return `${url.pathname}${url.search || ""}`;
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/vault");
}

function isInnerCirclePath(pathname: string): boolean {
  return pathname.startsWith("/inner-circle") || pathname.startsWith("/strategy-room/success");
}

function canonicalizeHost(req: NextRequest): NextResponse | null {
  const host = req.nextUrl.hostname;
  if (host === "abrahamoflondon.org") {
    const url = req.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }
  return null;
}

function jsonResponse(body: any, status: number, extraHeaders?: Record<string, string>): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...(extraHeaders || {}) },
  });
}

// ============================================================================
// Main middleware
// ============================================================================

export const config = {
  matcher: [
    "/admin/:path*",
    "/inner-circle/:path*",
    "/api/:path*",
    "/strategy-room/success/:path*",
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Canonical host redirect
  const canonical = canonicalizeHost(req);
  if (canonical) return canonical;

  // 2) Public bypass
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const ip = getClientIp(req);
  const admin = isAdminPath(pathname);
  const api = isApiPath(pathname);
  const inner = isInnerCirclePath(pathname);

  // 3) IP gate — Admin only
  if (admin) {
    if (!isAllowedIp(ip)) {
      if (api) {
        return jsonResponse({ error: "ACCESS_DENIED", message: "IP not allowed" }, 403);
      }
      return NextResponse.redirect(new URL("/auth/access-denied", req.url));
    }
  }

  // 4) Rate limit — Admin + API
  if (admin || api) {
    const opts = admin ? RATE_LIMIT_CONFIGS.ADMIN : RATE_LIMIT_CONFIGS.API_GENERAL;
    
    try {
      const rl = await rateLimit(ip, opts);

      if (!rl.allowed) {
        return jsonResponse(
          { 
            error: "RATE_LIMIT_EXCEEDED", 
            retryAfterMs: rl.retryAfterMs,
            limit: rl.limit,
            resetAt: rl.resetAt 
          },
          429,
          createRateLimitHeaders(rl)
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[RATE_LIMIT_ERROR]", error);
      }
    }
  }

  // 5) Auth gate — Admin + Inner-Circle
  const needsAuth = admin || inner;

  if (needsAuth) {
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

      // ✅ USE THE SSOT READER - Edge-safe, works everywhere
      let hasInstitutionalSession = false;

      if (!token && inner) {
        const sessionId = readAccessCookie(req);
        if (sessionId) {
          hasInstitutionalSession = true;
        }
      }

      if (!token && !hasInstitutionalSession) {
        // Allow access to login pages
        const onAdminLogin = pathname.startsWith("/admin/login");
        const onInnerLogin = pathname.startsWith("/inner-circle/login");
        if (onAdminLogin || onInnerLogin) {
          return NextResponse.next();
        }

        // Redirect to login
        const loginPath = admin ? "/admin/login" : "/inner-circle/login";
        const url = new URL(loginPath, req.url);
        url.searchParams.set("returnTo", safeReturnTo(req));
        return NextResponse.redirect(url, 307);
      }

      // 6) Role gate — Admin only
      if (admin && token) {
        const role = String((token as any)?.role ?? "guest").toLowerCase();
        const rank = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] ?? 0;
        const required = ROLE_HIERARCHY.admin ?? 100;

        if (rank < required) {
          if (api) {
            return jsonResponse({ error: "CLEARANCE_REQUIRED", required: "admin" }, 403);
          }
          return NextResponse.redirect(new URL("/auth/access-denied", req.url));
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[AUTH_ERROR]", error);
      }
      
      if (api) {
        return jsonResponse({ error: "AUTHENTICATION_ERROR" }, 500);
      }
      
      const loginPath = admin ? "/admin/login" : "/inner-circle/login";
      const url = new URL(loginPath, req.url);
      url.searchParams.set("returnTo", safeReturnTo(req));
      url.searchParams.set("error", "Authentication failed");
      return NextResponse.redirect(url, 307);
    }
  }

  // 7) Sensitive operations (secondary token check)
  if (isSensitiveOperation(pathname, req.method)) {
    const confirmationToken = req.headers.get("x-confirmation-token");
    const expectedToken = process.env.CONFIRMATION_TOKEN_SECRET;
    
    if (!confirmationToken || !expectedToken || confirmationToken !== expectedToken) {
      return jsonResponse(
        { error: "PRECONDITION_REQUIRED", message: "Valid confirmation token required." },
        428
      );
    }
  }

  // 8) Success — apply security headers
  const response = NextResponse.next();
  
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  if (admin || inner) {
    response.headers.set("Cache-Control", "no-store, private, must-revalidate");
  }
  
  if (!response.headers.has("X-Request-ID")) {
    response.headers.set("X-Request-ID", crypto.randomUUID?.() || Date.now().toString());
  }

  return response;
}

export default middleware;
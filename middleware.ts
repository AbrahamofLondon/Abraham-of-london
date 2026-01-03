/* middleware.ts - Enterprise V5.5
 * Verified Asset Guard & Edge-Native Rate Limiter
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { 
  rateLimit, 
  getClientIp, 
  getRateLimitKeys, 
  checkMultipleRateLimits,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS 
} from "@/lib/server/rateLimit-edge";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

/* -------------------------------------------------------------------------- */
/* 1. CONFIGURATION                                                           */
/* -------------------------------------------------------------------------- */

const ROUTE_SECURITY_CONFIG = {
  "/board": { mode: "strict", type: "board" },
  "/inner-circle": { mode: "strict", type: "system" },
  "/strategies": { mode: "hybrid", type: "strategy" },
  "/canons": { mode: "hybrid", type: "canon" },
  "/resources": { mode: "public_default", type: "resource" },
};

const SAFE_EXACT = ["/inner-circle/login", "/inner-circle/register", "/inner-circle/locked", "/health", "/ping", "/", "/privacy", "/terms"];
const SAFE_PREFIXES = ["/_next/", "/api/", "/icons/", "/fonts/", "/images/"];

/* -------------------------------------------------------------------------- */
/* 2. MAIN MIDDLEWARE LOGIC                                                   */
/* -------------------------------------------------------------------------- */

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);
  const hasAccess = req.cookies.get(INNER_CIRCLE_COOKIE_NAME)?.value === "true";

  // A. BYPASS CHECKS
  if (SAFE_PREFIXES.some(p => pathname.startsWith(p)) || SAFE_EXACT.includes(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // B. ASSET GUARD (Protecting the 24 discovered sources)
  // Intercepts direct access to generated PDFs in /assets/downloads
  if (pathname.startsWith("/assets/downloads/")) {
    if (!hasAccess) {
      console.warn(`[SECURITY] Blocked unauthorized asset request: ${pathname} from ${ip}`);
      return redirectLocked(req, pathname, "unauthorized-asset-access");
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // C. WAF BLOCKING
  const MALICIOUS_PATTERNS = [/wp-admin/i, /wp-login/i, /\.php$/i, /\.env$/i, /\.git/i, /sql-injection/i, /\.\.\//, /eval\(/i];
  if (MALICIOUS_PATTERNS.some(p => p.test(pathname.toLowerCase()))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // D. RATE LIMITING
  const globalKeys = getRateLimitKeys(req, "global");
  const { worstResult: globalResult } = checkMultipleRateLimits(globalKeys, RATE_LIMIT_CONFIGS.API_GENERAL);
  if (!globalResult.allowed) return createRateLimitedResponse(globalResult);

  // E. ROUTE CONTENT GATING
  for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      if (config.mode === "strict" && !hasAccess) {
        if (pathname === "/inner-circle/login") break; 
        return redirectLocked(req, pathname, `protected-${config.type}`);
      }
      if (config.mode === "hybrid") {
        const resourceResult = rateLimit(`resource:${ip}`, { limit: 30, windowMs: 60000 });
        if (!resourceResult.allowed) return createRateLimitedResponse(resourceResult);
      }
    }
  }

  const response = NextResponse.next();
  Object.entries(createRateLimitHeaders(globalResult)).forEach(([k, v]) => response.headers.set(k, v));
  response.headers.set("X-Access-Level", hasAccess ? "inner-circle" : "public");
  return applySecurityHeaders(response);
}

// Helpers
function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; frame-ancestors 'none';");
  return res;
}

function redirectLocked(req: NextRequest, returnTo: string, reason: string) {
  const url = req.nextUrl.clone();
  url.pathname = "/inner-circle/locked";
  url.searchParams.set("returnTo", returnTo);
  url.searchParams.set("reason", reason);
  return applySecurityHeaders(NextResponse.redirect(url));
}

function createRateLimitedResponse(result: any): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: "Rate limit exceeded", retryAfter: Math.ceil(result.retryAfterMs / 1000) }),
    { status: 429, headers: { "Content-Type": "application/json", ...createRateLimitHeaders(result) } }
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
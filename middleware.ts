/* middleware.ts - Enterprise V5.0
 * Aligned with ContentHelper v5.1.0 & Unified Rate Limiter
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { 
  rateLimit, 
  getClientIp, 
  getRateLimitKeys, 
  checkMultipleRateLimits,
  rateLimitWithBackoff,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS 
} from "@/lib/server/rateLimit-unified";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

/* -------------------------------------------------------------------------- */
/* 1. ROUTING & CONTENT CONFIGURATION (NEW)                                   */
/* -------------------------------------------------------------------------- */

// Map of route prefixes to their security requirements
const ROUTE_SECURITY_CONFIG = {
  // STRICT: Requires login, no exceptions
  "/board": { mode: "strict", type: "board" },
  "/inner-circle": { mode: "strict", type: "system" },
  
  // HYBRID: Checks specific paths, delegates detailed gating to Page level
  "/strategies": { mode: "hybrid", type: "strategy" },
  "/canons": { mode: "hybrid", type: "canon" },
  "/resources": { mode: "public_default", type: "resource" },
  
  // PUBLIC-FIRST: Rate limited but generally open
  "/blog": { mode: "public", type: "post" },
  "/shorts": { mode: "public", type: "short" },
  "/events": { mode: "public", type: "event" },
  "/podcasts": { mode: "public", type: "podcast" },
  // ... maps to all 24 contexts
};

// Explicit exceptions for strict routes
const SAFE_EXACT = [
  "/inner-circle/login", // Fix: Login must be accessible
  "/inner-circle/register",
  "/inner-circle/locked",
  "/health",
  "/ping",
  "/",
  "/privacy",
  "/terms"
];

const SAFE_PREFIXES = [
  "/_next/", "/api/", "/assets/", "/icons/", "/public/", "/fonts/", "/images/"
];

// Content that is manually forced public (Bypasses strict checks)
const PUBLIC_OVERRIDES = new Set([
  "canon/canon-campaign", 
  "canon/public-preview",
  "strategies/teaser-strategy"
]);

/* -------------------------------------------------------------------------- */
/* 2. SECURITY PATTERNS (Existing WAF Logic)                                  */
/* -------------------------------------------------------------------------- */

const MALICIOUS_PATTERNS = [
  /wp-admin/i, /wp-login/i, /\.php$/i, /\.env$/i, /\.git/i, /sql-injection/i,
  /\.\.\//, /%00/, /eval\(/i, /<script>/i
];

const BAD_USER_AGENTS = [
  /bot/i, /spider/i, /scanner/i, /sqlmap/i, /nikto/i, /metasploit/i
];

function applySecurityHeaders(res: NextResponse): NextResponse {
  const headers = res.headers;
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self';"
  );
  return res;
}

function isMalicious(pathname: string, userAgent: string | null): boolean {
  if (MALICIOUS_PATTERNS.some(p => p.test(pathname.toLowerCase()))) return true;
  if (userAgent && BAD_USER_AGENTS.some(p => p.test(userAgent))) return true;
  return false;
}

/* -------------------------------------------------------------------------- */
/* 3. MIDDLEWARE MAIN LOGIC                                                   */
/* -------------------------------------------------------------------------- */

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent');
  
  // A. ACCESS STATE
  const hasAccess = req.cookies.get(INNER_CIRCLE_COOKIE_NAME)?.value === "true";

  // B. BYPASS CHECKS
  if (SAFE_PREFIXES.some(p => pathname.startsWith(p)) || SAFE_EXACT.includes(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // C. WAF BLOCKING
  if (isMalicious(pathname, userAgent)) {
    console.warn(`[WAF] Blocked ${pathname} from ${ip}`);
    return new NextResponse("Forbidden", { status: 403 });
  }

  // D. RATE LIMITING (Unified System)
  // Layer 1: Global
  const globalKeys = getRateLimitKeys(req, "global");
  const { worstResult: globalResult } = checkMultipleRateLimits(globalKeys, RATE_LIMIT_CONFIGS.API_GENERAL);
  
  if (!globalResult.allowed) {
    return createRateLimitedResponse(globalResult);
  }

  // Layer 2: API Specific
  if (pathname.startsWith("/api/")) {
    const apiResult = rateLimit(`api:${ip}:${pathname}`, RATE_LIMIT_CONFIGS.API_STRICT);
    if (!apiResult.allowed) return createRateLimitedResponse(apiResult);
  }

  // E. CONTENT GATING (The Missing Piece)
  // Iterate through security config to find matching route rules
  for (const [routePrefix, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      
      // 1. Strict Mode: Block root and all children unless logged in
      if (config.mode === "strict" && !hasAccess) {
        // Allow login page through if it matches prefix (handled in SAFE_EXACT, but safety double-check)
        if (pathname === "/inner-circle/login") break; 
        
        return redirectLocked(req, pathname, `protected-${config.type}`);
      }

      // 2. Hybrid Mode: Specific Rate Limits & checks
      if (config.mode === "hybrid") {
        // Heavier rate limit for valuable content
        const resourceResult = rateLimitWithBackoff(`resource:${ip}`, {
          limit: 30, windowMs: 60000, keyPrefix: "resource", backoffFactor: 2
        });
        if (!resourceResult.allowed) return createRateLimitedResponse(resourceResult);

        // Canon Specific Logic (Legacy Support)
        if (config.type === "canon" && !hasAccess) {
          const slug = pathname.replace("/canons/", "").replace("/canon/", ""); // Handle both
          // Check if this specific slug is in the override list
          const isOverride = PUBLIC_OVERRIDES.has(`canon/${slug}`);
          if (!isOverride && slug.length > 0) { // Only block actual pages, not the root index if you want that public
             return redirectLocked(req, pathname, "canon-access");
          }
        }
      }
    }
  }

  // F. RESPONSE GENERATION
  const response = NextResponse.next();
  
  // Inject Tracking Headers
  Object.entries(createRateLimitHeaders(globalResult)).forEach(([k, v]) => response.headers.set(k, v));
  response.headers.set("X-Access-Level", hasAccess ? "inner-circle" : "public");
  
  return applySecurityHeaders(response);
}

// Helper: Consistent Redirects
function redirectLocked(req: NextRequest, returnTo: string, reason: string) {
  const url = req.nextUrl.clone();
  url.pathname = "/inner-circle/locked";
  url.searchParams.set("returnTo", returnTo);
  url.searchParams.set("reason", reason);
  return applySecurityHeaders(NextResponse.redirect(url));
}

// Helper: Rate Limit Response
function createRateLimitedResponse(result: any): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: "Rate limit exceeded", retryAfter: Math.ceil(result.retryAfterMs / 1000) }),
    { status: 429, headers: { "Content-Type": "application/json", ...createRateLimitHeaders(result) } }
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
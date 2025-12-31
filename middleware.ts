/* middleware.ts */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/server/rateLimit-edge";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

const SAFE_PREFIXES: string[] = [
  "/_next/",
  "/api/",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
  "/assets/",
  "/icons/",
];

const SAFE_EXACT: string[] = [
  "/inner-circle",
  "/inner-circle/",
  "/inner-circle/locked",
  "/inner-circle/unlock",
  "/inner-circle/register",
  "/inner-circle/resend",
];

const PUBLIC_CANON = new Set<string>(["canon-campaign", "canon-master-index-preview"]);
const FORCE_RESTRICTED_CANON = new Set<string>(["the-builders-catechism"]);

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

function isMalicious(pathnameLower: string): boolean {
  const BAD = ["wp-admin", ".php", ".env", "server-status", ".git", "wp-login"];
  return BAD.some((p) => pathnameLower.includes(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const lower = pathname.toLowerCase();
  
  // PRIMARY ACCESS CHECK (Cookie-based)
  const hasAccess = req.cookies.get(INNER_CIRCLE_COOKIE_NAME)?.value === "true";

  // 0) Safety Gates
  if (
    SAFE_PREFIXES.some((p) => pathname.startsWith(p)) || 
    SAFE_EXACT.includes(pathname) || 
    pathname.startsWith("/inner-circle/")
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 1) Block Probes
  if (isMalicious(lower)) {
    return applySecurityHeaders(new NextResponse("Forbidden", { status: 403 }));
  }

  // 2) PERIMETER GUARD: Global API & Dashboard Rate Limiting
  const ip = getClientIp(req);
  const limitResult = rateLimit(`global:${ip}`, { 
    limit: 100, 
    windowMs: 15 * 60 * 1000,
    keyPrefix: "perimeter" 
  });

  if (!limitResult.allowed) {
    const response = new NextResponse("Rate limit exceeded. Too many requests from this principal origin.", { 
      status: 429 
    });
    
    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", limitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", limitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", Math.ceil(limitResult.resetTime / 1000).toString());
    if (limitResult.retryAfterMs > 0) {
      response.headers.set("Retry-After", Math.ceil(limitResult.retryAfterMs / 1000).toString());
    }
    
    return applySecurityHeaders(response);
  }

  // 3) BOARD GATE: Restricted Oversight
  if (pathname.startsWith("/board/")) {
    if (!hasAccess) {
      const url = req.nextUrl.clone();
      url.pathname = "/inner-circle/locked";
      url.searchParams.set("returnTo", pathname);
      return applySecurityHeaders(NextResponse.redirect(url, 302));
    }
  }

  // 4) CANON GATE: Content Gating Logic
  if (pathname.startsWith("/canon/")) {
    const slug = pathname.slice("/canon/".length).replace(/\/+$/, "").toLowerCase();
    
    if (slug) {
      const forceRestricted = FORCE_RESTRICTED_CANON.has(slug);
      const isPublicSlug = !forceRestricted && PUBLIC_CANON.has(slug);

      if (!isPublicSlug && !hasAccess) {
        const url = req.nextUrl.clone();
        url.pathname = "/inner-circle/locked";
        url.searchParams.set("returnTo", pathname);
        return applySecurityHeaders(NextResponse.redirect(url, 302));
      }
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/|icons/|api/|inner-circle/).*)",
  ],
};
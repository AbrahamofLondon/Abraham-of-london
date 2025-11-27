// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// 1. PRE-APPROVED SAFE ROUTES (static assets, images, system files)
// ---------------------------------------------------------------------------
const SAFE_PREFIXES = [
  "/_next/",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
  "/assets/",
  "/icons/",
  "/api/webhooks/", // allow inbound trusted webhooks only
];

// ---------------------------------------------------------------------------
// 2. CANON ACCESS SETTINGS
// ---------------------------------------------------------------------------
const PUBLIC_CANON = new Set([
  "canon-campaign",
  "canon-master-index-preview",
  "the-builders-catechism",
]);

// ---------------------------------------------------------------------------
// 3. SECURITY HEADERS — HSTS + XSS + FRAME + ISOLATION
// ---------------------------------------------------------------------------
function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "same-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  return res;
}

// ---------------------------------------------------------------------------
// 4. SANITISE SUSPICIOUS REQUESTS
// ---------------------------------------------------------------------------
function isMalicious(req: NextRequest): boolean {
  const url = req.nextUrl.pathname;

  // Block common probing attempts
  const BAD_PATTERNS = [
    "wp-admin",       // WordPress attack bots
    "php",            // PHP exploit scans
    ".env",           // environment leakage
    "server-status",
    ".git",
    "admin",
    "login",
    "console",
  ];

  return BAD_PATTERNS.some((p) => url.includes(p));
}

// ---------------------------------------------------------------------------
// 5. MAIN MIDDLEWARE
// ---------------------------------------------------------------------------
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // -----------------------------------------------------
  // 5A. Let safe static routes pass through
  // -----------------------------------------------------
  if (SAFE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // -----------------------------------------------------
  // 5B. Block malicious probes immediately
  // -----------------------------------------------------
  if (isMalicious(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // -----------------------------------------------------
  // 5C. Enforce Canon Access Control
  // -----------------------------------------------------
  if (pathname.startsWith("/canon/")) {
    const slug = pathname.replace("/canon/", "").trim();

    // check if Canon doc is public
    const isPublic = PUBLIC_CANON.has(slug);

    // check Inner Circle membership
    const cookie = req.cookies.get("innerCircleAccess")?.value === "true";

    if (!isPublic && !cookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/inner-circle/locked";
      const res = NextResponse.redirect(url);
      return applySecurityHeaders(res);
    }
  }

  // -----------------------------------------------------
  // 5D. Enforce global request sanitation (strict Origin + Method)
  // -----------------------------------------------------
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    const origin = req.headers.get("origin");
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL;

    if (origin && allowedOrigin && origin !== allowedOrigin) {
      return new NextResponse("Invalid Origin", { status: 403 });
    }
  }

  // -----------------------------------------------------
  // 5E. Apply high-security headers to ALL pages
  // -----------------------------------------------------
  const res = NextResponse.next();
  return applySecurityHeaders(res);
}

// ---------------------------------------------------------------------------
// 6. MIDDLEWARE SCOPE — ALL PAGES EXCEPT STATIC ASSETS
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|sitemap.xml|robots.txt|assets/).*)",
  ],
};
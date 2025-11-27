import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// 1. SAFE STATIC PREFIXES (skip middleware)
// ---------------------------------------------------------------------------
const SAFE_PREFIXES = [
  "/_next/",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
  "/assets/",
  "/icons/",
  "/api/webhooks/",
];

// ---------------------------------------------------------------------------
// 2. PUBLIC CANON DOCS (No Inner Circle gating)
// ---------------------------------------------------------------------------
const PUBLIC_CANON = new Set([
  "canon-campaign",
  "canon-master-index-preview",
  "the-builders-catechism",
]);

// ---------------------------------------------------------------------------
// 3. SECURITY HEADERS (unified + Netlify compatible)
// ---------------------------------------------------------------------------
function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY"); // unified setting
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "same-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  return res;
}

// ---------------------------------------------------------------------------
// 4. BLOCK MALICIOUS REQUEST PATHS
// ---------------------------------------------------------------------------
function isMalicious(req: NextRequest): boolean {
  const url = req.nextUrl.pathname.toLowerCase();

  const BAD_PATTERNS = [
    "wp-admin",
    ".php",
    ".env",
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
  const pathname = req.nextUrl.pathname;

  // 5A — Skip static assets
  if (SAFE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 5B — Block malicious probes
  if (isMalicious(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 5C — Canon Access Control
  if (pathname.startsWith("/canon/")) {
    let slug = pathname.replace("/canon/", "").replace(/\/$/, "").trim();

    const isPublic = PUBLIC_CANON.has(slug);
    const hasAccess = req.cookies.get("innerCircleAccess")?.value === "true";

    if (!isPublic && !hasAccess) {
      const url = req.nextUrl.clone();
      url.pathname = "/inner-circle/locked";
      const res = NextResponse.redirect(url);
      return applySecurityHeaders(res);
    }
  }

  // 5D — Origin Enforcement for mutating methods
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const allowed = process.env.NEXT_PUBLIC_SITE_URL;

    if (origin && allowed && origin !== allowed) {
      return new NextResponse("Invalid Origin", { status: 403 });
    }
  }

  // 5E — Apply Security Headers Globally
  const res = NextResponse.next();
  return applySecurityHeaders(res);
}

// ---------------------------------------------------------------------------
// 6. MIDDLEWARE SCOPE
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|sitemap.xml|robots.txt|assets/).*)",
  ],
};
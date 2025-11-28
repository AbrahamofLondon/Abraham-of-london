// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

// Routes we never touch with gating logic (handled by Next/static pipeline)
const SAFE_PREFIXES = [
  "/_next/",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
  "/assets/",
  "/icons/",
  "/api/webhooks/",
];

// Publicly visible canon docs (everything else stays gated by default)
const PUBLIC_CANON = new Set<string>([
  "canon-campaign",
  "canon-master-index-preview",
  // NOTE: we removed "the-builders-catechism" so it is no longer public.
  // "volume-i-foundations-of-purpose", // keep commented or move to FORCE_RESTRICTED_CANON if needed
]);

// Slugs that are ALWAYS gated, even if someone later adds them to PUBLIC_CANON.
// This is your "access level restriction takes precedence" safety net.
const FORCE_RESTRICTED_CANON = new Set<string>([
  "the-builders-catechism",
  // Add any others here that must NEVER be public:
  // "volume-i-foundations-of-purpose",
]);

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return res;
}

function isMalicious(req: NextRequest): boolean {
  const url = req.nextUrl.pathname.toLowerCase();

  const BAD_PATTERNS = [
    "wp-admin",
    ".php",
    ".env",
    "server-status",
    ".git",
    "wp-login",
  ];

  return BAD_PATTERNS.some((p) => url.includes(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Bypass for static / framework internals
  if (SAFE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const res = NextResponse.next();
    return applySecurityHeaders(res);
  }

  // 2) Block obvious junk probes
  if (isMalicious(req)) {
    const res = new NextResponse("Forbidden", { status: 403 });
    return applySecurityHeaders(res);
  }

  // 3) Canon gating (Inner Circle)
  if (pathname.startsWith("/canon/")) {
    const slug = pathname.replace("/canon/", "").replace(/\/$/, "").trim();

    const hasAccess =
      req.cookies.get(INNER_CIRCLE_COOKIE_NAME)?.value === "true";

    const isForceRestricted = FORCE_RESTRICTED_CANON.has(slug);
    // If it's force-restricted, it is NOT public. That wins over any conflicting flag.
    const isPublic = !isForceRestricted && PUBLIC_CANON.has(slug);

    if (!isPublic && !hasAccess) {
      const url = req.nextUrl.clone();
      url.pathname = "/inner-circle/locked";
      url.searchParams.set("returnTo", pathname || "/canon");
      const res = NextResponse.redirect(url);
      return applySecurityHeaders(res);
    }
  }

  // 4) Basic CSRF-ish check for mutating methods
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL;

    if (origin && allowedOrigin && origin !== allowedOrigin) {
      const res = new NextResponse("Invalid Origin", { status: 403 });
      return applySecurityHeaders(res);
    }
  }

  const res = NextResponse.next();
  return applySecurityHeaders(res);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|sitemap.xml|robots.txt|assets/).*)",
  ],
};
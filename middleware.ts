import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

// Routes we never touch
const SAFE_PREFIXES: string[] = [
  "/_next/",
  "/api/", // never gate APIs here
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
  "/assets/",
  "/icons/",
];

// Never run gating on these (prevents redirect loops)
const SAFE_EXACT: string[] = [
  "/inner-circle",
  "/inner-circle/",
  "/inner-circle/locked",
  "/inner-circle/unlock",
  "/inner-circle/register",
  "/inner-circle/resend",
];

// Public canon slugs
const PUBLIC_CANON = new Set<string>([
  "canon-campaign",
  "canon-master-index-preview",
]);

// Always restricted canon slugs
const FORCE_RESTRICTED_CANON = new Set<string>([
  "the-builders-catechism",
]);

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Avoid COEP/CORP unless you KNOW you need it; it breaks embeds, analytics, fonts, etc.
  // res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  // res.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  // res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  return res;
}

function isMalicious(pathnameLower: string): boolean {
  const BAD = ["wp-admin", ".php", ".env", "server-status", ".git", "wp-login"];
  return BAD.some((p) => pathnameLower.includes(p));
}

function cleanSlugFromPath(pathname: string, prefix: string) {
  return pathname
    .slice(prefix.length)
    .replace(/\/+$/, "")
    .trim()
    .toLowerCase();
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const lower = pathname.toLowerCase();

  // 0) Never interfere with safe/internal paths
  if (SAFE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return applySecurityHeaders(NextResponse.next());
  }
  if (SAFE_EXACT.includes(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }
  if (pathname.startsWith("/inner-circle/")) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 1) Block obvious junk probes
  if (isMalicious(lower)) {
    return applySecurityHeaders(new NextResponse("Forbidden", { status: 403 }));
  }

  // 2) Canon gating
  if (pathname.startsWith("/canon/")) {
    const slug = cleanSlugFromPath(pathname, "/canon/");

    // If someone hits /canon or /canon/ don't gate — send them to index page
    if (!slug) {
      return applySecurityHeaders(NextResponse.next());
    }

    const hasAccess = req.cookies.get(INNER_CIRCLE_COOKIE_NAME)?.value === "true";
    const forceRestricted = FORCE_RESTRICTED_CANON.has(slug);
    const isPublic = !forceRestricted && PUBLIC_CANON.has(slug);

    if (!isPublic && !hasAccess) {
      const url = req.nextUrl.clone();
      url.pathname = "/inner-circle/locked";
      url.searchParams.set("returnTo", pathname);
      const res = NextResponse.redirect(url, 302);
      return applySecurityHeaders(res);
    }
  }

  // 3) Mutating method origin check (API layer should handle this, but keep lightweight)
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const allowed = process.env.NEXT_PUBLIC_SITE_URL;

    // Allow same-origin + Netlify preview deploys
    if (origin && allowed) {
      const o = origin.replace(/\/+$/, "");
      const a = allowed.replace(/\/+$/, "");
      const isSame = o === a;
      const isNetlifyPreview = o.endsWith(".netlify.app");
      if (!isSame && !isNetlifyPreview) {
        return applySecurityHeaders(new NextResponse("Invalid Origin", { status: 403 }));
      }
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    // Exclude framework + common static, and exclude inner-circle entirely
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/|icons/|api/|inner-circle/).*)",
  ],
};
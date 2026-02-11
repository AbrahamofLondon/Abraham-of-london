/* proxy.ts — EDGE PERIMETER (Next.js proxy convention) */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROLE_HIERARCHY } from "@/types/auth";

/**
 * Optional: allow specific slugs to bypass auth entirely
 * (keeps prelude assets public even if they sit behind a matched route)
 */
const PUBLIC_ASSETS = new Set<string>([
  "the-architecture-of-human-purpose-landing",
  "canon-builders-rule-of-life",
]);

/**
 * Optional: internal generator bypass for preview routes
 * (only works if you include /registry in matcher)
 */
const INTERNAL_PREVIEW_PREFIX = "/registry/preview";

export const config = {
  matcher: [
    "/admin/:path*",
    "/inner-circle/:path*",
    "/api/vault/:path*",
    "/strategy/:path*",
    "/registry/:path*", // include if you want preview bypass & registry gating here
  ],
};

function getSlug(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function normalizeRole(role: unknown): string {
  return String(role || "guest").trim().toLowerCase();
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const slug = getSlug(pathname);

  // 0) DIRECTORATE BYPASS (internal generator / preview)
  if (pathname.startsWith(INTERNAL_PREVIEW_PREFIX)) {
    const internalSecret = req.headers.get("x-directorate-secret");
    if (internalSecret && internalSecret === process.env.INTERNAL_GENERATOR_SECRET) {
      return NextResponse.next();
    }
  }

  // 1) PUBLIC ASSET BYPASS (by slug)
  if (PUBLIC_ASSETS.has(slug)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 2) UNAUTHENTICATED: redirect to the right entry gate
  if (!token) {
    // allow admin login page itself
    if (pathname === "/admin/login") return NextResponse.next();

    const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/inner-circle";
    const url = new URL(loginPath, req.url);

    // preserve callback (include querystring too)
    const fullPath = req.nextUrl.pathname + req.nextUrl.search;
    url.searchParams.set("callbackUrl", fullPath);

    return NextResponse.redirect(url);
  }

  // 3) RESOLVE CLEARANCE
  const userRole = normalizeRole((token as any).role);
  const userRank =
    (ROLE_HIERARCHY as Record<string, number>)[userRole] ??
    (ROLE_HIERARCHY as Record<string, number>)["guest"] ??
    0;

  // 4) DIRECTORATE GATE (admin + vault api)
  const isDirectoratePath = pathname.startsWith("/admin") || pathname.startsWith("/api/vault");
  if (isDirectoratePath) {
    const required = (ROLE_HIERARCHY as Record<string, number>)["admin"] ?? 100;
    if (userRank < required) {
      // For APIs, return 403 JSON. For pages, send them to lockout.
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({
            error: "Forbidden: Directorate Clearance Required.",
            role: userRole,
          }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }

      const lockoutUrl = new URL("/auth/lockout", req.url);
      lockoutUrl.searchParams.set("assetId", slug || "DIRECTORATE_PROTOCOL");
      lockoutUrl.searchParams.set("reason", "DIRECTORATE_CLEARANCE_REQUIRED");
      return NextResponse.rewrite(lockoutUrl);
    }
  }

  // 5) INNER CIRCLE / STRATEGY / REGISTRY GATE
  const isStrategicPath =
    pathname.startsWith("/inner-circle") ||
    pathname.startsWith("/strategy") ||
    (pathname.startsWith("/registry") && !pathname.startsWith(INTERNAL_PREVIEW_PREFIX));

  if (isStrategicPath) {
    const required = (ROLE_HIERARCHY as Record<string, number>)["member"] ?? 40;
    if (userRank < required) {
      // Better UX: lockout page instead of a dead 403 wall
      const lockoutUrl = new URL("/auth/lockout", req.url);
      lockoutUrl.searchParams.set("assetId", slug || "SYSTEM_PROTOCOL");
      lockoutUrl.searchParams.set("reason", "CLEARANCE_LEVEL_INSUFFICIENT");
      return NextResponse.rewrite(lockoutUrl);
    }
  }

  return NextResponse.next();
}
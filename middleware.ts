import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { edgeRateLimit } from "@/lib/server/rate-limit-edge";
import { ROLE_HIERARCHY } from "@/types/auth";

export const config = {
  matcher: [
    "/admin/:path*", 
    "/inner-circle/:path*", 
    "/api/restricted/:path*", // Protect your new encrypted API routes
  ],
};

/**
 * Helper to extract IP for rate limiting
 */
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0]?.trim() : "unknown";
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip = getClientIp(req);

  // --- 1. RATE LIMITING ---
  // Ensuring the system isn't brute-forced at the edge
  if (process.env.NODE_ENV === "production" && process.env.DISABLE_EDGE_RATE_LIMIT !== "true") {
    const rl = await edgeRateLimit({
      key: `edge:${ip}:${path}`,
      windowSeconds: 60,
      limit: 60,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retryAfterSeconds: rl.retryAfterSeconds ?? 60 },
        { status: 429 }
      );
    }
  }

  // --- 2. AUTHENTICATION (NEXT-AUTH) ---
  // Using getToken is the clean, official way to decode the session at the Edge
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // If no token exists, redirect to the specific login page defined in authOptions
  if (!token) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // --- 3. AUTHORIZATION (THE 403 GATE) ---
  const userRole = (token.role as string) || "guest";

  // ENFORCE: Directorate Access (Admin/Founder)
  if (path.startsWith("/admin") || path.startsWith("/api/restricted")) {
    const hasDirectorateClearance = 
      ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] >= ROLE_HIERARCHY["admin"];

    if (!hasDirectorateClearance) {
      console.warn(`🛑 CLEARANCE VIOLATION: ${ip} attempted to access ${path} with role: ${userRole}`);
      return new NextResponse(
        "Forbidden: Directorate Clearance (Admin/Founder) Required.", 
        { status: 403 }
      );
    }
  }

  // ENFORCE: Inner Circle Access (Member+)
  if (path.startsWith("/inner-circle")) {
    const hasMemberClearance = 
      ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] >= ROLE_HIERARCHY["member"];

    if (!hasMemberClearance) {
      return new NextResponse(
        "Forbidden: Inner Circle Membership Required.", 
        { status: 403 }
      );
    }
  }

  // Allow the request to proceed if all gates are passed
  return NextResponse.next();
}
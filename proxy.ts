import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROLE_HIERARCHY } from "@/types/auth";

export const config = {
  matcher: ["/admin/:path*", "/inner-circle/:path*", "/api/vault/:path*", "/strategy/:path*"],
};

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 1. Unauthenticated Redirects
  if (!token) {
    // Determine the most appropriate login gate based on path intent
    const redirectPath = path.startsWith("/admin") ? "/admin/login" : "/inner-circle";
    const url = new URL(redirectPath, req.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  // 2. Resolve Clearance Levels
  const userRole = (token.role as any) || "guest";
  const userRank = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] ?? 0;

  // 3. Admin & Vault API Gate (Directorate Clearance)
  if (path.startsWith("/admin") || path.startsWith("/api/vault")) {
    if (userRank < ROLE_HIERARCHY["admin"]) {
      console.warn(`🛑 CLEARANCE VIOLATION: ${path} attempted by role=${userRole}`);
      return new NextResponse("Forbidden: Directorate Clearance Required.", { status: 403 });
    }
  }

  // 4. Inner Circle & Strategy Gate (Membership Clearance)
  // Ensures the 180 intelligence briefs are protected
  if (path.startsWith("/inner-circle") || path.startsWith("/strategy")) {
    if (userRank < ROLE_HIERARCHY["member"]) {
      return new NextResponse("Forbidden: Membership Required.", { status: 403 });
    }
  }

  return NextResponse.next();
}
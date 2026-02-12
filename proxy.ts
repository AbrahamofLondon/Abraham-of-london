/* proxy.ts — INTEGRATED EDGE PERIMETER */
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROLE_HIERARCHY } from "@/types/auth";
import { getClientIp, createRateLimitedResponse } from "@/lib/server/rate-limit-unified";
import { isAllowedIp, isSensitiveOperation, checkAdminRateLimit } from "@/lib/server/admin-security";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  // 1. IP GATE (Immediate rejection for Admin/Vault)
  const isDirectoratePath = pathname.startsWith("/admin") || pathname.startsWith("/api/vault");
  if (isDirectoratePath && !isAllowedIp(ip)) {
    console.warn(`[SECURITY] Unauthorized IP ${ip} attempted access to ${pathname}`);
    return new NextResponse("Access Denied: IP Not Recognized", { status: 403 });
  }

  // 2. RATE LIMIT GATE
  if (isDirectoratePath || pathname.startsWith("/api/")) {
    const { allowed, result } = await checkAdminRateLimit(req);
    if (!allowed) return createRateLimitedResponse(result);
  }

  // 3. AUTHENTICATION GATE (Using your existing token logic)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    if (pathname === "/admin/login") return NextResponse.next();
    const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/inner-circle";
    const url = new URL(loginPath, req.url);
    url.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // 4. CLEARANCE RESOLUTION
  const userRole = String(token.role || "guest").toLowerCase();
  const userRank = (ROLE_HIERARCHY as any)[userRole] ?? 0;

  // 5. DIRECTORATE GATE
  if (isDirectoratePath) {
    const required = (ROLE_HIERARCHY as any)["admin"] ?? 100;
    if (userRank < required) {
       // Return JSON for API, Rewrite for UI
       if (pathname.startsWith("/api/")) {
         return NextResponse.json({ error: "Clearance Required" }, { status: 403 });
       }
       return NextResponse.rewrite(new URL("/auth/lockout", req.url));
    }
  }

  // 6. SENSITIVE OPERATION MULTI-FACTOR (Optional)
  if (isSensitiveOperation(pathname, req.method)) {
    if (!req.headers.get("x-confirmation-token")) {
       return NextResponse.json({ 
         error: "Precondition Required", 
         message: "Sensitive action requires secondary token." 
       }, { status: 428 });
    }
  }

  // 7. SUCCESS: Inject Security Headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Admin-IP', ip);
  response.headers.set('Cache-Control', 'no-store, private');
  
  return response;
}
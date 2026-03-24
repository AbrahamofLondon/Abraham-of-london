/* lib/access/SecurityMiddleware.ts — Security Logic Layer */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { tiers } from "@/lib/access/tiers";
import { requiredTierFromVaultPath } from "@/lib/access/tier-policy";

export async function securityMiddlewareLogic(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Determine Required Clearance
  const requiredTier = requiredTierFromVaultPath(pathname);
  if (requiredTier === "public") return NextResponse.next();

  // 2. Auth Check
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  }) as any;

  const userTier = token?.aol?.tier || "public";
  const canAccess = tiers.hasAccess(userTier, requiredTier);

  if (!canAccess) {
    /**
     * FIX: Robust IP Extraction
     * Property 'ip' does not exist on type 'NextRequest' in some strict TS configs.
     * We pull from headers first (standard for Vercel/Proxies), then fallback.
     */
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor 
      ? forwardedFor.split(",")[0] 
      : (req as any).ip || "unknown";

    // Log attempt for high-level monitoring (Middleware side)
    console.warn(`[SECURITY_ALERT] Unauthorized access attempt by ${clientIp} at ${pathname}`);

    const url = req.nextUrl.clone();
    
    // Determine redirect destination
    if (!token) {
      url.pathname = "/inner-circle/admin/login";
    } else {
      url.pathname = "/inner-circle/insufficient-clearance";
    }

    // Pass context to the landing page so it can perform a Prisma Audit Write
    url.searchParams.set("callbackUrl", pathname);
    url.searchParams.set("audit_denied", "true");
    url.searchParams.set("source_ip", clientIp);
    url.searchParams.set("required_tier", requiredTier);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
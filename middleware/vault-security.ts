/* middleware/vault-security.ts — Institutional Access Gate */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { tiers } from "@/lib/access/tiers";
import { requiredTierFromVaultPath } from "@/lib/access/tier-policy";

/**
 * LOCAL TYPE OVERRIDE
 * Explicitly define the JWT shape for the Edge runtime.
 */
interface ExtendedJWT {
  sub?: string;
  email?: string;
  aol?: {
    tier: string;
    innerCircleAccess: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export async function vaultSecurityMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only intercept vault or protected asset paths
  if (!pathname.startsWith("/vault") && !pathname.startsWith("/api/vault")) {
    return NextResponse.next();
  }

  // 1. Determine Required Clearance from Path SSOT
  const requiredTier = requiredTierFromVaultPath(pathname);

  // Public assets bypass the check
  if (requiredTier === "public") {
    return NextResponse.next();
  }

  // 2. Retrieve Institutional JWT
  const token = (await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })) as ExtendedJWT | null;

  // 3. Evaluate Access
  const userTier = token?.aol?.tier || "public";
  const canAccess = tiers.hasAccess(userTier, requiredTier);

  if (!canAccess) {
    /**
     * FIX: Use a robust IP extraction that avoids TS property errors.
     * req.ip is sometimes missing from the type definition in strict mode.
     */
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor 
      ? forwardedFor.split(",")[0] 
      : (req as any).ip || "127.0.0.1";

    /**
     * NOTE: If using Prisma-based auditLogger, this must be called 
     * via an internal API route because Prisma doesn't run in Edge Middleware.
     * For now, we ensure the metadata structure is ready.
     */
    console.warn(`[ACCESS_DENIED] ${clientIp} -> ${pathname} (Req: ${requiredTier}, Has: ${userTier})`);

    // Redirect to login or insufficient clearance page
    const url = req.nextUrl.clone();
    
    // Logic: If they are logged in but don't have rank, send to clearance page.
    // If they aren't logged in, send to login.
    url.pathname = token 
      ? "/inner-circle/insufficient-clearance" 
      : "/inner-circle/admin/login";
    
    url.searchParams.set("callbackUrl", pathname);
    
    // We append flags so the destination page can trigger a server-side audit log
    url.searchParams.set("audit_denied", "true"); 
    url.searchParams.set("source_ip", clientIp);
    
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
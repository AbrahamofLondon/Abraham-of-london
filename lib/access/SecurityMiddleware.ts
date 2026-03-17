import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { tiers } from "@/lib/access/tiers";
import { requiredTierFromVaultPath } from "@/lib/access/tier-policy";

/**
 * LOCAL TYPE OVERRIDE
 * Explicitly define the JWT shape for the Edge runtime to prevent
 * the "Property 'tier' does not exist on type '{}'" error.
 */
interface ExtendedJWT {
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

  // 2. Retrieve Institutional JWT with Local Type Assertion
  const token = (await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })) as ExtendedJWT | null;

  // 3. Evaluate Access
  // Using the asserted type, token.aol.tier is now safe to access
  const userTier = token?.aol?.tier || "public";
  const canAccess = tiers.hasAccess(userTier, requiredTier);

  if (!canAccess) {
    // Redirect to login or insufficient clearance page
    const url = req.nextUrl.clone();
    url.pathname = token ? "/inner-circle/insufficient-clearance" : "/inner-circle/admin/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
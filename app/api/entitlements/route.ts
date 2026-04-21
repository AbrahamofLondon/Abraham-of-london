import { NextRequest, NextResponse } from "next/server";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { prisma } from "@/lib/prisma.server";

/**
 * GET /api/entitlements?slug=decision-exposure-instrument
 *   → Returns entitlement state for the current user + slug
 *
 * GET /api/entitlements
 *   → Returns all active entitlements for the current user (library view)
 */

export async function GET(req: NextRequest) {
  try {
    const identity = await resolveIdentity(req);
    const slug = new URL(req.url).searchParams.get("slug");

    // If no auth at all, return unauthenticated state
    if (!identity.authenticated && !identity.email) {
      return NextResponse.json({
        ok: true,
        authenticated: false,
        entitlements: [],
        access: slug ? "NO_ACCESS" : undefined,
      });
    }

    const userId = identity.subjectId ?? null;
    const email = identity.email ?? null;

    // Single slug check
    if (slug) {
      const entitlement = await resolveCanonicalEntitlement({
        userId,
        email,
        slug,
        tier: identity.tier,
      });

      return NextResponse.json({
        ok: true,
        authenticated: identity.authenticated,
        slug,
        access: entitlement.granted ? "HAS_ACCESS" : "NO_ACCESS",
        source: entitlement.source ?? null,
      });
    }

    // Full library: list all active entitlements for this user
    const emailKey = email ?? (userId ? `user:${userId}` : null);
    const entitlements: Array<{
      slug: string;
      source: string;
      grantedAt: string;
    }> = [];

    // ClientEntitlement (email-based, primary)
    if (emailKey) {
      const clientRows = await prisma.clientEntitlement.findMany({
        where: {
          email: emailKey,
          status: "active",
        },
        orderBy: { createdAt: "desc" },
      });

      for (const row of clientRows) {
        entitlements.push({
          slug: row.productCode,
          source: row.source ?? "unknown",
          grantedAt: row.createdAt.toISOString(),
        });
      }
    }

    // Legacy Entitlement (userId-based)
    if (userId) {
      const legacyRows = await prisma.entitlement.findMany({
        where: {
          userId,
          type: "ARTIFACT",
          status: "ACTIVE",
        },
        orderBy: { issuedAt: "desc" },
      });

      for (const row of legacyRows) {
        // Skip if already found via email
        if (!entitlements.some((e) => e.slug === row.key)) {
          entitlements.push({
            slug: row.key,
            source: "legacy_user",
            grantedAt: row.issuedAt.toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      authenticated: identity.authenticated,
      email: email ?? undefined,
      entitlements,
    });
  } catch (err) {
    console.error("[entitlements-api]", err);
    return NextResponse.json(
      { error: "Failed to resolve entitlements" },
      { status: 500 },
    );
  }
}

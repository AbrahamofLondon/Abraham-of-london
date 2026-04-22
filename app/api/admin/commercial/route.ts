import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { getAllProducts } from "@/lib/commercial/catalog";
import { grantCanonicalEntitlement, resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";

/**
 * GET /api/admin/commercial — Commercial control dashboard data
 *
 * Query params:
 *   ?email=user@example.com — lookup entitlements for a specific email
 *   ?failed=true — show failed entitlement grants
 *   (no params) — show product catalog + recent activity
 */

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminAppRoute();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const showFailed = searchParams.get("failed") === "true";

    // Email lookup — answer "did they pay, was entitlement granted"
    if (email) {
      const entitlements = await prisma.clientEntitlement.findMany({
        where: { email: email.toLowerCase() },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        ok: true,
        email,
        entitlements: entitlements.map((e) => ({
          id: e.id,
          productCode: e.productCode,
          tier: e.tier,
          status: e.status,
          source: e.source,
          externalRef: e.externalRef,
          startsAt: e.startsAt.toISOString(),
          endsAt: e.endsAt?.toISOString() ?? null,
          createdAt: e.createdAt.toISOString(),
        })),
      });
    }

    // Failed grants queue
    if (showFailed) {
      const failed = await prisma.failedEntitlementGrant.findMany({
        where: { resolved: false },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        ok: true,
        failedGrants: failed.map((f) => ({
          id: f.id,
          email: f.email,
          slug: f.slug,
          source: f.source,
          error: f.error,
          createdAt: f.createdAt.toISOString(),
        })),
      });
    }

    // Product catalog overview
    const [
      totalEntitlements,
      activeEntitlements,
      recentGrants,
      failedCount,
    ] = await Promise.all([
      prisma.clientEntitlement.count(),
      prisma.clientEntitlement.count({ where: { status: "active" } }),
      prisma.clientEntitlement.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          email: true,
          productCode: true,
          source: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.failedEntitlementGrant.count({ where: { resolved: false } }),
    ]);

    return NextResponse.json({
      ok: true,
      catalog: {
        products: getAllProducts().map((p) => ({
          code: p.code,
          entitlementSlug: p.entitlementSlug,
          name: p.displayName,
          price: p.amount / 100,
          displayPrice: p.displayPrice,
          category: p.category,
          accessType: p.accessType,
          duration: p.duration,
          active: p.active,
          hasStripeProduct: Boolean(p.stripeProductId),
          hasStripePrice: Boolean(p.stripePriceId),
          cookie: p.cookieName ?? undefined,
          includes: p.includes.length > 0 ? p.includes : undefined,
        })),
      },
      stats: {
        totalEntitlements,
        activeEntitlements,
        failedPendingCount: failedCount,
      },
      recentGrants: recentGrants.map((g) => ({
        email: g.email,
        productCode: g.productCode,
        source: g.source,
        status: g.status,
        createdAt: g.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[admin-commercial]", err);
    return NextResponse.json({ error: "Failed to load commercial data" }, { status: 500 });
  }
}

/**
 * POST /api/admin/commercial — Manual entitlement repair
 *
 * Body: { action: "repair", failedGrantId: string }
 *    or { action: "grant", email: string, slug: string }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAppRoute();
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { action } = body;

    if (action === "repair" && body.failedGrantId) {
      const failed = await prisma.failedEntitlementGrant.findUnique({
        where: { id: body.failedGrantId },
      });
      if (!failed) return NextResponse.json({ error: "Failed grant not found" }, { status: 404 });

      // Use canonical grant authority — no direct DB writes
      const granted = await grantCanonicalEntitlement({
        email: failed.email,
        slug: failed.slug,
        source: "manual",
      });

      // Verify grant succeeded durably
      const verified = await resolveCanonicalEntitlement({
        email: failed.email,
        slug: failed.slug,
      });

      if (!verified.granted || !verified.verified) {
        return NextResponse.json({ error: "Repair attempted but grant not verified. Manual DB intervention required." }, { status: 500 });
      }

      // Mark as resolved only after canonical grant is verified
      await prisma.failedEntitlementGrant.update({
        where: { id: failed.id },
        data: { resolved: true, resolvedAt: new Date(), resolvedBy: auth.email ?? auth.userId },
      });

      return NextResponse.json({ ok: true, action: "repaired", email: failed.email, slug: failed.slug });
    }

    if (action === "grant" && body.email && body.slug) {
      const granted = await grantCanonicalEntitlement({
        email: body.email.toLowerCase(),
        slug: body.slug,
        source: "manual",
      });

      if (!granted.granted) {
        return NextResponse.json({ error: "Grant failed" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, action: "granted", email: body.email, slug: body.slug });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[admin-commercial-action]", err);
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}

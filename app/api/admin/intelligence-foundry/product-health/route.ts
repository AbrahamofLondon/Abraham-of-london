// app/api/admin/intelligence-foundry/product-health/route.ts
//
// Product Health API.
// Returns live integration status for the product ladder.
// Admin-auth guarded. No mutation. No raw stack traces.

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import {
  getProductHealthOverview,
  getProductHealthForSurface,
} from "@/lib/research/product-health/product-health-service";

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const surfaceId = searchParams.get("surfaceId");

    if (surfaceId) {
      const surface = getProductHealthForSurface(surfaceId);
      if (!surface) {
        return NextResponse.json(
          { ok: false, error: `Surface "${surfaceId}" not found.` },
          { status: 404 },
        );
      }
      return NextResponse.json({ ok: true, surface });
    }

    const overview = getProductHealthOverview();
    return NextResponse.json({ ok: true, ...overview });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Product health check failed." },
      { status: 500 },
    );
  }
}

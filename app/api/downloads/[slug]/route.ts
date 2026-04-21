export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import fs from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { getUserEntitlements } from "@/lib/commercial/entitlements";
import {
  getPdfAssetIdentityBySlug,
  type PdfAssetIdentityResolved,
} from "@/lib/assets/pdf-identity";
import { resolvePdfDelivery } from "@/lib/assets/pdf-delivery";
import type { UserContext } from "@/lib/assets/pdf-access";

type RouteContext = {
  params: { slug: string } | Promise<{ slug: string }>;
};

async function getSlug(params: RouteContext["params"]): Promise<string> {
  const resolved = await params;
  return String(resolved.slug || "").replace(/\.pdf$/i, "");
}

async function buildUserContext(req: NextRequest): Promise<UserContext | null> {
  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.subjectId) return null;

  const entitlements = await getUserEntitlements(identity.subjectId);

  return {
    id: identity.subjectId,
    authenticated: identity.authenticated,
    tier: identity.tier,
    flags: identity.flags,
    entitlementSlugs: entitlements.map((entry) => entry.slug),
  };
}

function jsonBlocked(
  asset: PdfAssetIdentityResolved,
  delivery: ReturnType<typeof resolvePdfDelivery>,
  status: number,
) {
  return NextResponse.json(
    {
      ok: false,
      slug: asset.slug,
      mode: delivery.mode,
      allowed: false,
      price: delivery.price,
      originalPrice: delivery.originalPrice,
      discounted: delivery.discounted,
      reason: delivery.reason,
      nextAction: delivery.nextAction,
    },
    { status },
  );
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  let asset: PdfAssetIdentityResolved;

  try {
    asset = getPdfAssetIdentityBySlug(await getSlug(params));
  } catch {
    return NextResponse.json(
      { ok: false, error: "PDF asset not found" },
      { status: 404 },
    );
  }

  const user = await buildUserContext(req);
  const delivery = resolvePdfDelivery(user, asset);

  if (!delivery.allowed) {
    return jsonBlocked(asset, delivery, user ? 403 : 401);
  }

  const relativePath = asset.canonicalPath.replace(/^\/+/, "");
  const absolutePath = path.resolve(process.cwd(), "public", relativePath);
  const publicRoot = path.resolve(process.cwd(), "public");

  if (!absolutePath.startsWith(publicRoot + path.sep)) {
    return NextResponse.json(
      { ok: false, error: "Invalid PDF asset path" },
      { status: 500 },
    );
  }

  try {
    const file = await fs.readFile(absolutePath);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${asset.slug}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-PDF-Delivery": delivery.mode,
        "X-PDF-Asset": asset.slug,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "PDF binary missing" },
      { status: 404 },
    );
  }
}

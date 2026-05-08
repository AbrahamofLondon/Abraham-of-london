export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import fs from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
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

async function buildUserContext(
  req: NextRequest,
  asset: PdfAssetIdentityResolved,
): Promise<UserContext | null> {
  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.subjectId) return null;

  const entitlement = await resolveCanonicalEntitlement({
    userId: identity.subjectId,
    email: identity.email,
    slug: asset.slug,
    tier: identity.tier,
    requiredTier: asset.access === "inner_circle" ? "inner_circle" : null,
  });

  return {
    id: identity.subjectId,
    authenticated: identity.authenticated,
    tier: identity.tier,
    flags: identity.flags,
    entitlementSlugs: entitlement.granted ? [asset.slug] : [],
  };
}

function resolvePrivatePdfPath(relativePath: string): { absolutePath: string; allowedRoot: string } {
  const cwd = process.cwd();
  const normalized = relativePath.replace(/^\/+/, "");

  if (normalized.startsWith("assets/downloads/")) {
    return {
      absolutePath: path.resolve(cwd, "private_storage", "premium-content", normalized),
      allowedRoot: path.resolve(cwd, "private_storage", "premium-content", "assets", "downloads"),
    };
  }

  if (normalized.startsWith("_archive/")) {
    return {
      absolutePath: path.resolve(cwd, "private_storage", "premium-content", normalized),
      allowedRoot: path.resolve(cwd, "private_storage", "premium-content", "_archive"),
    };
  }

  return {
    absolutePath: path.resolve(cwd, "private_storage", "premium-content", normalized),
    allowedRoot: path.resolve(cwd, "private_storage", "premium-content"),
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

  const user = await buildUserContext(req, asset);
  const delivery = resolvePdfDelivery(user, asset);

  if (!delivery.allowed) {
    return jsonBlocked(asset, delivery, user ? 403 : 401);
  }

  const relativePath = asset.canonicalPath.replace(/^\/+/, "");
  let absolutePath: string;
  let allowedRoot: string;

  if (asset.access === "paid") {
    absolutePath = path.resolve(
      process.cwd(),
      "private",
      "assets",
      "paid-instruments",
      `${asset.slug}.pdf`,
    );
    allowedRoot = path.resolve(process.cwd(), "private");
  } else {
    const resolved = resolvePrivatePdfPath(relativePath);
    absolutePath = resolved.absolutePath;
    allowedRoot = resolved.allowedRoot;
  }

  if (!absolutePath.startsWith(allowedRoot + path.sep)) {
    return NextResponse.json(
      { ok: false, error: "Invalid PDF asset path" },
      { status: 500 },
    );
  }

  try {
    const [allowedRootRealPath, assetRealPath, assetStat] = await Promise.all([
      fs.realpath(allowedRoot),
      fs.realpath(absolutePath),
      fs.lstat(absolutePath),
    ]);

    if (assetStat.isSymbolicLink()) {
      return NextResponse.json(
        { ok: false, error: "Symlinked PDF assets are not allowed" },
        { status: 403 },
      );
    }

    if (
      assetRealPath !== allowedRootRealPath &&
      !assetRealPath.startsWith(allowedRootRealPath + path.sep)
    ) {
      return NextResponse.json(
        { ok: false, error: "Resolved PDF asset escaped allowed root" },
        { status: 403 },
      );
    }

    const file = await fs.readFile(assetRealPath);
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
      {
        ok: false,
        error: "PDF unavailable",
        state: "unavailable",
        slug: asset.slug,
        htmlFallback: `/downloads/${encodeURIComponent(asset.slug)}`,
      },
      { status: 404 },
    );
  }
}

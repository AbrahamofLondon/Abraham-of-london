export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import {
  getDownloadManifestEntry,
  getDownloadRedirectUrl,
  type DownloadManifestEntry,
} from "@/lib/downloads/download-manifest";
import { createDownloadGrantToken } from "@/lib/downloads/security";
import type { AccessTier } from "@/lib/access/tier-policy";
import { getPdfAssetIdentityBySlug, getPdfAssetBySlug } from "@/lib/assets/pdf-identity";
import { resolvePdfDelivery } from "@/lib/assets/pdf-delivery";
import type { UserContext } from "@/lib/assets/pdf-access";

type RouteContext = {
  params: { slug: string } | Promise<{ slug: string }>;
};

function requiredTierFor(entry: DownloadManifestEntry): AccessTier {
  if (entry.accessLevel === "inner_circle") return "inner_circle";
  if (entry.accessLevel === "paid") return "client";
  if (entry.accessLevel === "restricted") return "restricted";
  return "public";
}

function appendToken(url: string, token: string | null | undefined): string {
  if (!token) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

async function getSlug(params: RouteContext["params"]): Promise<string> {
  const resolved = await params;
  return String(resolved.slug || "").replace(/\.[a-z0-9]+$/i, "");
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const slug = await getSlug(params);

  // ── Canonical PDF governance layer ─────────────────────────────────────────
  // Attempt canonical identity resolution. Canonically registered assets go
  // through getPdfAssetIdentityBySlug → resolvePdfDelivery → delivery.allowed.
  // Non-canonical slugs (manifest-only) fall through to the legacy path below.
  const canonicalIdentity = getPdfAssetBySlug(slug);
  if (canonicalIdentity) {
    if (canonicalIdentity.access === "public") {
      return NextResponse.redirect(
        new URL(canonicalIdentity.canonicalPath, req.url),
        302,
      );
    }
    const identity = await resolveIdentity(req);
    const userCtx: UserContext = {
      id: identity.subjectId ?? null,
      userId: identity.subjectId ?? null,
      authenticated: identity.authenticated,
      tier: identity.tier ?? null,
    };
    const delivery = resolvePdfDelivery(userCtx, canonicalIdentity);
    if (!delivery.allowed) {
      return NextResponse.json(
        { ok: false, error: delivery.reason, mode: delivery.mode, nextAction: delivery.nextAction },
        { status: delivery.mode === "paid" || delivery.mode === "member_only" ? 403 : 401 },
      );
    }
    const issued = await createDownloadGrantToken({
      slug,
      contentType: "downloads",
      requiredTier: requiredTierFor({ accessLevel: canonicalIdentity.access, slug, title: canonicalIdentity.title, fileType: "pdf", isPublic: false, isDownloadable: true }),
      userTier: requiredTierFor({ accessLevel: canonicalIdentity.access, slug, title: canonicalIdentity.title, fileType: "pdf", isPublic: false, isDownloadable: true }),
      contentId: slug,
      userId: identity.subjectId ?? "anonymous",
      expiresInMs: 24 * 60 * 60 * 1000,
      maxDownloads: 3,
      metadata: { authorized: true, title: canonicalIdentity.title, appRouterEndpoint: "/api/downloads/[slug]" },
    }).catch((err) => { console.error("[APP_DOWNLOAD_TOKEN_ERROR]", err); return null; });
    return NextResponse.redirect(
      new URL(appendToken(canonicalIdentity.canonicalPath, issued?.token), req.url),
      302,
    );
  }

  // ── Manifest-based fallback (legacy and non-canonical slugs) ───────────────
  const entry = getDownloadManifestEntry(slug);
  if (!entry) {
    return NextResponse.json({ ok: false, error: "Download asset not found" }, { status: 404 });
  }

  const target = getDownloadRedirectUrl(entry);
  if (!target || !entry.isDownloadable) {
    return NextResponse.json({ ok: false, error: "Download asset unavailable" }, { status: 404 });
  }

  const requiredTier = requiredTierFor(entry);
  if (requiredTier === "public") {
    return NextResponse.redirect(new URL(target, req.url), 302);
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.subjectId) {
    return NextResponse.json(
      { ok: false, error: "Authentication required", requiredTier },
      { status: 401 },
    );
  }

  const entitlement = await resolveCanonicalEntitlement({
    userId: identity.subjectId,
    email: identity.email,
    slug: entry.entitlementSlug || entry.slug,
    tier: identity.tier,
    requiredTier: entry.accessLevel === "inner_circle" ? "inner_circle" : requiredTier,
  });

  if (!entitlement.granted) {
    return NextResponse.json(
      { ok: false, error: "Insufficient entitlement", requiredTier },
      { status: 403 },
    );
  }

  const issued = await createDownloadGrantToken({
    slug: entry.slug,
    contentType: "downloads",
    requiredTier,
    userTier: requiredTier,
    contentId: entry.entitlementSlug || entry.slug,
    userId: identity.subjectId,
    expiresInMs: 24 * 60 * 60 * 1000,
    maxDownloads: 3,
    metadata: {
      authorized: true,
      title: entry.title,
      appRouterEndpoint: "/api/downloads/[slug]",
    },
  }).catch((error) => {
    console.error("[APP_DOWNLOAD_TOKEN_ERROR]", error);
    return null;
  });

  return NextResponse.redirect(new URL(appendToken(target, issued?.token), req.url), 302);
}

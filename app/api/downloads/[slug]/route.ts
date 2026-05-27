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
  const entry = getDownloadManifestEntry(await getSlug(params));
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

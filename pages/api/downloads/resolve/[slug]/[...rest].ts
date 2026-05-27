/* pages/api/downloads/resolve/[slug]/[...rest].ts — CANONICAL UNLOCK ENDPOINT */

import type { NextApiRequest, NextApiResponse } from "next";
import {
  normalizeUserTier,
  hasAccess,
  getTierLabel,
  type AccessTier,
} from "@/lib/access/tier-policy";

import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import {
  createDownloadGrantToken,
} from "@/lib/downloads/security";
import {
  buildLegacyDownloadResolveOk,
  type LegacyDownloadResolveFail,
  type LegacyDownloadResolveOk,
} from "@/lib/downloads/legacy-resolver";
import {
  getDownloadManifestEntry,
  getDownloadRedirectUrl,
  type DownloadManifestEntry,
} from "@/lib/downloads/download-manifest";

type InnerCircleAccess = {
  hasAccess: boolean;
  reason?: string;
  id?: string;
  sessionId?: string;
  tier?: string;
};

type DownloadAssetContentType = "books" | "canon" | "briefs" | "downloads";

function normalizeAssetContentType(input: unknown): DownloadAssetContentType | null {
  const value = String(input || "").trim().toLowerCase();
  if (value === "books" || value === "book") return "books";
  if (value === "canon" || value === "canons") return "canon";
  if (value === "briefs" || value === "brief") return "briefs";
  if (value === "downloads" || value === "download") return "downloads";
  return null;
}

function joinSlugParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean).join("/");
  }
  return String(value || "").trim();
}

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LegacyDownloadResolveOk | LegacyDownloadResolveFail>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  res.setHeader("Cache-Control", "private, no-store, must-revalidate");
  res.setHeader("Vary", "Cookie");

  // NOTE:
  // The folder name is [slug] only to satisfy Next's dynamic route naming rules.
  // Semantically, this is still the content type.
  const contentType = normalizeAssetContentType(req.query.slug);
  const slug = joinSlugParam(req.query.rest);

  if (!contentType || !slug) {
    return res.status(400).json({ ok: false, reason: "BAD_TARGET" });
  }

  const asset = getDownloadManifestEntry(slug);
  if (!asset) {
    return res.status(404).json({ ok: false, reason: "NOT_FOUND" });
  }

  const requiredTier = requiredTierFor(asset);
  const requiredTierLabel = getTierLabel(requiredTier);
  const target = getDownloadRedirectUrl(asset);

  if (!target || !asset.isDownloadable) {
    return res.status(404).json({ ok: false, reason: "NOT_DOWNLOADABLE" });
  }

  if (asset.isPublic) {
    return res.redirect(302, target);
  }

  const access = (await getInnerCircleAccess(req)) as InnerCircleAccess | null;

  if (!access?.hasAccess) {
    return res.status(401).json({
      ok: false,
      reason: access?.reason || "REQUIRES_AUTH",
      requiredTier,
      requiredTierLabel,
    });
  }

  const userTier = normalizeUserTier(access.tier ?? "public");

  if (!hasAccess(userTier, requiredTier)) {
    return res.status(403).json({
      ok: false,
      reason: "INSUFFICIENT_TIER",
      requiredTier,
      requiredTierLabel,
      userTier: getTierLabel(userTier),
    });
  }

  const issued = await createDownloadGrantToken({
    slug: asset.slug,
    contentType,
    requiredTier,
    userTier,
    contentId: asset.entitlementSlug || asset.slug,
    expiresInMs: 24 * 60 * 60 * 1000,
    maxDownloads: 3,
    userId: access.id,
    sessionId: access.sessionId,
    metadata: {
      authorized: true,
      title: asset.title,
    },
  }).catch((error) => {
    console.error("[DOWNLOAD_RESOLVE_TOKEN_CREATION_ERROR]", error);
    return null;
  });

  if (req.query.format === "json") {
    return res.status(200).json(
      buildLegacyDownloadResolveOk({
        asset: { ...asset, contentType },
        requiredTier,
        issued,
        userTier,
      }),
    );
  }

  return res.redirect(302, appendToken(target, issued?.token));
}

export const config = {
  api: { responseLimit: false, bodyParser: false },
};

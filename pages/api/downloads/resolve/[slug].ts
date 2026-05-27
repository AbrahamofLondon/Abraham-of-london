/* pages/api/downloads/resolve/[slug].ts — LEGACY RESOLVER ADAPTER
   Purpose:
   - preserve old callers hitting /api/downloads/resolve/[slug]
   - delegate to the canonical resolver model
   - avoid maintaining a second policy engine
*/

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

const LEGACY_SEARCH_ORDER: DownloadAssetContentType[] = [
  "downloads",
  "briefs",
  "books",
  "canon",
];

function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLegacySlug(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/^downloads\/resolve\//i, "")
    .replace(/^downloads\//i, "")
    .replace(/\/{2,}/g, "/");
}

async function resolveLegacyAsset(slug: string) {
  for (const contentType of LEGACY_SEARCH_ORDER) {
    const asset = getDownloadManifestEntry(slug);
    if (asset) return { asset, contentType };
  }
  return null;
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
    return res.status(405).json({
      ok: false,
      reason: "METHOD_NOT_ALLOWED",
    });
  }

  res.setHeader("Cache-Control", "private, no-store, must-revalidate");
  res.setHeader("Vary", "Cookie");

  const slug = normalizeLegacySlug(req.query.slug);
  if (!slug) {
    return res.status(400).json({
      ok: false,
      reason: "BAD_SLUG",
    });
  }

  const resolved = await resolveLegacyAsset(slug);
  if (!resolved) {
    return res.status(404).json({
      ok: false,
      reason: "NOT_FOUND",
    });
  }

  const { asset, contentType } = resolved;
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
      legacyEndpoint: "/api/downloads/resolve/[slug]",
    },
  }).catch((error) => {
    console.error("[DOWNLOAD_RESOLVE_LEGACY_AUTH_TOKEN_ERROR]", error);
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

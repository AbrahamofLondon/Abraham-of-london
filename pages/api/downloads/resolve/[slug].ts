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
  resolveDownloadAsset,
  type DownloadAssetContentType,
} from "@/lib/downloads/asset-registry";

type InnerCircleAccess = {
  hasAccess: boolean;
  reason?: string;
  id?: string;
  sessionId?: string;
  tier?: string;
};

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
    const asset = await resolveDownloadAsset({ contentType, slug });
    if (asset) return asset;
  }
  return null;
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

  const asset = await resolveLegacyAsset(slug);
  if (!asset) {
    return res.status(404).json({
      ok: false,
      reason: "NOT_FOUND",
    });
  }

  const requiredTier = asset.requiredTier;
  const requiredTierLabel = getTierLabel(requiredTier);

  if (asset.isPublic) {
    const issued = await createDownloadGrantToken({
      slug: asset.slug,
      contentType: asset.contentType,
      requiredTier,
      userTier: "public",
      contentId: asset.premiumContentId || asset.id,
      expiresInMs: 5 * 60 * 1000,
      maxDownloads: asset.maxDownloads ?? 100,
      userId: undefined,
      sessionId: undefined,
      metadata: {
        public: true,
        title: asset.title,
        legacyEndpoint: "/api/downloads/resolve/[slug]",
        watermarkRequired: asset.watermarkRequired,
      },
    }).catch((error) => {
      console.error("[DOWNLOAD_RESOLVE_LEGACY_PUBLIC_TOKEN_ERROR]", error);
      return null;
    });

    return res.status(200).json(
      buildLegacyDownloadResolveOk({ asset, requiredTier, issued }),
    );
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
    contentType: asset.contentType,
    requiredTier,
    userTier,
    contentId: asset.premiumContentId || asset.id,
    expiresInMs: 24 * 60 * 60 * 1000,
    maxDownloads: asset.maxDownloads ?? 3,
    userId: access.id,
    sessionId: access.sessionId,
    metadata: {
      authorized: true,
      title: asset.title,
      legacyEndpoint: "/api/downloads/resolve/[slug]",
      watermarkRequired: asset.watermarkRequired,
    },
  }).catch((error) => {
    console.error("[DOWNLOAD_RESOLVE_LEGACY_AUTH_TOKEN_ERROR]", error);
    return null;
  });

  return res.status(200).json(
    buildLegacyDownloadResolveOk({ asset, requiredTier, issued, userTier }),
  );
}

export const config = {
  api: { responseLimit: false, bodyParser: false },
};

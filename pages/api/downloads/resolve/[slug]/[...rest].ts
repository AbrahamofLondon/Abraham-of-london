/* pages/api/downloads/resolve/[slug]/[...rest].ts — CANONICAL UNLOCK ENDPOINT */

import type { NextApiRequest, NextApiResponse } from "next";
import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  hasAccess,
  getTierLabel,
} from "@/lib/access/tier-policy";

import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import {
  createDownloadGrantToken,
  getTokenForensics,
} from "@/lib/downloads/security";
import {
  resolveDownloadAsset,
  normalizeAssetContentType,
} from "@/lib/downloads/asset-registry";

type ResolveOk = {
  ok: true;
  slug: string;
  title: string;
  contentType: string;
  requiredTier: AccessTier;
  requiredTierLabel: string;
  userTier?: string;
  bodyCode?: string;
  token: string | null;
  tokenId: string | null;
  watermarkId: string | null;
  forensicFooter: string | null;
  downloadUrl: string | null;
};

type ResolveFail = {
  ok: false;
  reason: string;
  requiredTier?: AccessTier;
  requiredTierLabel?: string;
  userTier?: string;
};

type InnerCircleAccess = {
  hasAccess: boolean;
  reason?: string;
  id?: string;
  sessionId?: string;
  tier?: string;
};

function joinSlugParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean).join("/");
  }
  return String(value || "").trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResolveOk | ResolveFail>,
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

  const asset = await resolveDownloadAsset({ contentType, slug });
  if (!asset) {
    return res.status(404).json({ ok: false, reason: "NOT_FOUND" });
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
        watermarkRequired: asset.watermarkRequired,
      },
    }).catch(() => null);

    const forensics = getTokenForensics(issued?.metadata);

    return res.status(200).json({
      ok: true,
      slug: asset.slug,
      title: asset.title,
      contentType: asset.contentType,
      requiredTier,
      requiredTierLabel,
      bodyCode: asset.bodyCode || "",
      token: issued?.token ?? null,
      tokenId: issued?.tokenId ?? null,
      watermarkId: forensics.watermarkId,
      forensicFooter: forensics.expectedFooter,
      downloadUrl: `/api/downloads/${encodeURIComponent(asset.slug)}`,
    });
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
      watermarkRequired: asset.watermarkRequired,
    },
  }).catch((error) => {
    console.error("[DOWNLOAD_RESOLVE_TOKEN_CREATION_ERROR]", error);
    return null;
  });

  const forensics = getTokenForensics(issued?.metadata);

  return res.status(200).json({
    ok: true,
    slug: asset.slug,
    title: asset.title,
    contentType: asset.contentType,
    requiredTier,
    requiredTierLabel,
    userTier: getTierLabel(userTier),
    bodyCode: asset.bodyCode || "",
    token: issued?.token ?? null,
    tokenId: issued?.tokenId ?? null,
    watermarkId: forensics.watermarkId,
    forensicFooter: forensics.expectedFooter,
    downloadUrl: `/api/downloads/${encodeURIComponent(asset.slug)}`,
  });
}

export const config = {
  api: { responseLimit: false, bodyParser: false },
};

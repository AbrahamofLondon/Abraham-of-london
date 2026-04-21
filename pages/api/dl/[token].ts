/* pages/api/dl/[token].ts — SOLID TOKEN DELIVERY GATEWAY */

import type { NextApiRequest, NextApiResponse } from "next";
import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeRequiredTier,
  normalizeUserTier,
  hasAccess,
} from "@/lib/access/tier-policy";

import {
  verifyDownloadGrantToken,
  getUserTierFromCookies,
  getTokenForensics,
} from "@/lib/downloads/security";

import { logDownloadEvent } from "@/lib/downloads/audit";
import { resolveDownloadAsset } from "@/lib/downloads/asset-registry";
import { getPremiumContentAsset } from "@/lib/premium/content-registry";
import { incrementTokenUsage } from "@/lib/premium/download-token";

type DeliveryTarget =
  | {
      kind: "premium";
      slug: string;
      redirectUrl: string;
    }
  | {
      kind: "document";
      slug: string;
      redirectUrl: string;
    };

function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstCsvValue(value: string): string {
  const first = value.split(",")[0];
  return String(first || "").trim();
}

function getIp(req: NextApiRequest): string {
  const xff = req.headers["x-forwarded-for"];

  if (typeof xff === "string" && xff.trim()) {
    return firstCsvValue(xff) || "0.0.0.0";
  }

  if (Array.isArray(xff) && xff[0]) {
    return firstCsvValue(String(xff[0])) || "0.0.0.0";
  }

  return String(req.socket.remoteAddress || "0.0.0.0");
}

function getUserTier(cookieHeader: string | undefined): AccessTier {
  return normalizeUserTier(
    getUserTierFromCookies({ headers: { cookie: cookieHeader } }),
  );
}

function validateDownloadAccess(params: {
  userTier: AccessTier;
  requiredTier: AccessTier;
}): { allowed: boolean; reason?: string } {
  if (!hasAccess(params.userTier, params.requiredTier)) {
    return {
      allowed: false,
      reason: `Insufficient tier: ${params.userTier} < ${params.requiredTier}`,
    };
  }

  return { allowed: true };
}

function appendDownloadToken(url: string, token: string): string {
  if (!url.startsWith("/assets/downloads/")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}downloadToken=${encodeURIComponent(token)}`;
}

async function resolveDeliveryTarget(params: {
  contentType: string;
  slug: string;
  contentId: string;
  rawToken: string;
}): Promise<DeliveryTarget | null> {
  const asset = await resolveDownloadAsset({
    contentType: params.contentType,
    slug: params.slug,
  });

  if (!asset) return null;

  if (asset.premiumContentId || params.contentId) {
    const premiumId = safeTrim(asset.premiumContentId || params.contentId);
    if (premiumId) {
      const premiumAsset = await getPremiumContentAsset(premiumId);
      if (premiumAsset?.exists) {
        return {
          kind: "premium",
          slug: asset.slug,
          redirectUrl:
            `/api/premium/content/download/${encodeURIComponent(premiumId)}` +
            `?token=${encodeURIComponent(params.rawToken)}`,
        };
      }
    }
  }

  if (asset.downloadUrl) {
    return {
      kind: "document",
      slug: asset.slug,
      redirectUrl: appendDownloadToken(asset.downloadUrl, params.rawToken),
    };
  }

  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawToken = Array.isArray(req.query.token)
    ? req.query.token[0]
    : req.query.token;

  if (!rawToken || !safeTrim(rawToken)) {
    return res.status(400).json({ error: "Missing token" });
  }

  const ip = getIp(req);
  const ua = String(req.headers["user-agent"] || "unknown-ua");
  const ref = String(req.headers.referer || "direct");
  const cookieTier = getUserTier(req.headers.cookie);

  try {
    const verification = await verifyDownloadGrantToken(rawToken);

    if (!verification.valid || !verification.payload) {
      await logDownloadEvent({
        eventType: "TOKEN_REJECTED",
        slug: verification.slug || "unknown",
        requiredTier: String(verification.requiredTier || "public"),
        userTier: cookieTier,
        ip,
        userAgent: ua,
        referrer: ref,
        note: verification.reason || "Token verification failed",
        tokenId: verification.tokenId || undefined,
      });

      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const slug = safeTrim(verification.slug);
    const contentType = safeTrim(verification.contentType || "downloads");
    const contentId = safeTrim(verification.contentId || "");
    const requiredTier = normalizeRequiredTier(
      verification.requiredTier || "public",
    );
    const userTier = cookieTier;

    if (!slug) {
      await logDownloadEvent({
        eventType: "TOKEN_REJECTED",
        slug: "unknown",
        requiredTier,
        userTier,
        ip,
        userAgent: ua,
        referrer: ref,
        note: "Invalid token payload: missing slug",
        tokenId: verification.tokenId || undefined,
      });

      return res.status(400).json({ error: "Invalid token payload" });
    }

    const accessCheck = validateDownloadAccess({ userTier, requiredTier });

    if (!accessCheck.allowed) {
      await logDownloadEvent({
        eventType: "DOWNLOAD_DENIED",
        slug,
        requiredTier,
        userTier,
        ip,
        userAgent: ua,
        referrer: ref,
        note: accessCheck.reason || "Access denied",
        tokenId: verification.tokenId || undefined,
      });

      return res.redirect(302, "/inner-circle?error=insufficient_tier");
    }

    const target = await resolveDeliveryTarget({
      contentType,
      slug,
      contentId,
      rawToken,
    });

    if (!target) {
      await logDownloadEvent({
        eventType: "DOWNLOAD_NOT_FOUND",
        slug,
        requiredTier,
        userTier,
        ip,
        userAgent: ua,
        referrer: ref,
        note: "Resolved asset not found",
        tokenId: verification.tokenId || undefined,
      });

      return res.status(404).json({ error: "Document not found" });
    }

    const usageIncremented = await incrementTokenUsage(rawToken);

    if (!usageIncremented) {
      await logDownloadEvent({
        eventType: "TOKEN_EXHAUSTED",
        slug,
        requiredTier,
        userTier,
        ip,
        userAgent: ua,
        referrer: ref,
        note: "Download allowance exhausted",
        tokenId: verification.tokenId || undefined,
      });

      return res.status(403).json({ error: "Download allowance exhausted" });
    }

    await logDownloadEvent({
      eventType: "DOWNLOAD_GRANTED",
      slug,
      requiredTier,
      userTier,
      ip,
      userAgent: ua,
      referrer: ref,
      note: target.kind,
      tokenId: verification.tokenId || undefined,
    });

    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
    res.setHeader("X-Download-ID", slug);

    if (verification.tokenId) {
      res.setHeader("X-Token-ID", verification.tokenId);
    }

    const forensics = getTokenForensics(verification.metadata);
    if (forensics.watermarkId) {
      res.setHeader("X-Watermark-ID", forensics.watermarkId);
    }

    return res.redirect(302, target.redirectUrl);
  } catch (err) {
    console.error("[DOWNLOAD_SYSTEM_EXCEPTION]", err);

    await logDownloadEvent({
      eventType: "ACCESS_DENIED",
      slug: "unknown",
      requiredTier: "public",
      userTier: cookieTier,
      ip,
      userAgent: ua,
      referrer: ref,
      note: err instanceof Error ? err.message : "Internal server error",
    });

    return res.status(500).json({ error: "Internal server error" });
  }
}

export const config = {
  api: { responseLimit: false, bodyParser: false },
};

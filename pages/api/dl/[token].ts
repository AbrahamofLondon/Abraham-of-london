// pages/api/dl/[token].ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeRequiredTier,
  hasAccess,
} from "@/lib/access/tier-policy";
import {
  verifyDownloadToken,
  getUserTierFromCookies,
  getTokenForensics,
} from "@/lib/downloads/security";
import { logDownloadEvent } from "@/lib/downloads/audit";
import {
  getDownloadBySlug,
  getDocumentBySlug,
  resolveDocDownloadUrl,
} from "@/lib/content/server";
import { getPremiumContentAsset } from "@/lib/premium/content-registry";
import { incrementTokenUsage } from "@/lib/premium/download-token";

function getIp(req: NextApiRequest): string {
  const xff = (req.headers["x-forwarded-for"] as string) || "";
  return xff.split(",")[0]?.trim() || req.socket.remoteAddress || "0.0.0.0";
}

function getUserTier(cookieHeader: string | undefined): AccessTier {
  return getUserTierFromCookies({ headers: { cookie: cookieHeader } });
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = Array.isArray(req.query.token)
    ? req.query.token[0]
    : req.query.token;

  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  const ip = getIp(req);
  const ua = String(req.headers["user-agent"] || "unknown-ua");
  const ref = String(req.headers.referer || "direct");

  try {
    const verification = verifyDownloadToken(
      token,
      "RESOURCE_CONTEXT_PLACEHOLDER",
    );

    if (!verification.valid || !verification.payload) {
      await logDownloadEvent({
        eventType: "TOKEN_REJECTED",
        slug: verification.slug || "unknown",
        requiredTier: String(verification.requiredTier || "public"),
        userTier: getUserTier(req.headers.cookie),
        ip,
        userAgent: ua,
        referrer: ref,
        note: verification.reason || "Token verification failed",
      });

      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const slug = String(verification.slug || "").trim();
    const requiredTier = normalizeRequiredTier(
      verification.requiredTier || "public",
    );
    const userTier = getUserTier(req.headers.cookie);
    const tokenId = verification.payload.tid;
    const contentId = String(verification.payload.rid || "").trim();

    if (!slug || slug === "RESOURCE_CONTEXT_PLACEHOLDER") {
      return res.status(400).json({ error: "Invalid token payload" });
    }

    // ✅ FIXED: Added await
    const premiumAsset = contentId
      ? await getPremiumContentAsset(contentId)
      : null;

    if (premiumAsset?.exists) {
      const usageIncremented = await incrementTokenUsage(token);

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
          tokenId,
        });

        return res.status(403).json({ error: "Download allowance exhausted" });
      }

      const forensics = getTokenForensics(verification.payload.md || {});
      const premiumUrl = `/api/premium/content/download/${encodeURIComponent(
        contentId,
      )}?token=${encodeURIComponent(token)}`;

      res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
      res.setHeader("X-Download-ID", slug);
      res.setHeader("X-Token-ID", tokenId);

      if (forensics.watermarkId) {
        res.setHeader("X-Watermark-ID", forensics.watermarkId);
      }

      return res.redirect(302, premiumUrl);
    }

    const doc =
      (await getDownloadBySlug(slug)) ||
      (await getDocumentBySlug(slug)) ||
      (await getDocumentBySlug(`downloads/${slug}`));

    if (!doc) {
      await logDownloadEvent({
        eventType: "DOWNLOAD_NOT_FOUND",
        slug,
        requiredTier,
        userTier,
        ip,
        userAgent: ua,
        referrer: ref,
        note: "Document not found",
        tokenId,
      });

      return res.status(404).json({ error: "Document not found" });
    }

    const url = resolveDocDownloadUrl(doc);

    if (!url) {
      await logDownloadEvent({
        eventType: "URL_RESOLVE_FAILED",
        slug,
        requiredTier,
        userTier,
        ip,
        userAgent: ua,
        referrer: ref,
        note: "Could not resolve download URL",
        tokenId,
      });

      return res.status(500).json({ error: "Internal error resolving URL" });
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
        tokenId,
      });

      return res.redirect(302, "/inner-circle?error=insufficient_tier");
    }

    await incrementTokenUsage(token);

    await logDownloadEvent({
      eventType: "DOWNLOAD_GRANTED",
      slug,
      requiredTier,
      userTier,
      ip,
      userAgent: ua,
      referrer: ref,
      tokenExp: verification.exp,
      downloadUrl: url,
      nonce: verification.nonce,
      tokenId,
    });

    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
    res.setHeader("X-Download-ID", slug);
    res.setHeader("X-Token-ID", tokenId);

    const forensics = getTokenForensics(verification.payload.md || {});
    if (forensics.watermarkId) {
      res.setHeader("X-Watermark-ID", forensics.watermarkId);
    }

    return res.redirect(302, url);
  } catch (err) {
    console.error("[DOWNLOAD_SYSTEM_EXCEPTION]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const config = {
  api: { responseLimit: false, bodyParser: false },
};
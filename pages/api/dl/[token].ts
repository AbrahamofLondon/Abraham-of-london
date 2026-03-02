// pages/api/dl/[token].ts — SSOT Download Redemption (AccessTier)
import type { NextApiRequest, NextApiResponse } from "next";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, normalizeRequiredTier, hasAccess } from "@/lib/access/tier-policy";

import {
  verifyDownloadToken,
  getUserTierFromCookies,
} from "@/lib/downloads/security";

import { logDownloadEvent } from "@/lib/downloads/audit";
import { safeSlice } from "@/lib/utils/safe";

import {
  getDownloadBySlug,
  getDocumentBySlug,
  resolveDocDownloadUrl,
} from "@/lib/content/server";

function getIp(req: NextApiRequest): string {
  const xff = (req.headers["x-forwarded-for"] as string) || "";
  return xff.split(",")[0]?.trim() || req.socket.remoteAddress || "0.0.0.0";
}

function getUserTier(cookieHeader: string | undefined): AccessTier {
  const raw = getUserTierFromCookies(cookieHeader);
  return normalizeUserTier(raw);
}

function validateDownloadAccess(params: {
  userTier: AccessTier;
  requiredTier: AccessTier;
}): { allowed: boolean; reason?: string } {
  if (!hasAccess(params.userTier, params.requiredTier)) {
    return { allowed: false, reason: `Insufficient tier: ${params.userTier} < ${params.requiredTier}` };
  }
  return { allowed: true };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
  if (!token) return res.status(400).json({ error: "Missing token" });

  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) {
    console.error("[CRITICAL] DOWNLOAD_SIGNING_SECRET is undefined");
    return res.status(500).json({ error: "Internal configuration error" });
  }

  const ip = getIp(req);
  const ua = String(req.headers["user-agent"] || "unknown-ua");
  const ref = String(req.headers.referer || "direct");

  try {
    // 1) Verify token
    const verification = verifyDownloadToken(token, secret);

    if (!verification.valid) {
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

    // 2) Extract payload (normalize tiers)
    const slug = String(verification.slug || "").trim();
    const requiredTier = normalizeRequiredTier(verification.requiredTier || "public");
    const userTier = getUserTier(req.headers.cookie);

    if (!slug) return res.status(400).json({ error: "Invalid token payload" });

    // 3) Resolve document (download-first, then generic fallback)
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
      });
      return res.status(404).json({ error: "Document not found" });
    }

    // 4) Resolve URL
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
      });
      return res.status(500).json({ error: "Internal error resolving URL" });
    }

    // 5) Enforce tier access at redemption time
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
      });

      return res.redirect(302, "/inner-circle?error=insufficient_tier");
    }

    // 6) Success log + redirect
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
    });

    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Download-ID", slug);

    return res.redirect(302, url);
  } catch (err) {
    console.error(`[DOWNLOAD_SYSTEM_EXCEPTION] ${token}:`, err);

    await logDownloadEvent({
      eventType: "DOWNLOAD_ERROR",
      slug: "unknown",
      requiredTier: "unknown",
      userTier: getUserTier(req.headers.cookie),
      ip,
      userAgent: ua,
      referrer: ref,
      note: `System error: ${err instanceof Error ? err.message : "Unknown error"}`,
    });

    return res.status(500).json({
      error: "Internal server error",
      reference: safeSlice(token, 0, 8),
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};
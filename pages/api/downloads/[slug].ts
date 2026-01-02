import type { NextApiRequest, NextApiResponse } from "next";
import { getDownloadBySlug, resolveDocDownloadUrl, getRequiredTier } from "@/lib/server/content";
import { getUserTierFromCookies, tierAtLeast, signDownloadToken, newNonce, type InnerCircleTier } from "@/lib/downloads/security";
import { logDownloadEvent } from "@/lib/downloads/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const slug = String(req.query.slug || "").toLowerCase().trim();
  if (!slug) return res.status(400).send("ERR_MISS_SLUG");

  try {
    const doc = getDownloadBySlug(slug);
    if (!doc) return res.status(404).send("ERR_NOT_FOUND");

    const url = resolveDocDownloadUrl(doc);
    if (!url) return res.status(500).send("ERR_ASSET_UNREACHABLE");

    const requiredTierRaw = getRequiredTier(doc);
    const requiredTier: InnerCircleTier = requiredTierRaw as InnerCircleTier;
    const userTier = getUserTierFromCookies(req.headers.cookie);

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "0.0.0.0";
    const ua = req.headers["user-agent"] || "unknown";
    const ref = req.headers.referer || "direct";

    // 1. Authorization Boundary
    if (!tierAtLeast(userTier, requiredTier)) {
      await logDownloadEvent({
        eventType: "DOWNLOAD_DENIED",
        slug, 
        requiredTier, 
        userTier, 
        ip, 
        userAgent: ua, 
        referrer: ref,
        note: "Access blocked: Insufficient institutional clearance",
      });
      return res.redirect(302, "/inner-circle?auth_required=true");
    }

    // 2. Signing Security Boundary
    const secret = process.env.DOWNLOAD_SIGNING_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error("Weak or missing DOWNLOAD_SIGNING_SECRET");
    }

    // 3. Short-lived Secure Token Creation
    const exp = Math.floor(Date.now() / 1000) + (5 * 60); // 300 second TTL
    const token = signDownloadToken({ 
      slug, 
      exp, 
      requiredTier, 
      nonce: newNonce() 
    }, secret);

    await logDownloadEvent({
      eventType: "LINK_ISSUED",
      slug, 
      requiredTier, 
      userTier, 
      ip, 
      userAgent: ua, 
      referrer: ref,
      tokenExp: exp,
    });

    return res.redirect(302, `/api/dl/${encodeURIComponent(token)}`);
  } catch (error) {
    console.error("[ISSUER_FAULT]", error);
    return res.status(500).send("ERR_SEC_ISSUANCE_FAILED");
  }
}
/* pages/api/dl/[token].ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { getDownloadBySlug, resolveDocDownloadUrl } from "@/lib/server/content";
import { verifyDownloadToken, getUserTierFromCookies, tierAtLeast } from "@/lib/downloads/security";
import { logDownloadEvent } from "@/lib/downloads/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Boundary: Method Restriction
  if (req.method !== "GET") return res.status(405).setHeader("Allow", "GET").end();

  // 2. Boundary: Input Sanitization
  const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
  if (!token) return res.status(400).send("ERR_MISS_TOKEN");

  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) {
    console.error("[CRITICAL] DOWNLOAD_SIGNING_SECRET is undefined in environment.");
    return res.status(500).send("ERR_INT_SEC_CFG");
  }

  // 3. Metadata Extraction for Audit Trail
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "0.0.0.0";
  const ua = req.headers["user-agent"] || "unknown-ua";
  const ref = req.headers.referer || "direct";

  try {
    // 4. Cryptographic Handshake
    const payload = verifyDownloadToken(token, secret);
    
    if (payload.valid === false) {
      await logDownloadEvent({
        eventType: "TOKEN_REJECTED",
        slug: (payload as any).slug || "unknown",
        requiredTier: (payload as any).requiredTier || "public",
        userTier: getUserTierFromCookies(req.headers.cookie),
        ip, userAgent: ua, referrer: ref,
        note: (payload as any).reason || "Handshake failed",
      });
      return res.status(403).send("ERR_INVALID_TOKEN");
    }

    // 5. Atomic Asset Resolution
    const doc = getDownloadBySlug(payload.slug);
    if (!doc) return res.status(404).send("ERR_ASSET_NOT_FOUND");

    const url = resolveDocDownloadUrl(doc);
    if (!url) return res.status(500).send("ERR_URL_RESOLVE");

    // 6. Real-time Authorization (Redemption-time check)
    const userTier = getUserTierFromCookies(req.headers.cookie);
    if (!tierAtLeast(userTier, payload.requiredTier)) {
      await logDownloadEvent({
        eventType: "DOWNLOAD_DENIED",
        slug: payload.slug,
        requiredTier: payload.requiredTier,
        userTier, ip, userAgent: ua, referrer: ref,
        note: "Security breach: Tier changed or session hijacked between issue and redemption",
      });
      return res.redirect(302, "/inner-circle?error=insufficient_tier");
    }

    // 7. Successful Handshake
    await logDownloadEvent({
      eventType: "DOWNLOAD_GRANTED",
      slug: payload.slug,
      requiredTier: payload.requiredTier,
      userTier, ip, userAgent: ua, referrer: ref,
      tokenExp: payload.exp,
    });

    // Prevent caching of the redirect to ensure every click is logged
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.redirect(302, url);

  } catch (err) {
    console.error(`[DOWNLOAD_SYSTEM_EXCEPTION] ${token}:`, err);
    return res.status(500).send("ERR_INTERNAL_FLAKE");
  }
}

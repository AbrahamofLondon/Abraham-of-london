// pages/api/dl/[token].ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getDownloadBySlug,
  resolveDocDownloadUrl,
} from "@/lib/contentlayer-helper";
import {
  verifyDownloadToken,
  getUserTierFromCookies,
  tierAtLeast,
} from "@/lib/downloads/security";
import { logDownloadEvent } from "@/lib/downloads/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = String(req.query.token ?? "").trim();
  if (!token) return res.status(400).send("Missing token");

  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) return res.status(500).send("Missing DOWNLOAD_SIGNING_SECRET");

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    null;

  const ua = req.headers["user-agent"] ?? null;
  const ref = req.headers.referer ?? null;

  const payload = verifyDownloadToken(token, secret);
  if (!payload.valid) {
    await logDownloadEvent({
      eventType: "TOKEN_REJECTED",
      slug: payload.slug ?? "unknown",
      requiredTier: payload.requiredTier ?? "public",
      userTier: getUserTierFromCookies(req.headers.cookie),
      ip,
      userAgent: ua,
      referrer: ref,
      note: payload.reason ?? "invalid",
    });
    return res.status(403).send("Invalid or expired token");
  }

  const doc = getDownloadBySlug(payload.slug);
  if (!doc) return res.status(404).send("Not found");

  const url = resolveDocDownloadUrl(doc);
  if (!url) return res.status(500).send("Missing file");

  // Re-check tier at click-time (important)
  const userTier = getUserTierFromCookies(req.headers.cookie);
  if (!tierAtLeast(userTier, payload.requiredTier)) {
    await logDownloadEvent({
      eventType: "DOWNLOAD_DENIED",
      slug: payload.slug,
      requiredTier: payload.requiredTier,
      userTier,
      ip,
      userAgent: ua,
      referrer: ref,
      note: "Tier check failed at token redemption",
    });
    return res.redirect(302, "/inner-circle");
  }

  await logDownloadEvent({
    eventType: "DOWNLOAD_GRANTED",
    slug: payload.slug,
    requiredTier: payload.requiredTier,
    userTier,
    ip,
    userAgent: ua,
    referrer: ref,
    tokenExp: payload.exp,
  });

  return res.redirect(302, url);
}
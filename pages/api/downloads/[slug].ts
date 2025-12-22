// pages/api/downloads/[slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getDownloadBySlug,
  resolveDocDownloadUrl,
  getRequiredTier,
} from "@/lib/contentlayer-helper";
import {
  getUserTierFromCookies,
  tierAtLeast,
  signDownloadToken,
  newNonce,
} from "@/lib/downloads/security";
import { logDownloadEvent } from "@/lib/downloads/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = String(req.query.slug ?? "").toLowerCase();
  if (!slug) return res.status(400).send("Missing slug");

  const doc = getDownloadBySlug(slug);
  if (!doc) return res.status(404).send("Not found");

  const url = resolveDocDownloadUrl(doc);
  if (!url) return res.status(500).send("Missing file");

  const requiredTier = getRequiredTier(doc);
  const userTier = getUserTierFromCookies(req.headers.cookie);

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    null;

  if (!tierAtLeast(userTier, requiredTier)) {
    await logDownloadEvent({
      eventType: "DOWNLOAD_DENIED",
      slug,
      requiredTier,
      userTier,
      ip,
      userAgent: req.headers["user-agent"] ?? null,
      referrer: req.headers.referer ?? null,
      note: "Insufficient tier",
    });
    return res.redirect(302, "/inner-circle");
  }

  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) return res.status(500).send("Missing DOWNLOAD_SIGNING_SECRET");

  const exp = Math.floor(Date.now() / 1000) + 5 * 60; // 5 mins
  const token = signDownloadToken(
    { slug, exp, requiredTier, nonce: newNonce() },
    secret
  );

  await logDownloadEvent({
    eventType: "LINK_ISSUED",
    slug,
    requiredTier,
    userTier,
    ip,
    userAgent: req.headers["user-agent"] ?? null,
    referrer: req.headers.referer ?? null,
    tokenExp: exp,
  });

  return res.redirect(302, `/api/dl/${token}`);
}
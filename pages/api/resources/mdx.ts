/* pages/api/resources/mdx.ts - RECONCILED REDIS AUTH VERSION */
import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionTier } from "@/lib/server/auth/tokenStore.redis";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
import { getServerDownloadBySlug } from "@/lib/contentlayer-compat";

type Ok = {
  ok: true;
  tier: "public" | "inner-circle" | "private";
  mdx: string;
};

type Fail = {
  ok: false;
  reason: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Fail>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  const slug = String(req.query.slug || "").trim();
  if (!slug) {
    return res.status(400).json({ ok: false, reason: "Missing slug" });
  }

  // 1) Load resource metadata + MDX via specialized loader
  const resource = await loadResourceMDX(slug);
  if (!resource) {
    return res.status(404).json({ ok: false, reason: "Resource not found" });
  }

  // 2) Resolve required tier from Contentlayer/Frontmatter
  const requiredTier = resource.access; 

  // 3) Public resource? Serve immediately
  if (requiredTier === "public") {
    return res.status(200).json({
      ok: true,
      tier: "public",
      mdx: resource.mdx,
    });
  }

  // 4) Resolve session from Redis
  const token = getAccessTokenFromReq(req);
  if (!token) {
    return res.status(401).json({ ok: false, reason: "Access required" });
  }

  const sessionTier = await getSessionTier(token);
  if (!sessionTier) {
    return res.status(401).json({ ok: false, reason: "Session expired" });
  }

  // 5) Tier enforcement
  const order = ["public", "inner-circle", "private"];
  if (order.indexOf(sessionTier) < order.indexOf(requiredTier)) {
    return res.status(403).json({ ok: false, reason: "Insufficient access" });
  }

  // 6) Authorized
  return res.status(200).json({
    ok: true,
    tier: sessionTier,
    mdx: resource.mdx,
  });
}
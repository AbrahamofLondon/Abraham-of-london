/* pages/api/downloads/mdx.ts - RECONCILED REDIS AUTH VERSION - FULLY CORRECTED */
import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionTier } from "@/lib/server/auth/tokenStore.redis";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
import { getDocumentBySlug } from "@/lib/contentlayer-compat.server";

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

  // 1) Load download metadata + MDX using the correct server function
  const doc = await getDocumentBySlug(slug, "download");
  if (!doc) {
    return res.status(404).json({ ok: false, reason: "Asset not found" });
  }

  // 2) Extract MDX content - check different possible field names
  let mdxContent = "";
  if (typeof doc.body === "object" && doc.body?.code) {
    mdxContent = doc.body.code;
  } else if (typeof doc.body === "string") {
    mdxContent = doc.body;
  } else if (doc.content) {
    mdxContent = doc.content;
  } else {
    return res.status(500).json({ ok: false, reason: "Invalid document format" });
  }

  // 3) Resolve required tier from document metadata
  // Assuming your documents have an 'access' or 'tier' field
  const requiredTier = (doc as any).access || (doc as any).tier || "public";

  // 4) Public asset? Serve immediately
  if (requiredTier === "public") {
    return res.status(200).json({
      ok: true,
      tier: "public",
      mdx: mdxContent,
    });
  }

  // 5) Resolve session from Redis
  const token = getAccessTokenFromReq(req);
  if (!token) {
    return res.status(401).json({ ok: false, reason: "Access required" });
  }

  const sessionTier = await getSessionTier(token);
  if (!sessionTier) {
    return res.status(401).json({ ok: false, reason: "Session expired" });
  }

  // 6) Tier enforcement
  const order = ["public", "inner-circle", "private"];
  if (order.indexOf(sessionTier) < order.indexOf(requiredTier)) {
    return res.status(403).json({ ok: false, reason: "Insufficient access" });
  }

  // 7) Authorized
  return res.status(200).json({
    ok: true,
    tier: sessionTier,
    mdx: mdxContent,
  });
}
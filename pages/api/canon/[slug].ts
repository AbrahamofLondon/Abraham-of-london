// pages/api/canon/[slug].ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import { getSessionTier } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
import { normalizeSlug } from "@/lib/contentlayer-helper";  // FIXED: Changed import source
import { getServerCanonBySlug } from "@/lib/contentlayer-helper";  // FIXED: Changed import source
import { prepareMDX } from "@/lib/server/md-utils";

type Tier = "public" | "inner-circle" | "private";

type Ok = {
  ok: true;
  tier: Tier;
  requiredTier: Tier;
  source: MDXRemoteSerializeResult;
};

type Fail = { ok: false; reason: string };

const order: Tier[] = ["public", "inner-circle", "private"];

function asTier(v: unknown): Tier {
  if (v === "private") return "private";
  if (v === "inner-circle") return "inner-circle";
  return "public";
}

function canAccess(sessionTier: Tier, requiredTier: Tier) {
  return order.indexOf(sessionTier) >= order.indexOf(requiredTier);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  // IMPORTANT: now reading from /api/canon/[slug]
  const slug = normalizeSlug(String(req.query.slug || ""));
  if (!slug) return res.status(400).json({ ok: false, reason: "Missing slug" });

  const doc: any = await getServerCanonBySlug(slug);
  if (!doc || doc.draft) {
    return res.status(404).json({ ok: false, reason: "Manuscript not found" });
  }

  const requiredTier = asTier(doc.accessLevel);

  let sessionTier: Tier = "public";
  if (requiredTier !== "public") {
    const token = getAccessTokenFromReq(req);
    if (!token) return res.status(401).json({ ok: false, reason: "Access required" });

    const t = await getSessionTier(token);
    if (!t) return res.status(401).json({ ok: false, reason: "Session expired or invalid" });

    sessionTier = asTier(t);

    if (!canAccess(sessionTier, requiredTier)) {
      return res.status(403).json({ ok: false, reason: "Insufficient institutional tier" });
    }
  }

  const rawMdx = String(doc?.body?.raw ?? doc?.body ?? "");
  const source = await prepareMDX(rawMdx);

  return res.status(200).json({
    ok: true,
    tier: sessionTier,
    requiredTier,
    source,
  });
}
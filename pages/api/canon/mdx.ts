// pages/api/canon/mdx.ts
// ✅ Postgres session gating + ✅ server-side MDX compile (returns MDXRemote payload)
// No client compilation. Clean deploy path.

import type { NextApiRequest, NextApiResponse } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import { getSessionTier } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
import { getServerCanonBySlug, normalizeSlug } from "@/lib/contentlayer-compat";
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Fail>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  const slug = normalizeSlug(String(req.query.slug || ""));
  if (!slug) return res.status(400).json({ ok: false, reason: "Missing slug" });

  // 1) Load canon doc from Contentlayer (server-safe helper)
  const doc: any = await getServerCanonBySlug(slug);
  if (!doc || doc.draft) {
    return res.status(404).json({ ok: false, reason: "Manuscript not found" });
  }

  const requiredTier = asTier(doc.accessLevel);

  // 2) Gate if non-public
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

  // 3) Server-side compile to MDXRemote payload
  const rawMdx = String(doc?.body?.raw ?? doc?.body ?? "");
  const source = await prepareMDX(rawMdx);

  // 4) Return compiled payload (client renders; no compilation in browser)
  return res.status(200).json({
    ok: true,
    tier: sessionTier,
    requiredTier,
    source,
  });
}
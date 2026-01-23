// pages/api/downloads/[slug].ts
// ✅ Postgres session gating + ✅ server-side MDX compile (returns MDXRemote payload)
// Mirrors canon API behavior so the client never serializes/compiles.

import type { NextApiRequest, NextApiResponse } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import { getSessionTier } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
import { getServerDownloadBySlug, normalizeSlug } from "@/lib/contentlayer-compat";
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
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "Method not allowed" });

  const slug = normalizeSlug(String(req.query.slug || ""));
  if (!slug) return res.status(400).json({ ok: false, reason: "Missing slug" });

  try {
    const doc: any = await getServerDownloadBySlug(slug);
    if (!doc || doc.draft) return res.status(404).json({ ok: false, reason: "Not found" });

    const requiredTier = asTier(doc.accessLevel || "inner-circle");

    let sessionTier: Tier = "public";
    if (requiredTier !== "public") {
      const token = getAccessTokenFromReq(req);
      const t = token ? await getSessionTier(token) : null;
      if (!t) return res.status(403).json({ ok: false, reason: "Access denied" });

      sessionTier = asTier(t);
      if (!canAccess(sessionTier, requiredTier)) {
        return res.status(403).json({ ok: false, reason: "Access denied" });
      }
    }

    const rawMdx = String(doc?.body?.raw ?? doc?.body ?? "");
    const source = await prepareMDX(rawMdx);

    return res.status(200).json({ ok: true, tier: sessionTier, requiredTier, source });
  } catch (error) {
    return res.status(500).json({ ok: false, reason: "Server error" });
  }
}
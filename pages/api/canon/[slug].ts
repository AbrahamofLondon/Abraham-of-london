// pages/api/canon/[slug].ts — SECURE DECRYPTION BRIDGE
import type { NextApiRequest, NextApiResponse } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";
import { normalizeSlug, getServerCanonBySlug } from "@/lib/contentlayer-helper";
import { prepareMDX } from "@/lib/server/md-utils";

type Tier = "public" | "inner-circle" | "private";

type Ok = {
  ok: true;
  tier: Tier;
  requiredTier: Tier;
  source: MDXRemoteSerializeResult;
};

type Fail = { ok: false; reason: string };

const TIER_ORDER: Tier[] = ["public", "inner-circle", "private"];

function asTier(v: unknown): Tier {
  if (v === "private") return "private";
  if (v === "inner-circle") return "inner-circle";
  return "public";
}

function hasClearance(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  // 1) Slug Normalization
  const slug = normalizeSlug(String(req.query.slug || ""));
  if (!slug) return res.status(400).json({ ok: false, reason: "Identification missing" });

  // 2) Manuscript Retrieval
  const doc: any = await getServerCanonBySlug(slug);
  if (!doc || doc.draft) {
    return res.status(404).json({ ok: false, reason: "Manuscript not found" });
  }

  const requiredTier = asTier(doc.accessLevel);
  let userTier: Tier = "public";

  // 3) Authorization Check (Postgres verified)
  if (requiredTier !== "public") {
    const sessionId = getAccessCookie(req);
    if (!sessionId) return res.status(401).json({ ok: false, reason: "Clearance required" });

    const session = await verifySession(sessionId);
    if (!session || !session.valid) {
      return res.status(401).json({ ok: false, reason: "Session expired or revoked" });
    }

    userTier = asTier(session.tier);

    if (!hasClearance(userTier, requiredTier)) {
      return res.status(403).json({ ok: false, reason: "Insufficient institutional tier" });
    }
  }

  // 4) MDX Preparation
  // Note: Only perform serialization on the server for gated content to protect raw MDX
  const rawMdx = String(doc?.body?.raw || doc?.content || "");
  const source = await prepareMDX(rawMdx);

  return res.status(200).json({
    ok: true,
    tier: userTier,
    requiredTier,
    source,
  });
}
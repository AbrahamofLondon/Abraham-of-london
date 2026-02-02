// pages/api/books/[slug].ts — SECURE BOOK DECRYPTION
import type { NextApiRequest, NextApiResponse } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";
import { normalizeSlug, getServerBookBySlug } from "@/lib/contentlayer-helper";
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

function hasClearance(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  const slug = normalizeSlug(String(req.query.slug || ""));
  if (!slug) return res.status(400).json({ ok: false, reason: "Slug missing" });

  const book: any = await getServerBookBySlug(slug);
  if (!book || book.draft) {
    return res.status(404).json({ ok: false, reason: "Volume not found" });
  }

  const requiredTier = (book.accessLevel || "public") as Tier;
  let userTier: Tier = "public";

  // Institutional Security Gate
  if (requiredTier !== "public") {
    const sessionId = getAccessCookie(req);
    if (!sessionId) return res.status(401).json({ ok: false, reason: "Clearance required" });

    const session = await verifySession(sessionId);
    if (!session || !session.valid) {
      return res.status(401).json({ ok: false, reason: "Session invalid" });
    }

    userTier = session.tier as Tier;
    if (!hasClearance(userTier, requiredTier)) {
      return res.status(403).json({ ok: false, reason: "Insufficient clearance" });
    }
  }

  const rawMdx = String(book?.body?.raw || book?.content || "");
  const source = await prepareMDX(rawMdx);

  return res.status(200).json({
    ok: true,
    tier: userTier,
    requiredTier,
    source,
  });
}
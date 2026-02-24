// pages/api/canon/[slug].ts — SECURE VAULT PROXY
import type { NextApiRequest, NextApiResponse } from "next";
import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";
import { normalizeSlug, getServerCanonBySlug } from "@/lib/content/server";

type Tier = "public" | "inner-circle" | "private";
const TIER_ORDER: Tier[] = ["public", "inner-circle", "private"];

function hasClearance(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });

  const slug = normalizeSlug(String(req.query.slug || ""));
  const doc: any = await getServerCanonBySlug(slug);
  
  if (!doc || doc.draft) return res.status(404).json({ ok: false, reason: "MANUSCRIPT_NOT_FOUND" });

  const requiredTier = (doc.accessLevel || "public") as Tier;
  let userTier: Tier = "public";

  if (requiredTier !== "public") {
    const sessionId = getAccessCookie(req);
    if (!sessionId) return res.status(401).json({ ok: false, reason: "CLEARANCE_REQUIRED" });

    const session = await verifySession(sessionId);
    if (!session || !session.valid) return res.status(401).json({ ok: false, reason: "SESSION_INVALID" });

    userTier = session.tier as Tier;
    if (!hasClearance(userTier, requiredTier)) {
      return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE" });
    }
  }

  return res.status(200).json({
    ok: true,
    tier: userTier,
    bodyCode: doc.body.code, // ✅ Pre-compiled Contentlayer2 payload
  });
}
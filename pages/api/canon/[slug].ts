// pages/api/canon/[slug].ts — SECURE VAULT PROXY (USES SSOT)
import type { NextApiRequest, NextApiResponse } from "next";
import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";
import { normalizeSlug, getServerCanonBySlug } from "@/lib/content/server";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers"; // ✅ Import SSOT helpers
import type { AccessTier } from "@/lib/access/tiers";

type ResponseData = {
  ok: boolean;
  reason?: string;
  tier?: AccessTier;
  requiredTier?: AccessTier;
  bodyCode?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  const slug = normalizeSlug(String(req.query.slug || ""));
  const doc: any = await getServerCanonBySlug(slug);
  
  if (!doc || doc.draft) {
    return res.status(404).json({ ok: false, reason: "MANUSCRIPT_NOT_FOUND" });
  }

  // ✅ SSOT: Use requiredTierFromDoc to ensure consistent policy
  const requiredTier = tiers.normalize(requiredTierFromDoc(doc));
  
  // ✅ Public content bypass - return immediately without session
  if (requiredTier === "public") {
    return res.status(200).json({
      ok: true,
      tier: "public",
      requiredTier: "public",
      bodyCode: doc.body?.code || doc.bodyCode || "",
    });
  }

  // Security Gate (only for non-public)
  let userTier: AccessTier = "public";
  
  const sessionId = getAccessCookie(req);
  if (!sessionId) {
    return res.status(401).json({ ok: false, reason: "CLEARANCE_REQUIRED" });
  }

  const session = await verifySession(sessionId);
  if (!session || !session.valid) {
    return res.status(401).json({ ok: false, reason: "SESSION_INVALID" });
  }

  userTier = tiers.normalize(session.tier);
  
  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE" });
  }

  return res.status(200).json({
    ok: true,
    tier: userTier,
    requiredTier,
    bodyCode: doc.body?.code || doc.bodyCode || "",
  });
}
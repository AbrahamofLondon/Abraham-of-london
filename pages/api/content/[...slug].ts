// pages/api/content/[...slug].ts — HARDENED CONTENT LAYER (USES SSOT)
import type { NextApiRequest, NextApiResponse } from "next";
import { getDocBySlug, normalizeSlug } from "@/lib/content/server";
import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers"; // ✅ Import SSOT helpers
import type { AccessTier } from "@/lib/access/tiers";

type ResponseData = {
  ok: boolean;
  bodyCode?: string;
  metadata?: {
    title: string;
    accessLevel: AccessTier;
  };
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1. Slug Extraction
  const rawSlug = req.query.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug.join("/") : String(rawSlug || "");
  const targetSlug = normalizeSlug(slug);

  // 2. Document Retrieval
  const doc: any = getDocBySlug(`content/${targetSlug}`) || getDocBySlug(targetSlug);
  if (!doc || doc.draft) {
    return res.status(404).json({ error: "Manuscript Not Found" });
  }

  // ✅ SSOT: Use requiredTierFromDoc to ensure consistent policy
  const requiredTier = tiers.normalize(requiredTierFromDoc(doc));

  // ✅ Public content bypass - return immediately without session
  if (requiredTier === "public") {
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).json({
      ok: true,
      bodyCode: doc.body?.code || doc.bodyCode || "",
      metadata: {
        title: doc.title || "Untitled",
        accessLevel: requiredTier,
      },
    });
  }

  // 3. Authorization Protocol (only for non-public)
  let userTier: AccessTier = "public";
  
  const sessionId = getAccessCookie(req);
  if (!sessionId) {
    return res.status(401).json({ error: "Clearance Required" });
  }

  const session = await verifySession(sessionId);
  if (!session || !session.valid) {
    return res.status(401).json({ error: "Session Invalid" });
  }

  userTier = tiers.normalize(session.tier);

  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({ error: "Insufficient Institutional Tier" });
  }

  // 4. Return Pre-compiled Payload
  res.setHeader("Cache-Control", "no-store");
  
  return res.status(200).json({
    ok: true,
    bodyCode: doc.body?.code || doc.bodyCode || "",
    metadata: {
      title: doc.title || "Untitled",
      accessLevel: requiredTier,
    },
  });
}
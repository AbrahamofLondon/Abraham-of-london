// pages/api/content/[...slug].ts — HARDENED CONTENT LAYER
import type { NextApiRequest, NextApiResponse } from "next";
import { getDocBySlug, normalizeSlug } from "@/lib/content/server";
import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";

type Tier = "public" | "inner-circle" | "private";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  // 1. Slug Extraction
  const rawSlug = req.query.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug.join("/") : String(rawSlug || "");
  const targetSlug = normalizeSlug(slug);

  // 2. Document Retrieval
  const doc: any = getDocBySlug(`content/${targetSlug}`) || getDocBySlug(targetSlug);
  if (!doc || doc.draft) return res.status(404).json({ error: "Manuscript Not Found" });

  // 3. Authorization Protocol
  const requiredTier = (doc.accessLevel || "inner-circle") as Tier;
  
  if (requiredTier !== "public") {
    const sessionId = getAccessCookie(req);
    if (!sessionId) return res.status(401).json({ error: "Clearance Required" });

    const session = await verifySession(sessionId);
    if (!session || !session.valid) return res.status(401).json({ error: "Session Invalid" });

    // Tier comparison: Check if user has sufficient clearance
    const tierOrder: Tier[] = ["public", "inner-circle", "private"];
    if (tierOrder.indexOf(session.tier as Tier) < tierOrder.indexOf(requiredTier)) {
      return res.status(403).json({ error: "Insufficient Institutional Tier" });
    }
  }

  // 4. Return Pre-compiled Payload
  // No prepareMDX() called. We use doc.body.code directly.
  res.setHeader("Cache-Control", requiredTier === "public" ? "public, max-age=3600" : "no-store");
  
  return res.status(200).json({
    ok: true,
    bodyCode: doc.body.code, // ✅ Contentlayer2 pre-compiled MDX
    metadata: {
      title: doc.title,
      accessLevel: requiredTier
    }
  });
}
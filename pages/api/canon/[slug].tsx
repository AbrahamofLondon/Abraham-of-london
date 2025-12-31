/* pages/api/canon/[slug].ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllCanons, recordContentView } from "@/lib/server/content";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') return res.status(400).json({ error: "SLUG_REQUIRED" });

  try {
    const canons = getAllCanons();
    const doc = canons.find((c) => c.slug === slug);

    if (!doc) {
      return res.status(404).json({ error: "VOLUME_NOT_FOUND_IN_CANON" });
    }

    // 1. Audit Layer: Ensure high-gravity engagement is tracked
    await recordContentView(doc);

    // 2. Production Response: Return only sanitized metadata
    return res.status(200).json({
      title: doc.title,
      excerpt: doc.excerpt || "No summary available.",
      tier: (doc as any).tier || "public",
      lastUpdated: (doc as any).updatedAt || doc.date,
      wordCount: (doc as any).wordCount || 0
    });

  } catch (error) {
    console.error("[CANON_RESOLVER_EXCEPTION]", error);
    return res.status(500).json({ error: "INTERNAL_CANON_FAULT" });
  }
}

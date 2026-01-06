/* pages/api/canon/[slug].ts - HYDRATED INSTITUTIONAL VERSION */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerAllCanons, recordContentView } from '@/lib/contentlayer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: "SLUG_REQUIRED" });
  }

  try {
    // STRATEGIC FIX: Use the sanitized async wrapper to avoid undefined serialization
    const canons = await getServerAllCanons();
    const doc = canons.find((c: any) => c.slug === slug);

    if (!doc) {
      return res.status(404).json({ error: "VOLUME_NOT_FOUND_IN_CANON" });
    }

    // 1. Audit Layer: High-gravity engagement tracking
    await recordContentView(doc);

    // 2. Production Response: Return sanitized metadata
    // Fallbacks ensure no 'undefined' values reach the response
    return res.status(200).json({
      title: doc.title || "Untitled Volume",
      excerpt: doc.excerpt || doc.description || "Foundational transmission summary pending.",
      tier: doc.tier || doc.accessLevel || "public",
      lastUpdated: doc.updatedAt || doc.date || new Date().toISOString(),
      wordCount: doc.wordCount || 0
    });

  } catch (error) {
    console.error("❌ [CANON_RESOLVER_EXCEPTION]", error);
    return res.status(500).json({ error: "INTERNAL_CANON_FAULT" });
  }
}

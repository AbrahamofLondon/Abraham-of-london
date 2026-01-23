/* pages/api/canon/[slug].ts - HYDRATED INSTITUTIONAL VERSION */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerAllCanons, recordContentView } from "@/lib/contentlayer-compat";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: "SLUG_REQUIRED" });
  }

  try {
    // STRATEGIC FIX: Use the sanitized async wrapper to avoid undefined serialization
    const canons = await getServerAllCanons();
    
    // Find canon by slug with multiple fallback options
    const doc = canons.find((c: any) => {
      // Try multiple slug properties and normalize
      const canonSlug = c?.slug || c?._raw?.flattenedPath || "";
      const normalizedCanonSlug = canonSlug.replace(/\.(md|mdx)$/, '');
      return normalizedCanonSlug === slug;
    });

    if (!doc) {
      return res.status(404).json({ 
        error: "VOLUME_NOT_FOUND_IN_CANON",
        slug: slug,
        suggestion: "Check the slug format or volume availability"
      });
    }

    // 1. Audit Layer: High-gravity engagement tracking
    // Pass the slug instead of the doc object
    await recordContentView(slug).catch((err: any) => {
      console.warn("⚠️ [CANON_VIEW_LOG_FAILED]", err);
      // Don't fail the request if logging fails
    });

    // 2. Production Response: Return sanitized metadata
    // Fallbacks ensure no 'undefined' values reach the response
    const responseData = {
      title: doc.title || "Untitled Volume",
      excerpt: doc.excerpt || doc.description || "Foundational transmission summary pending.",
      tier: doc.tier || doc.accessLevel || "public",
      lastUpdated: doc.updatedAt || doc.date || doc.createdAt || new Date().toISOString(),
      wordCount: doc.wordCount || 0,
      slug: slug,
      canonical: doc.canonical || null,
      volume: doc.volume || null,
      chapter: doc.chapter || null,
      success: true
    };

    // Add cache headers for public content
    if (responseData.tier === 'public') {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');
    } else {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error("❌ [CANON_RESOLVER_EXCEPTION]", error);
    return res.status(500).json({ 
      error: "INTERNAL_CANON_FAULT",
      message: error instanceof Error ? error.message : "Unknown error",
      slug: slug
    });
  }
}
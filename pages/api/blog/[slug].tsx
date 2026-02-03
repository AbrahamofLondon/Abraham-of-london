// pages/api/blog/[slug].ts — HARDENED (Lightweight Registry Discovery)
import type { NextApiRequest, NextApiResponse } from "next";
import { allPosts } from "contentlayer/generated"; 
import { normalizeSlug } from "@/lib/content/shared";

/**
 * INSTITUTIONAL METADATA ARCHITECTURE
 * Purpose: Provides high-speed access to brief descriptors without payload decryption.
 * Efficiency: Uses Contentlayer memory-mapped store for O(1) retrieval.
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Method Restriction Protocol
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ 
      error: "METHOD_NOT_SUPPORTED", 
      code: "REGISTRY_ERR_405" 
    });
  }

  // 2. Slug Identification
  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ 
      error: "IDENTIFICATION_REQUIRED", 
      code: "REGISTRY_ERR_400" 
    });
  }

  try {
    const targetSlug = normalizeSlug(slug);

    // 3. Institutional Lookup Logic
    // Handles both raw slug and blog-prefixed paths for absolute redundancy
    const post = allPosts.find((p) => {
      const pSlug = normalizeSlug(p.slug || p._raw.flattenedPath);
      return pSlug === targetSlug || pSlug.replace(/^blog\//, '') === targetSlug;
    });

    if (!post || post.draft) {
      console.warn(`[INTEL_ALERT]: Registry lookup failed for: ${targetSlug}`);
      return res.status(404).json({ 
        error: "MANUSCRIPT_NOT_FOUND", 
        code: "REGISTRY_ERR_404",
        ref: targetSlug 
      });
    }

    // 4. Analytics & Logging
    // Non-blocking telemetry for institutional brief tracking
    console.log(`[INTEL_LOG]: Metadata requested // Brief ID: ${targetSlug}`);

    // 5. Tactical Header Implementation
    // Performance: 1hr Edge Cache | 30s Client Stale-While-Revalidate
    res.setHeader(
      "Cache-Control", 
      "public, s-maxage=3600, stale-while-revalidate=30"
    );

    // 6. Dynamic Asset Calculation
    const rawBody = post.body?.raw || "";
    const wordCount = rawBody.split(/\s+/).filter(Boolean).length;
    
    // Custom calculation to ensure "Institutional" reading pace (~225 wpm)
    const readingTime = post.readingTime?.text || 
      `${Math.max(1, Math.ceil(wordCount / 225))} min read`;

    // 7. Structured Registry Response
    return res.status(200).json({
      success: true,
      metadata: {
        title: post.title || "Untitled Intelligence Brief",
        date: post.date,
        readingTime,
        category: post.category || "General Intelligence",
        tags: post.tags || [],
        description: post.description || post.summary || "Institutional dispatch archive.",
        slug: targetSlug,
        author: post.author || "Abraham of London",
        coverImage: post.coverImage || null,
        wordCount,
        classification: post.accessLevel || "inner-circle",
      }
    });

  } catch (error) {
    console.error('[API_ERROR][REGISTRY_METADATA]:', error);
    return res.status(500).json({ 
      error: "REGISTRY_LAYER_FAILURE", 
      code: "INTERNAL_SYSTEM_ERR_500" 
    });
  }
}
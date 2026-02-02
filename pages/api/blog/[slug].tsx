// pages/api/blog/[slug].ts — HARDENED METADATA API
import type { NextApiRequest, NextApiResponse } from "next";
import { allPosts } from "contentlayer/generated"; // Direct import for performance
import { normalizeSlug } from "@/lib/content/shared";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: "INVALID_SLUG" });
  }

  try {
    const targetSlug = normalizeSlug(slug);

    // Efficient lookup in generated content
    const post = allPosts.find((p) => {
      const pSlug = normalizeSlug(p.slug || p._raw.flattenedPath);
      return pSlug === targetSlug || pSlug.replace(/^blog\//, '') === targetSlug;
    });

    if (!post || post.draft) {
      return res.status(404).json({ error: "POST_NOT_FOUND", slug: targetSlug });
    }

    // Non-blocking Analytics Simulation
    // In production, push this to a queue or edge function
    console.log(`[INTEL_LOG]: Brief accessed: ${targetSlug}`);

    // Performance Headers: 1hr cache, 30s revalidate
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=30");

    // Dynamic Reading Time Calculation
    const rawBody = post.body?.raw || "";
    const wordCount = rawBody.split(/\s+/).filter(Boolean).length;
    const readingTime = post.readingTime?.text || `${Math.max(1, Math.ceil(wordCount / 225))} min read`;

    return res.status(200).json({
      success: true,
      data: {
        title: post.title || "Untitled Brief",
        date: post.date,
        readingTime,
        category: post.category || "General Intelligence",
        tags: post.tags || [],
        description: post.description || post.summary || "",
        slug: targetSlug,
        author: post.author || "Abraham of London",
        coverImage: post.coverImage || null,
        wordCount,
        // We do NOT return the full body here to keep the metadata API lightweight
      }
    });
  } catch (error) {
    console.error('[API_ERROR][BLOG]:', error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
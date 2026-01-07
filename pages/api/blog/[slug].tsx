/* pages/api/blog/[slug].ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPosts } from "/@/lib/contentlayer-compat"; // FIX: Use safe helper
import { recordContentView } from "/@/lib/contentlayer-compat";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: "INVALID_SLUG" });
  }

  // 1. Retrieve Content Safely
  // The helper guarantees an array, so .find() will not crash
  const post = getAllPosts().find((p) => p.slug === slug);

  if (!post) {
    return res.status(404).json({ error: "POST_NOT_FOUND" });
  }

  // 2. Non-blocking Analytics
  // Record the view without delaying the response
  recordContentView(post).catch(e => console.error("[LOG_SILENT_FAIL]", e));

  // 3. Principled Header Selection
  // Cache for 60s shared, allow stale up to 30s
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

  // 4. Transform Response
  // Safe property access using optional chaining where data might be missing
  return res.status(200).json({
    title: post.title,
    date: post.date,
    // Access safely; computed fields might differ based on config
    readingTime: (post as any).readingTime?.text || (post as any).readTime || "Unknown",
    category: (post as any).category || "General",
    tags: post.tags || [],
    description: post.description || (post as any).summary || ""
  });
}


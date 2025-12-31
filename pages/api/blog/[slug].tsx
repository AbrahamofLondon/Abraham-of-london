/* pages/api/blog/[slug].ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { allPosts } from "contentlayer/generated";
import { recordContentView } from "@/lib/server/content";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') return res.status(400).json({ error: "INVALID_SLUG" });

  const post = allPosts.find((p) => p.slug === slug);
  if (!post) return res.status(404).json({ error: "POST_NOT_FOUND" });

  // 1. Non-blocking Analytics: The user gets the content even if logging fails
  recordContentView(post).catch(e => console.error("[LOG_SILENT_FAIL]", e));

  // 2. Principled Header Selection
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

  return res.status(200).json({
    title: post.title,
    date: post.date,
    readingTime: (post as any).readingTime?.text || "Unknown",
    category: (post as any).category || "General",
    tags: (post as any).tags || [],
    description: post.summary || ""
  });
}

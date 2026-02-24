// pages/api/blog/[slug].ts — REFINED REGISTRY
import type { NextApiRequest, NextApiResponse } from "next";
import { allPosts } from "contentlayer/generated"; 
import { normalizeSlug } from "@/lib/content/shared";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { slug } = req.query;
  const targetSlug = normalizeSlug(String(slug));

  const post = allPosts.find((p) => {
    const pSlug = normalizeSlug(p.slug || p._raw.flattenedPath);
    return pSlug === targetSlug || pSlug.replace(/^blog\//, '') === targetSlug;
  });

  if (!post || post.draft) return res.status(404).json({ error: "Not Found" });

  // Tactical caching for metadata
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=30");

  return res.status(200).json({
    success: true,
    metadata: {
      title: post.title,
      classification: post.accessLevel || "inner-circle",
      wordCount: post.wordCount || 0,
      readingTime: post.readingTime?.text || "5 min read",
      // DO NOT return post.body.code here to keep metadata response light
    }
  });
}
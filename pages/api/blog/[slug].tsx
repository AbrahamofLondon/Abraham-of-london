/* pages/api/blog/[slug].ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPosts, recordContentView } from "@/lib/contentlayer-compat";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: "INVALID_SLUG" });
  }

  try {
    // 1. Retrieve Content Safely - getAllPosts() returns a Promise
    const posts = await getAllPosts();
    const post = posts.find((p: any) => {
      // Try multiple slug properties
      const postSlug = p?.slug || p?._raw?.flattenedPath || "";
      // Remove file extensions if present
      const normalizedPostSlug = postSlug.replace(/\.(md|mdx)$/, '');
      return normalizedPostSlug === slug;
    });

    if (!post) {
      return res.status(404).json({ error: "POST_NOT_FOUND" });
    }

    // 2. Non-blocking Analytics
    // Record the view without delaying the response
    recordContentView(slug).catch((e: any) => console.error("[LOG_SILENT_FAIL]", e));

    // 3. Principled Header Selection
    // Cache for 60s shared, allow stale up to 30s
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

    // 4. Transform Response
    // Safe property access using optional chaining where data might be missing
    const responseData = {
      title: post.title || "Untitled",
      date: post.date || post.createdAt || new Date().toISOString().split('T')[0],
      // Access safely; computed fields might differ based on config
      readingTime: (post as any).readingTime?.text || 
                   (post as any).readTime || 
                   (post as any).timeToRead || 
                   "Unknown",
      category: (post as any).category || "General",
      tags: (post as any).tags || [],
      description: post.description || 
                   (post as any).summary || 
                   (post as any).excerpt || 
                   "",
      slug: slug,
      success: true
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('[Blog API] Error:', error);
    return res.status(500).json({ 
      error: "SERVER_ERROR",
      message: "Failed to fetch blog post",
      slug: slug
    });
  }
}
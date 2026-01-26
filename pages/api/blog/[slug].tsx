/* pages/api/blog/[slug].ts */
import type { NextApiRequest, NextApiResponse } from "next";

// Import from your server-side content layer
import { getAllContentlayerDocs } from "@/lib/content/real";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: "INVALID_SLUG" });
  }

  try {
    // 1. Retrieve Content Safely - Use your content layer functions
    const allDocs = getAllContentlayerDocs();
    const posts = allDocs.filter((doc: any) => {
      const type = doc.type || doc._raw?.sourceFileDir;
      return type === "Post" || type === "post" || doc._raw?.sourceFileDir === "blog";
    });

    const post = posts.find((p: any) => {
      // Try multiple slug properties
      const postSlug = p?.slug || p?._raw?.flattenedPath || "";
      // Remove file extensions if present
      const normalizedPostSlug = postSlug.replace(/\.(md|mdx)$/, '');
      const normalizedQuerySlug = slug.replace(/\.(md|mdx)$/, '');
      return normalizedPostSlug === normalizedQuerySlug || postSlug === slug;
    });

    if (!post) {
      return res.status(404).json({ error: "POST_NOT_FOUND" });
    }

    // 2. Non-blocking Analytics
    // Record the view without delaying the response
    try {
      // You can implement your analytics logic here
      // For example, increment view count in database or log to analytics service
      console.log(`[ANALYTICS] View recorded for post: ${slug}`);
    } catch (e: any) {
      console.error("[LOG_SILENT_FAIL]", e);
    }

    // 3. Principled Header Selection
    // Cache for 60s shared, allow stale up to 30s
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");

    // 4. Calculate read time if not present
    let readTime = (post as any).readingTime?.text || 
                   (post as any).readTime || 
                   (post as any).timeToRead;

    if (!readTime) {
      // Fallback: estimate from word count
      const rawBody = post?.body?.raw || "";
      const wordCount = rawBody.split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(wordCount / 200));
      readTime = `${minutes} min read`;
    }

    // 5. Transform Response
    // Safe property access using optional chaining where data might be missing
    const responseData = {
      title: post.title || "Untitled",
      date: post.date || post.createdAt || new Date().toISOString().split('T')[0],
      readingTime: readTime,
      category: (post as any).category || "General",
      tags: (post as any).tags || [],
      description: post.description || 
                   (post as any).summary || 
                   (post as any).excerpt || 
                   "",
      slug: slug,
      success: true,
      // Additional metadata
      author: post.author || "Abraham of London",
      coverImage: post.coverImage || null,
      excerpt: (post as any).excerpt || null,
      wordCount: (post?.body?.raw || "").split(/\s+/).filter(Boolean).length
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
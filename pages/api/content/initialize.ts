// pages/api/content/initialize.ts — COMPLETE INSTITUTIONAL SYNC
import type { NextApiRequest, NextApiResponse } from "next";

// ✅ Unified Helper Imports (Ensure these exist in your lib/contentlayer-helper)
import {
  getAllCanons,
  getAllDownloads,
  getAllBooks,
  getAllShorts,
  getAllEvents,
  getAllResources,
  getAllPrints,
  getAllLexicons,
  getAllBlogs,
  normalizeSlug,
  sanitizeData,
} from "@/lib/content/server";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
type ContentType = 
  | "canon" | "download" | "book" | "short" 
  | "event" | "resource" | "print" | "lexicon" | "blog";

interface NormalizedBrief {
  slug: string;
  title: string;
  type: ContentType;
  date: string | null;
  excerpt: string | null;
  accessLevel: string;
  category?: string | null;
}

interface ApiResponse {
  success: boolean;
  content: NormalizedBrief[];
  timestamp: string;
}

/* -----------------------------------------------------------------------------
  HANDLER
----------------------------------------------------------------------------- */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { success: false; reason?: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, reason: "Method not allowed" });
  }

  try {
    // 1. Concurrent Registry Retrieval
    const [
      canons, downloads, books, shorts, 
      events, resources, prints, lexicons, blogs
    ] = await Promise.all([
      Promise.resolve(getAllCanons() || []),
      Promise.resolve(getAllDownloads() || []),
      Promise.resolve(getAllBooks() || []),
      Promise.resolve(getAllShorts() || []),
      Promise.resolve(getAllEvents() || []),
      Promise.resolve(getAllResources() || []),
      Promise.resolve(getAllPrints() || []),
      Promise.resolve(getAllLexicons() || []),
      Promise.resolve(getAllBlogs() || []),
    ]);

    // 2. Mapping Helper to reduce boilerplate
    const mapper = (items: any[], type: ContentType, defaultTitle: string) => 
      items.map((item) => ({
        slug: normalizeSlug(item.slug || item._raw?.flattenedPath || ""),
        title: item.title || defaultTitle,
        type,
        date: item.date ? String(item.date) : null,
        excerpt: item.excerpt || item.description || null,
        accessLevel: item.accessLevel || (type === "canon" || type === "book" ? "inner-circle" : "public"),
        category: item.category || null,
      }));

    // 3. Aggregate all Sectors
    const normalizedContent: NormalizedBrief[] = [
      ...mapper(canons, "canon", "Institutional Canon"),
      ...mapper(downloads, "download", "Technical Transmission"),
      ...mapper(books, "book", "Intelligence Volume"),
      ...mapper(shorts, "short", "Field Note"),
      ...mapper(events, "event", "Institutional Briefing"),
      ...mapper(resources, "resource", "Asset"),
      ...mapper(prints, "print", "Artistic Manifest"),
      ...mapper(lexicons, "lexicon", "Terminology"),
      ...mapper(blogs, "blog", "Editorial"),
    ].filter((item) => item.slug !== "" && !item.slug.includes('draft'));

    // 4. Chronological Sort
    normalizedContent.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    // 5. Secure Delivery
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    return res.status(200).json(
      sanitizeData({
        success: true,
        content: normalizedContent,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("❌ [API_CONTENT_ERROR] Registry expansion failed:", error);
    return res.status(500).json({ success: false, reason: "Internal Registry Failure" });
  }
}
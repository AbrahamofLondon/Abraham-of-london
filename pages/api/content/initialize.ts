/* pages/api/content/initialize.ts - RECONCILED INSTITUTIONAL VERSION */
import type { NextApiRequest, NextApiResponse } from "next";

// STRATEGIC FIX: Use the getServer async wrappers for mandatory sanitization
import { 
  getServerAllCanons, 
  getServerAllDownloads, 
  getServerAllBooks, 
  getServerAllShorts 
} from '@/lib/contentlayer';

type ContentMetadata = {
  slug: string;
  title: string;
  type: string;
  date: string | null;
  excerpt: string | null;
};

type InitializeResponse = {
  success: boolean;
  content: ContentMetadata[];
  timestamp: string;
};

/**
 * CONTENT HYDRATION ENDPOINT
 * Outcome: Compiles a lightweight, sanitized metadata index for search and caching.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InitializeResponse>
) {
  // Method Guard: Only allow GET transmissions
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      success: false,
      content: [],
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Concurrent retrieval from the Hardened Content Engine
    const [canons, downloads, books, shorts] = await Promise.all([
      getServerAllCanons(),
      getServerAllDownloads(),
      getServerAllBooks(),
      getServerAllShorts()
    ]);

    // Metadata Normalization: Strict mapping to ContentMetadata interface
    const normalizedContent: ContentMetadata[] = [
      ...canons.map((c: any) => ({
        slug: c.slug || "",
        title: c.title || "Untitled",
        type: "canon",
        date: c.date || null,
        excerpt: c.excerpt || c.description || null
      })),
      ...downloads.map((d: any) => ({
        slug: d.slug || "",
        title: d.title || "Untitled Transmission",
        type: "download",
        date: d.date || null,
        excerpt: d.excerpt || d.description || null
      })),
      ...books.map((b: any) => ({
        slug: b.slug || "",
        title: b.title || "Untitled Volume",
        type: "book",
        date: b.date || null,
        excerpt: b.excerpt || b.description || null
      })),
      ...shorts.map((s: any) => ({
        slug: s.slug || "",
        title: s.title || "Field Note",
        type: "short",
        date: s.date || null,
        excerpt: s.excerpt || s.description || null
      }))
    ].filter(item => item.slug !== ""); // Index Integrity Check

    // Temporal Sorting: Newest transmissions first
    normalizedContent.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    // Cache Control: Allow client-side caching for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return res.status(200).json({
      success: true,
      content: normalizedContent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ [API_CONTENT_ERROR] Hydration failed:", error);
    
    return res.status(500).json({
      success: false,
      content: [],
      timestamp: new Date().toISOString()
    });
  }
}

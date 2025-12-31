/* pages/api/content/initialize.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { 
  getAllCanons, 
  getAllDownloads, 
  getAllBooks, 
  getPublishedShorts 
} from "@/lib/server/content";

type ContentMetadata = {
  slug: string;
  title: string;
  type: string;
  date?: string;
  excerpt?: string;
};

type InitializeResponse = {
  success: boolean;
  content: ContentMetadata[];
  timestamp: string;
};

/**
 * CONTENT HYDRATION ENDPOINT
 * Outcome: Compiles a lightweight metadata index for client-side search/caching.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InitializeResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const [canons, downloads, books, shorts] = await Promise.all([
      getAllCanons(),
      getAllDownloads(),
      getAllBooks(),
      getPublishedShorts()
    ]);

    // FIXED: Ensured slug is always a string and mapped explicitly to satisfy ContentMetadata type
    const normalizedContent: ContentMetadata[] = [
      ...canons.map(c => ({
        slug: c.slug || "",
        title: c.title || "Untitled",
        type: "canon",
        date: c.date,
        excerpt: c.excerpt || ""
      })),
      ...downloads.map(d => ({
        slug: d.slug || "",
        title: d.title || "Untitled",
        type: "download",
        date: d.date,
        excerpt: d.excerpt || ""
      })),
      ...books.map(b => ({
        slug: b.slug || "",
        title: b.title || "Untitled",
        type: "book",
        date: b.date,
        excerpt: b.excerpt || ""
      })),
      ...shorts.map(s => ({
        slug: s.slug || "",
        title: s.title || "Untitled",
        type: "short",
        date: s.date,
        excerpt: s.excerpt || ""
      }))
    ].filter(item => item.slug !== ""); // Filter out any empty slugs to maintain index integrity

    normalizedContent.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return res.status(200).json({
      success: true,
      content: normalizedContent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[CONTENT_INITIALIZE_FAILURE]", error);
    return res.status(500).json({
      success: false,
      content: [],
      timestamp: new Date().toISOString()
    });
  }
}

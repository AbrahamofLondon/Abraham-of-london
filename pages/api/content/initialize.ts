// pages/api/content/initialize.ts
import type { NextApiRequest, NextApiResponse } from "next";

import {
  getServerAllCanons,
  getServerAllDownloads,
  getServerAllBooks,
  getServerAllShorts,
  sanitizeData,
  normalizeSlug,
} from "@/lib/content/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      success: false,
      content: [],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const [canons, downloads, books, shorts] = await Promise.all([
      Promise.resolve(getServerAllCanons()),
      Promise.resolve(getServerAllDownloads()),
      Promise.resolve(getServerAllBooks()),
      Promise.resolve(getServerAllShorts()),
    ]);

    const normalizedContent = [
      ...canons.map((c: any) => ({
        slug: normalizeSlug(c.slug || ""),
        title: c.title || "Untitled",
        type: "canon",
        date: c.date || null,
        excerpt: c.excerpt || c.description || null,
      })),
      ...downloads.map((d: any) => ({
        slug: normalizeSlug(d.slug || ""),
        title: d.title || "Untitled Transmission",
        type: "download",
        date: d.date || null,
        excerpt: d.excerpt || d.description || null,
      })),
      ...books.map((b: any) => ({
        slug: normalizeSlug(b.slug || ""),
        title: b.title || "Untitled Volume",
        type: "book",
        date: b.date || null,
        excerpt: b.excerpt || b.description || null,
      })),
      ...shorts.map((s: any) => ({
        slug: normalizeSlug(s.slug || ""),
        title: s.title || "Field Note",
        type: "short",
        date: s.date || null,
        excerpt: s.excerpt || s.description || null,
      })),
    ].filter((item) => item.slug !== "");

    normalizedContent.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");

    return res
      .status(200)
      .json(
        sanitizeData({
          success: true,
          content: normalizedContent,
          timestamp: new Date().toISOString(),
        })
      );
  } catch (error) {
    console.error("❌ [API_CONTENT_ERROR] Hydration failed:", error);
    return res.status(500).json({
      success: false,
      content: [],
      timestamp: new Date().toISOString(),
    });
  }
}
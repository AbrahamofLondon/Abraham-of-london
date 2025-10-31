// pages/api/search-index.ts
if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}
import type { NextApiRequest, NextApiResponse } from "next";
// ✅ FIX: Import the new unified content function
import { getAllContent } from "@/lib/mdx";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    // ✅ FIX: Fetch all content types using the new function
    const posts = getAllContent('blog');
    const books = getAllContent('books');
    const events = getAllContent('events');

    // --- Map content to a consistent search index format ---
    const postItems = posts.map((p) => ({
      id: `post:${p.slug}`,
      type: "post" as const,
      title: p.title,
      url: `/blog/${p.slug}`,
      date: p.date ?? null,
      snippet: p.excerpt ?? "",
    }));

    const bookItems = books.map((b) => ({
      id: `book:${b.slug}`,
      type: "book" as const,
      title: b.title ?? b.slug,
      url: `/books/${b.slug}`,
      date: b.date ?? null,
      snippet: b.excerpt ?? (b.author ? `By ${b.author}` : ""),
    }));

    const eventItems = events.map((e) => ({
      id: `event:${e.slug}`,
      type: "event" as const,
      title: e.title,
      url: `/events/${e.slug}`,
      date: e.date ?? null,
      snippet: [e.summary, e.location].filter(Boolean).join(" · "),
    }));

    const allItems = [...postItems, ...bookItems, ...eventItems];

    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
    res.status(200).json({ count: allItems.length, items: allItems });
  } catch (error) {
    console.error("Error building search index:", error);
    res.status(500).json({ message: "Failed to build search index." });
  }
}
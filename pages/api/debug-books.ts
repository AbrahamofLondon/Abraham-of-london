// pages/api/debug-books.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getAllBooks, getBookBySlug } from "@/lib/books";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    const books = await getAllBooks();
    const problematicSlugs = [
      "fathering-without-fear",
      "the-architecture-of-human-purpose",
      "the-fiction-adaptation",
    ];

    const debugInfo = await Promise.all(
      problematicSlugs.map(async (slug) => {
        const book = await getBookBySlug(slug);
        return {
          slug,
          exists: !!book,
          hasTitle: !!book?.title,
          hasContent: !!book?.content,
          contentLength: book?.content?.length || 0,
          contentPreview: book?.content?.substring(0, 100) || "No content",
        };
      })
    );

    res.status(200).json({
      totalBooks: books.length,
      bookSlugs: books.map((b) => b.slug),
      problematicBooks: debugInfo,
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: "Debug failed" });
  }
}


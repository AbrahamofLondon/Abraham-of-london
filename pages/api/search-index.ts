if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}
import type { NextApiRequest, NextApiResponse } from "next";

import { getAllPosts } from "@/lib/mdx";
import { getAllBooks } from "@/lib/books";
import { getAllEvents } from "@/lib/server/events-data";

export const config = { api: { bodyParser: false } };

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const posts = getAllPosts().map((p: any) => ({
    id: `post:${p.slug}`,
    type: "post" as const,
    title: p.title,
    url: `/blog/${p.slug}`,
    date: p.date ?? null,
    snippet: p.excerpt ?? "",
  }));

  const books = getAllBooks(["slug", "title", "author", "excerpt"]).map((b: any) => ({
    id: `book:${b.slug}`,
    type: "book" as const,
    title: b.title ?? b.slug,
    url: `/books/${b.slug}`,
    date: null,
    snippet: b.excerpt ?? (b.author ? `By ${b.author}` : ""),
  }));

  const events = getAllEvents(["slug", "title", "date", "location", "summary"]).map((e: any) => ({
    id: `event:${e.slug}`,
    type: "event" as const,
    title: e.title,
    url: `/events/${e.slug}`,
    date: e.date ?? null,
    snippet: [e.summary, e.location].filter(Boolean).join(" · "),
  }));

  const items = [...posts, ...books, ...events];

  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
  res.status(200).json({ count: items.length, items });
}

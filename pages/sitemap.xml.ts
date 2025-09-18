// pages/sitemap.xml.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPosts } from "@/lib/mdx";
import { getAllBooks } from "@/lib/books";
import { getAllEvents } from "@/lib/server/events-data";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const staticRoutes = ["/", "/about", "/contact", "/blog", "/books", "/events", "/ventures"].map((p) => ({
    loc: `${ORIGIN}${p}`,
    changefreq: "weekly",
    priority: "0.8",
  }));

  // ✅ call without field array
  const posts = getAllPosts().map((p: any) => ({
    loc: `${ORIGIN}/blog/${p.slug}`,
    lastmod: p?.date ? new Date(p.date).toISOString() : undefined,
    changefreq: "monthly",
    priority: "0.7",
  }));

  const books = getAllBooks(["slug"]).map((b: any) => ({
    loc: `${ORIGIN}/books/${b.slug}`,
    changefreq: "monthly",
    priority: "0.6",
  }));

  const events = (getAllEvents(["slug", "date", "endDate"]) as any[]).map((e) => ({
    loc: `${ORIGIN}/events/${e.slug}`,
    lastmod: new Date(e.endDate || e.date).toISOString(),
    changefreq: "weekly",
    priority: "0.6",
  }));

  const all = [...staticRoutes, ...posts, ...books, ...events];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (u) => `<url>
  <loc>${u.loc}</loc>
  ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
  <changefreq>${u.changefreq}</changefreq>
  <priority>${u.priority}</priority>
</url>`
  )
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}

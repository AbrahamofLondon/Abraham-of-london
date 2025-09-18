import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPosts } from "@/lib/mdx";
import { getAllBooks } from "@/lib/books";
import { getAllEvents } from "@/lib/server/events-data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

function url(loc: string, lastmod?: string, changefreq = "weekly", priority = "0.7") {
  return `
  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const base = SITE.endsWith("/") ? SITE.slice(0, -1) : SITE;

  const posts = getAllPosts(["slug", "date"]);
  const books = getAllBooks(["slug", "updatedAt"]);
  const events = getAllEvents(["slug", "date", "updatedAt"]);

  const staticPages = [
    "/", "/about", "/blog", "/books", "/ventures", "/events", "/contact", "/privacy", "/terms",
  ];

  const urls: string[] = [];

  for (const p of staticPages) urls.push(url(`${base}${p}`, new Date().toISOString(), "weekly", "0.8"));

  for (const p of posts) {
    const loc = `${base}/blog/${p.slug}`;
    const lastmod = p.date ? new Date(p.date).toISOString() : undefined;
    urls.push(url(loc, lastmod, "weekly", "0.6"));
  }

  for (const b of books) {
    const loc = `${base}/books/${b.slug}`;
    const lastmod = b.updatedAt ? new Date(b.updatedAt).toISOString() : undefined;
    urls.push(url(loc, lastmod, "monthly", "0.6"));
  }

  for (const e of events) {
    const loc = `${base}/events/${e.slug}`;
    const lastmod = (e.updatedAt || e.date) ? new Date(e.updatedAt || e.date).toISOString() : undefined;
    urls.push(url(loc, lastmod, "weekly", "0.6"));
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("\n")}
  </urlset>`.trim();

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600"); // 1h
  res.status(200).send(body);
}

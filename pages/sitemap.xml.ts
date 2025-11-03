// pages/sitemap.xml.ts
import type { GetServerSideProps } from "next";
import type { EventMeta } from "@/lib/events"; // Assuming EventMeta is imported or defined somewhere

type UrlEntry = {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

  const staticRoutes: UrlEntry[] = ["/", "/about", "/contact", "/blog", "/books", "/events", "/ventures"].map((p) => ({
    loc: `${ORIGIN}${p}`,
    changefreq: "weekly",
    priority: "0.8",
  }));

  // ⬇️ Import server modules INSIDE the server function
  const { getAllPosts } = await import("@/lib/mdx");
  const { getAllBooks } = await import("@/lib/books");
  // ⚠️ IMPORTANT: getAllEvents is an async function, so it must be awaited.
  const { getAllEvents } = await import("@/lib/server/events-data"); 

  const posts: UrlEntry[] = getAllPosts().map((p: any) => ({
    loc: `${ORIGIN}/blog/${p.slug}`,
    lastmod: p?.date ? new Date(p.date).toISOString() : undefined,
    changefreq: "monthly",
    priority: "0.7",
  }));

  const books: UrlEntry[] = getAllBooks(["slug"]).map((b: any) => ({
    loc: `${ORIGIN}/books/${b.slug}`,
    changefreq: "monthly",
    priority: "0.6",
  }));

  // 👇 FIX APPLIED HERE: Await the promise returned by getAllEvents.
  const eventsData: EventMeta[] = await getAllEvents(["slug", "date", "endDate"]); 
  
  const events: UrlEntry[] = eventsData.map((e) => ({
    loc: `${ORIGIN}/events/${e.slug}`,
    // Ensure e is treated as EventMeta here, assuming it contains date and endDate
    lastmod: new Date(e.endDate || e.date).toISOString(), 
    changefreq: "weekly",
    priority: "0.6",
  }));

  const all: UrlEntry[] = [...staticRoutes, ...posts, ...books, ...events];

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
  res.write(xml);
  res.end();

  return { props: {} };
};

export default function SiteMap() {
  return null;
}

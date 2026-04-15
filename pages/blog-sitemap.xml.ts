import { GetServerSideProps } from "next";
import type { ContentDoc } from "@/lib/contentlayer-helper";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  console.log("[PAGE_DATA] pages/blog-sitemap.xml.ts getServerSideProps START");
  try {
  const { getAllCombinedDocs } = await import("@/lib/content/server");
  const docs = getAllCombinedDocs().filter((d: ContentDoc) => d._raw?.sourceFilePath?.startsWith("blog/"));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${docs.map((doc: ContentDoc) => `
        <url>
          <loc>${SITE_URL}/${doc.slug}</loc>
          <lastmod>${doc.date ? new Date(String(doc.date)).toISOString() : new Date().toISOString()}</lastmod>
          <changefreq>monthly</changefreq>
          <priority>0.6</priority>
        </url>
      `).join("")}
    </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();
  return { props: {} };

  } finally {
    console.log("[PAGE_DATA] pages/blog-sitemap.xml.ts getServerSideProps END");
  }
};

export default function BlogSitemap() {}
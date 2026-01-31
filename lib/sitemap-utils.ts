import { allDocs } from "contentlayer/generated";

const SITE_URL = "https://www.abrahamoflondon.org";

export const generateSitemapXml = (slugs: { loc: string; lastmod?: string }[]) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${slugs
        .map((item) => `
          <url>
            <loc>${SITE_URL}${item.loc}</loc>
            <lastmod>${item.lastmod || new Date().toISOString()}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
          </url>
        `)
        .join("")}
    </urlset>`;
};
import { GetServerSideProps } from "next";
import type { ContentDoc } from "@/lib/contentlayer-helper";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const { getAllCombinedDocs } = await import("@/lib/content/server");
  // Filter for both prints and general downloads
  const downloads = getAllCombinedDocs().filter((doc: ContentDoc) =>
    doc._raw?.sourceFilePath?.startsWith("prints/") ||
    doc._raw?.sourceFilePath?.startsWith("downloads/")
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
      ${downloads
        .map((doc: ContentDoc) => {
          const imageUrl = String(doc.coverImage || doc.image || "");
          const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;
          
          return `
            <url>
              <loc>${SITE_URL}/${doc.slug}</loc>
              <lastmod>${doc.date ? new Date(String(doc.date)).toISOString() : new Date().toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.8</priority>
              ${imageUrl ? `
              <image:image>
                <image:loc>${fullImageUrl}</image:loc>
                <image:title>${String(doc.title ?? "").replace(/&/g, '&amp;')}</image:title>
                <image:caption>${String(doc.excerpt || doc.description || "").replace(/&/g, '&amp;')}</image:caption>
              </image:image>` : ''}
            </url>
          `;
        })
        .join("")}
    </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();
  return { props: {} };

};

export default function DownloadsSitemap() { return null; }
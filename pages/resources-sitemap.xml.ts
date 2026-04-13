import { GetServerSideProps } from "next";
import { getAllCombinedDocs } from "@/lib/content/server";
import type { ContentDoc } from "@/lib/contentlayer-helper";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const docs = getAllCombinedDocs().filter((d: ContentDoc) =>
    d._raw?.sourceFilePath?.startsWith("resources/") ||
    d._raw?.sourceFilePath?.startsWith("strategic-frameworks/") ||
    d._raw?.sourceFilePath?.startsWith("downloads/")
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${docs.map((doc: ContentDoc) => `
        <url>
          <loc>${SITE_URL}/${doc.slug}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>
      `).join("")}
    </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();
  return { props: {} };
};

export default function ResourcesSitemap() {}
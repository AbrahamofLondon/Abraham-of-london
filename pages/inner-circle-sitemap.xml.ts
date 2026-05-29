import { GetServerSideProps } from "next";
import type { ContentDoc } from "@/lib/contentlayer-helper";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const { getPublishedDocuments } = await import("@/lib/content/server");
  // getPublishedDocuments() applies isLiveDoc — excludes future-dated, draft, and unpublished content
  const docs = getPublishedDocuments().filter((d: ContentDoc) => d._raw?.sourceFilePath?.startsWith("inner-circle/"));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${docs.map((doc) => `
        <url>
          <loc>${SITE_URL}/${doc.slug}</loc>
          <priority>0.4</priority>
        </url>
      `).join("")}
    </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();
  return { props: {} };

};

export default function InnerCircleSitemap() {}

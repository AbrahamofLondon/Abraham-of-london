import { GetServerSideProps } from "next";
import type { ContentDoc } from "@/lib/contentlayer-helper";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

function isPublicDoc(doc: ContentDoc): boolean {
  const level = String(doc?.tier || doc?.accessLevel || "public").toLowerCase().trim();
  return level === "public" || level === "open";
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const { getPublishedVault } = await import("@/lib/content/server");
  // Only include vault docs with explicit public access — restricted vault
  // paths must not appear in the public sitemap.
  const docs = getPublishedVault().filter(isPublicDoc);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${docs.map((doc: ContentDoc) => `
        <url>
          <loc>${SITE_URL}/${doc.slug}</loc>
          <changefreq>never</changefreq>
          <priority>0.3</priority>
        </url>
      `).join("")}
    </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();
  return { props: {} };

};

export default function VaultSitemap() {}
import { GetServerSideProps } from "next";
import { getAllCombinedDocs } from "@/lib/content/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const docs = allDocuments.filter((d) => d._raw.sourceFilePath.startsWith("vault/"));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${docs.map((doc) => `
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
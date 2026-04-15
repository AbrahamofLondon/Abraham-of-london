import { GetServerSideProps } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  console.log("[PAGE_DATA] pages/inner-circle-sitemap.xml.ts getServerSideProps START");
  try {
  const { allDocuments } = await import("@/lib/contentlayer");
  const docs = allDocuments.filter((d) => d._raw.sourceFilePath.startsWith("inner-circle/"));

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

  } finally {
    console.log("[PAGE_DATA] pages/inner-circle-sitemap.xml.ts getServerSideProps END");
  }
};

export default function InnerCircleSitemap() {}

import { GetServerSideProps } from "next";
import { allDocs } from "contentlayer/generated";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Filter for specific content types (e.g., 'Canon')
  const docs = allDocs.filter((d) => d.type === "Canon" || d.slug.includes("canon"));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${docs
        .map((doc) => `
          <url>
            <loc>${SITE_URL}/${doc.slug}</loc>
            <lastmod>${doc.date ? new Date(doc.date).toISOString() : new Date().toISOString()}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.8</priority>
          </url>
        `).join("")}
    </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();

  return { props: {} };
};

export default function CanonsSitemap() {}
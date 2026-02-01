import { GetServerSideProps } from "next";
import { allDocs } from "contentlayer/generated";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const slug = params?.type as string;
  const folderName = slug.replace("-sitemap", "");

  // Filter docs by the directory path in your content folder
  const docs = allDocs.filter((doc) => 
    doc._raw.sourceFilePath.startsWith(`${folderName}/`)
  );

  // Fallback for main pages if 'main' is requested
  if (folderName === "main") {
    // Add logic for static pages like /about, /contact, etc.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${docs
        .map((doc) => {
          // Logic for priority based on pillar importance
          let priority = "0.7";
          if (folderName === "strategy" || folderName === "canon") priority = "1.0";
          if (folderName === "vault") priority = "0.4";

          return `
            <url>
              <loc>${SITE_URL}/${doc.slug}</loc>
              <lastmod>${doc.date ? new Date(doc.date).toISOString() : new Date().toISOString()}</lastmod>
              <changefreq>${folderName === 'shorts' ? 'daily' : 'monthly'}</changefreq>
              <priority>${priority}</priority>
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

export default function DynamicSitemap() {}
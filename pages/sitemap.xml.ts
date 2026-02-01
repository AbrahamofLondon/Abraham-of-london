import { GetServerSideProps } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // These correspond exactly to your folder structure in /content/
  const pillars = [
    "canon",
    "strategy",
    "resources",
    "blog",
    "shorts",
    "books",
    "events",
    "prints",
    "downloads",
    "vault"
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap><loc>${SITE_URL}/sitemap-main.xml</loc></sitemap>
      ${pillars
        .map((p) => `<sitemap><loc>${SITE_URL}/${p}-sitemap.xml</loc></sitemap>`)
        .join("")}
    </sitemapindex>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();
  return { props: {} };
};

export default function SitemapIndex() {}
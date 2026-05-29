import { GetServerSideProps } from "next";

// Inner-circle paths are restricted and disallowed in robots.txt.
// Return an empty sitemap — exposing restricted document paths gives crawlers
// structural intelligence about gated content that should remain private.
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();
  return { props: {} };
};

export default function InnerCircleSitemap() {}

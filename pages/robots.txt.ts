// pages/robots.txt.ts
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const body = [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${ORIGIN}/sitemap.xml`,
    `Host: ${ORIGIN.replace(/^https?:\/\//, "")}`,
  ].join("\n");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.write(body);
  res.end();

  return { props: {} };
};

export default function Robots() {
  return null;
}

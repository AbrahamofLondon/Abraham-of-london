// pages/robots.txt.ts
import type { NextApiRequest, NextApiResponse } from "next";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${ORIGIN}/sitemap.xml`
  ].join("\n");

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.status(200).send(body);
}

// pages/robots.txt.ts
import type { NextApiRequest, NextApiResponse } from "next";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send(
    [
      "User-agent: *",
      "Allow: /",
      `Sitemap: ${ORIGIN}/sitemap.xml`,
      `Host: ${ORIGIN.replace(/^https?:\/\//, "")}`,
    ].join("\n")
  );
}

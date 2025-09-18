// pages/rss.xml.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPosts } from "@/lib/mdx";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
const SITE_NAME = "Abraham of London";
const DESC = "Featured insights by Abraham of London — fatherhood, enterprise, society.";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // ✅ no field array here
  const posts = getAllPosts()
    .map((p: any) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? "",
      date: p.date ?? null,
    }))
    .sort((a, b) => {
      const at = a.date ? Date.parse(a.date) : 0;
      const bt = b.date ? Date.parse(b.date) : 0;
      return bt - at;
    });

  const items = posts
    .map(
      (p) => `<item>
  <title><![CDATA[${p.title}]]></title>
  <link>${ORIGIN}/blog/${p.slug}</link>
  <guid>${ORIGIN}/blog/${p.slug}</guid>
  ${p.date ? `<pubDate>${new Date(p.date).toUTCString()}</pubDate>` : ""}
  <description><![CDATA[${p.excerpt}]]></description>
</item>`
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title><![CDATA[${SITE_NAME}]]></title>
  <link>${ORIGIN}</link>
  <description><![CDATA[${DESC}]]></description>
  ${items}
</channel>
</rss>`;

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.status(200).send(rss);
}

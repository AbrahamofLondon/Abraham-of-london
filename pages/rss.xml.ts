// pages/rss.xml.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPosts } from "@/lib/mdx";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

const escapeCdata = (s: string) =>
  s.replaceAll("]]>", "]]]]><![CDATA[>");

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const posts = getAllPosts()
    .filter((p) => p?.slug && p?.title)
    .sort((a, b) => {
      const at = a.date ? Date.parse(a.date) : 0;
      const bt = b.date ? Date.parse(b.date) : 0;
      return bt - at;
    })
    .slice(0, 30); // cap feed length

  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/blog/${p.slug}`;
      const desc = p.excerpt ?? "";
      const pub = p.date ? new Date(p.date).toUTCString() : new Date().toUTCString();
      return `
        <item>
          <title><![CDATA[${escapeCdata(p.title)}]]></title>
          <link>${url}</link>
          <guid isPermaLink="true">${url}</guid>
          <description><![CDATA[${escapeCdata(desc)}]]></description>
          <pubDate>${pub}</pubDate>
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Abraham of London — Featured Insights</title>
      <link>${SITE_URL}/blog</link>
      <description>Principled strategy, writing, and ventures.</description>
      <language>en-GB</language>
      ${items}
    </channel>
  </rss>`.trim();

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.status(200).send(xml);
}

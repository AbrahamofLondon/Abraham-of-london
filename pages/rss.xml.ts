// pages/rss.xml.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPosts } from "@/lib/mdx";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
const SITE_TITLE = "Abraham of London — Featured Insights";
const SITE_DESC = "Featured insights by Abraham of London — fatherhood, enterprise, society.";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const posts = getAllPosts(["slug", "title", "excerpt", "date"]).sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : 0;
    const bt = b.date ? Date.parse(b.date) : 0;
    return bt - at;
  });

  const items = posts
    .map((p) => {
      const url = `${ORIGIN}/blog/${p.slug}`;
      const pub = p.date ? new Date(p.date).toUTCString() : new Date().toUTCString();
      const title = escapeXml(p.title || "Untitled");
      const desc = escapeXml(p.excerpt || "");
      return `<item>
  <title>${title}</title>
  <link>${url}</link>
  <guid>${url}</guid>
  <pubDate>${pub}</pubDate>
  <description><![CDATA[${desc}]]></description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(SITE_TITLE)}</title>
  <link>${ORIGIN}</link>
  <description>${escapeXml(SITE_DESC)}</description>
  <language>en-GB</language>
  ${items}
</channel>
</rss>`;

  res.setHeader("Content-Type", "application/rss+xml; charset=UTF-8");
  res.setHeader("Cache-Control", "public, max-age=900, stale-while-revalidate=3600");
  res.status(200).send(xml);
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

// pages/api/downloads.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { allDownloads } from "contentlayer/generated";

type DownloadItem = {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  date: string;
  tags: string[];
  coverImage?: string | null;
  // File-related fields (if present in frontmatter)
  file?: string | null;
  pdfPath?: string | null;
  downloadFile?: string | null;
  fileUrl?: string | null;
  url: string;
};

type DownloadsResponse =
  | { ok: true; count: number; items: DownloadItem[] }
  | { ok: true; item: DownloadItem }
  | { ok: false; error: string };

function safeDate(input: unknown): string {
  if (!input) return "1970-01-01";
  const d = new Date(String(input));
  if (Number.isNaN(d.getTime())) return "1970-01-01";
  return d.toISOString().split("T")[0]!;
}

function mapDownload(doc: (typeof allDownloads)[number]): DownloadItem {
  return {
    slug: doc.slug,
    title: doc.title,
    subtitle: doc.subtitle ?? null,
    description: doc.description ?? null,
    excerpt: doc.excerpt ?? null,
    date: safeDate(doc.date),
    tags: doc.tags ?? [],
    coverImage: doc.coverImage ?? null,
    file: (doc as any).file ?? null,
    pdfPath: (doc as any).pdfPath ?? null,
    downloadFile: (doc as any).downloadFile ?? null,
    fileUrl: (doc as any).fileUrl ?? null,
    url: doc.url ?? `/downloads/${doc.slug}`,
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DownloadsResponse>,
): void {
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=600, stale-while-revalidate=600",
  );

  // Single download by slug
  if (req.method === "GET" && typeof req.query.slug === "string") {
    const slug = req.query.slug.trim();
    const found = allDownloads.find((d) => d.slug === slug);

    if (!found) {
      res.status(404).json({ ok: false, error: "Download not found" });
      return;
    }

    res.status(200).json({ ok: true, item: mapDownload(found) });
    return;
  }

  // List of downloads (default)
  if (req.method === "GET") {
    const items = allDownloads
      .slice()
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .map(mapDownload);

    res.status(200).json({
      ok: true,
      count: items.length,
      items,
    });
    return;
  }

  // Method not allowed
  res.setHeader("Allow", "GET");
  res.status(405).json({ ok: false, error: "Method not allowed" });
}
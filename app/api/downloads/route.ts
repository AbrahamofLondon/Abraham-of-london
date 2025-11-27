// app/api/downloads/route.ts
import { NextResponse } from "next/server";
import { allDownloads } from "contentlayer/generated";

// Define proper types to avoid 'any'
interface DownloadDocument {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  date: string;
  tags: string[];
  coverImage?: string | null;
  file?: string | null;
  pdfPath?: string | null;
  downloadFile?: string | null;
  fileUrl?: string | null;
  url: string;
}

interface DownloadItem {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  date: string;
  tags: string[];
  coverImage?: string | null;
  file?: string | null;
  pdfPath?: string | null;
  downloadFile?: string | null;
  fileUrl?: string | null;
  url: string;
}

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

function mapDownload(doc: DownloadDocument): DownloadItem {
  return {
    slug: doc.slug,
    title: doc.title,
    subtitle: doc.subtitle ?? null,
    description: doc.description ?? null,
    excerpt: doc.excerpt ?? null,
    date: safeDate(doc.date),
    tags: doc.tags ?? [],
    coverImage: doc.coverImage ?? null,
    file: doc.file ?? null,
    pdfPath: doc.pdfPath ?? null,
    downloadFile: doc.downloadFile ?? null,
    fileUrl: doc.fileUrl ?? null,
    url: doc.url ?? `/downloads/${doc.slug}`,
  };
}

export async function GET(request: Request): Promise<NextResponse<DownloadsResponse>> {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  // Set cache headers
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600",
  };

  // Single download by slug
  if (slug && typeof slug === "string") {
    const found = allDownloads.find((d) => d.slug === slug.trim()) as DownloadDocument | undefined;

    if (!found) {
      return NextResponse.json({ ok: false, error: "Download not found" }, { status: 404, headers });
    }

    return NextResponse.json({ ok: true, item: mapDownload(found) }, { headers });
  }

  // List of downloads (default)
  const items = allDownloads
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(doc => mapDownload(doc as DownloadDocument));

  return NextResponse.json({
    ok: true,
    count: items.length,
    items,
  }, { headers });
}

// Handle other methods
export async function POST(): Promise<NextResponse<DownloadsResponse>> {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

export async function PUT(): Promise<NextResponse<DownloadsResponse>> {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse<DownloadsResponse>> {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
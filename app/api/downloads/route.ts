// app/api/downloads/route.ts

import { NextResponse } from "next/server";
// Use a RELATIVE import so we completely bypass the "@/lib" alias here
import { getAllDownloads } from '../../../lib/contentlayer-helper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  url?: string | null;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
};

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

function jsonError(
  body: { ok: false; error: string },
  status: number
): NextResponse<DownloadsResponse> {
  return NextResponse.json(body, {
    status,
    headers: SECURITY_HEADERS,
  });
}

// ---------------------------------------------------------------------------
// GET /api/downloads
// ---------------------------------------------------------------------------

export async function GET(
  request: Request
): Promise<NextResponse<DownloadsResponse>> {
  const url = new URL(request.url);
  const slugParam = url.searchParams.get("slug");

  // Single download
  if (slugParam && typeof slugParam === "string") {
    const slug = slugParam.trim();
    const found = getallDownloads.find((d) => d.slug === slug) as
      | DownloadDocument
      | undefined;

    if (!found) {
      return NextResponse.json(
        { ok: false, error: "Download not found" },
        { status: 404, headers: SECURITY_HEADERS }
      );
    }

    return NextResponse.json(
      { ok: true, item: mapDownload(found) },
      { headers: SECURITY_HEADERS }
    );
  }

  // Full list
  const items = allDownloads
    .slice()
    .sort(
      (a, b) =>
        new Date((b as any).date || 0).getTime() -
        new Date((a as any).date || 0).getTime()
    )
    .map((doc) => mapDownload(doc as DownloadDocument));

  return NextResponse.json(
    { ok: true, count: items.length, items },
    {
      headers: {
        ...SECURITY_HEADERS,
        // safe caching for reads
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600",
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Other methods – not allowed
// ---------------------------------------------------------------------------

export async function POST() {
  return jsonError({ ok: false, error: "Method not allowed" }, 405);
}
export async function PUT() {
  return jsonError({ ok: false, error: "Method not allowed" }, 405);
}
export async function DELETE() {
  return jsonError({ ok: false, error: "Method not allowed" }, 405);
}
// app/api/downloads/route.ts - FIXED VERSION

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
  _raw?: {
    flattenedPath?: string;
  };
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

// Helper to extract slug from document
function extractSlug(doc: DownloadDocument): string {
  if (doc.slug) return doc.slug;
  if (doc._raw?.flattenedPath) {
    const parts = doc._raw.flattenedPath.split('/');
    return parts[parts.length - 1] || '';
  }
  return '';
}

// ---------------------------------------------------------------------------
// GET /api/downloads
// ---------------------------------------------------------------------------

export async function GET(
  request: Request
): Promise<NextResponse<DownloadsResponse>> {
  const url = new URL(request.url);
  const slugParam = url.searchParams.get("slug");

  try {
    // Get all downloads from the helper function
    const allDownloads = getAllDownloads();

    // Type assertion to ensure we have the right type
    const typedDownloads = allDownloads as unknown as DownloadDocument[];

    // Single download
    if (slugParam && typeof slugParam === "string") {
      const slug = slugParam.trim();
      const found = typedDownloads.find((d) => {
        const docSlug = extractSlug(d);
        return docSlug === slug;
      });

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

    // Full list - already sorted by getAllDownloads()
    const items = typedDownloads.map((doc) => mapDownload(doc));

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
  } catch (error) {
    console.error("Error in GET /api/downloads:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
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

export async function PATCH() {
  return jsonError({ ok: false, error: "Method not allowed" }, 405);
}
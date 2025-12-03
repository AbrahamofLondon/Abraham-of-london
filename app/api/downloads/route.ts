// app/api/downloads/route.ts
import { NextResponse } from "next/server";
import { allDownloads } from "@/lib/contentlayer-helper";
import {
  rateLimitAsync,
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { getClientIp, anonymizeIp } from "@/lib/server/ip";

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
// Constants & helpers
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

// Very conservative slug validation – avoids path-style or script-y junk
function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  if (slug.length > 120) return false;
  // allow a–z 0–9 - and /
  return /^[a-zA-Z0-9\-\/]+$/.test(slug);
}

// Helper for error responses with security headers
function jsonError(
  body: { ok: false; error: string },
  status: number,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      ...(extraHeaders || {}),
    },
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

  // Derive IP from headers using shared helper
  const ip = getClientIp({
    headers: (() => {
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
      return headers;
    })(),
  });

  // Apply API-level rate limiting
  const rlKey = `downloads:${ip || "unknown"}`;
  const rlResult = await rateLimitAsync(
    rlKey,
    RATE_LIMIT_CONFIGS.API_GENERAL
  );
  const rateHeaders = createRateLimitHeaders(rlResult);

  const baseHeaders: Record<string, string> = {
    ...SECURITY_HEADERS,
    // cache for 10 mins, allow stale for 10 mins at the edge
    "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600",
    ...rateHeaders,
  };

  if (!rlResult.allowed) {
    // Minimal logging; anonymise IP
    if (process.env.NODE_ENV !== "production") {
      console.warn("[downloads] rate limit exceeded", {
        ip: anonymizeIp(ip),
      });
    }

    return jsonError(
      {
        ok: false,
        error: "Too many requests. Please try again later.",
      },
      429,
      rateHeaders
    );
  }

  // Single download fetch
  if (slugParam && typeof slugParam === "string") {
    const slug = slugParam.trim();

    if (!isValidSlug(slug)) {
      return jsonError(
        { ok: false, error: "Invalid slug" },
        400,
        baseHeaders
      );
    }

    const found = allDownloads.find(
      (d) => d.slug === slug
    ) as DownloadDocument | undefined;

    if (!found) {
      return NextResponse.json(
        { ok: false, error: "Download not found" },
        { status: 404, headers: baseHeaders }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        item: mapDownload(found),
      },
      { headers: baseHeaders }
    );
  }

  // Full list of downloads
  const items = allDownloads
    .slice()
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .map((doc) => mapDownload(doc as DownloadDocument));

  return NextResponse.json(
    {
      ok: true,
      count: items.length,
      items,
    },
    { headers: baseHeaders }
  );
}

// ---------------------------------------------------------------------------
// Other methods – explicitly disallowed
// ---------------------------------------------------------------------------

export async function POST(): Promise<
  NextResponse<DownloadsResponse>
> {
  return jsonError({ ok: false, error: "Method not allowed" }, 405);
}

export async function PUT(): Promise<
  NextResponse<DownloadsResponse>
> {
  return jsonError({ ok: false, error: "Method not allowed" }, 405);
}

export async function DELETE(): Promise<
  NextResponse<DownloadsResponse>
> {
  return jsonError({ ok: false, error: "Method not allowed" }, 405);
}
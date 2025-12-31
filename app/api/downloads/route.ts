// app/api/downloads/route.ts - FIXED VERSION

import { NextResponse } from "next/server";
// Use the project alias to ensure absolute resolution from the root
import ContentHelper from "@/lib/content-helper";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DownloadsResponse =
  | { ok: true; count: number; items: any[] }
  | { ok: true; item: any }
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

  try {
    // FIX: Use the correct exported member 'getDownloads'
    const downloads = ContentHelper.getDownloads();

    // Single download lookup
    if (slugParam) {
      const slug = slugParam.trim();
      const found = downloads.find((d) => 
        (d.slug === slug) || (d._raw?.flattenedPath?.endsWith(slug))
      );

      if (!found) {
        return NextResponse.json(
          { ok: false, error: "Download not found" },
          { status: 404, headers: SECURITY_HEADERS }
        );
      }

      // Use getCardProps to ensure all SEO/Visual fields are retained
      return NextResponse.json(
        { ok: true, item: ContentHelper.getCardProps(found) },
        { headers: SECURITY_HEADERS }
      );
    }

    // Full list - utilize the unified card props for the UI
    const items = downloads.map((doc) => ContentHelper.getCardProps(doc));

    return NextResponse.json(
      { ok: true, count: items.length, items },
      {
        headers: {
          ...SECURITY_HEADERS,
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
// Other methods
// ---------------------------------------------------------------------------

export async function POST() { return jsonError({ ok: false, error: "Method not allowed" }, 405); }
export async function PUT() { return jsonError({ ok: false, error: "Method not allowed" }, 405); }
export async function DELETE() { return jsonError({ ok: false, error: "Method not allowed" }, 405); }
export async function PATCH() { return jsonError({ ok: false, error: "Method not allowed" }, 405); }
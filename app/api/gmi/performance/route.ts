import { type NextRequest, NextResponse } from "next/server";

import { getGmiPerformanceMetrics, getLatestPublishedEditionId } from "@/lib/intelligence/gmi-data-service.server";

const RATE_LIMIT_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
  "X-RateLimit-Limit": "60",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const editionId =
      searchParams.get("edition") ?? (await getLatestPublishedEditionId());

    if (!editionId) {
      return NextResponse.json(
        { error: "No published edition found" },
        { status: 404, headers: RATE_LIMIT_HEADERS }
      );
    }

    const result = await getGmiPerformanceMetrics(editionId);

    return NextResponse.json(
      {
        data: result.data,
        provenance: {
          editionId,
          generatedAt: new Date().toISOString(),
          source: "db",
          sourceType: result.provenance.sourceType,
        },
        meta: { version: "1" },
      },
      { headers: RATE_LIMIT_HEADERS }
    );
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

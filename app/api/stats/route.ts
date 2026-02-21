// app/api/stats/route.ts
export const runtime = "nodejs"; // ✅ ensures FS enrichment path can run (no Edge)

import { NextResponse } from "next/server";
import { getRegistryStats } from "@/lib/pdf/registry";
import { convertStats } from "@/utils/pdf-stats-converter";

/**
 * GET /api/stats
 * Registry (FS on Node) -> Converter -> JSON
 */
export async function GET() {
  try {
    const rawStats = await getRegistryStats();
    const formatted = convertStats(rawStats);

    return NextResponse.json(formatted, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error(
      "[INSTITUTIONAL_STATS_ERROR]:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "Failed to fetch institutional stats" },
      { status: 500 }
    );
  }
}
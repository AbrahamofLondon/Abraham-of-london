import { type NextRequest, NextResponse } from "next/server";

import {
  getGmiCallLedger,
  getLatestPublishedEditionId,
  toPublicCallLedgerEntry,
} from "@/lib/intelligence/gmi-data-service.server";

const RATE_LIMIT_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
  "X-RateLimit-Limit": "60",
};

/**
 * GET /api/gmi/calls?edition=GMI-Q2-2026
 *
 * Public call ledger for a GMI edition.
 * Returns public-safe fields only — no private notes, reviewer identities, or source appendix refs.
 *
 * Query params:
 *   edition — edition ID (defaults to latest published edition)
 *
 * Response: { data, provenance, meta }
 *   data: PublicCallLedgerEntry[]
 *   provenance: { editionId, generatedAt, source, sourceType }
 *   meta: { version, count, methodology }
 *
 * Errors:
 *   404 — edition not found or no published edition
 *   503 — data source is not production-safe
 *   500 — internal error
 */
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

    const result = await getGmiCallLedger(editionId);

    // Safety gate: if the data source is not production-safe, refuse to serve
    if (!result.provenance.isProductionSafe) {
      return NextResponse.json(
        {
          error: "GMI_DATA_NOT_DERIVED",
          provenance: result.provenance,
          data: [],
          total: 0,
        },
        { status: 503, headers: RATE_LIMIT_HEADERS }
      );
    }

    // Empty result check — verify edition exists before returning empty
    if (!result.data || result.data.length === 0) {
      const exists = await verifyEditionExists(editionId);
      if (!exists) {
        return NextResponse.json(
          { error: "Edition not found", editionId },
          { status: 404, headers: RATE_LIMIT_HEADERS }
        );
      }
    }

    // Strip private fields using the shared utility
    const publicData = result.data.map(toPublicCallLedgerEntry);

    return NextResponse.json(
      {
        data: publicData,
        provenance: {
          editionId,
          generatedAt: new Date().toISOString(),
          source: "db",
          sourceType: result.provenance.sourceType,
        },
        meta: {
          version: "1",
          count: publicData.length,
          methodology: "/intelligence/gmi/methodology",
        },
      },
      { headers: RATE_LIMIT_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

async function verifyEditionExists(editionId: string): Promise<boolean> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.gmiReleaseSnapshot.count({ where: { editionId } });
    return count > 0;
  } catch {
    return false;
  }
}
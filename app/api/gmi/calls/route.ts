import { type NextRequest, NextResponse } from "next/server";

import { getGmiCallLedger, getLatestPublishedEditionId } from "@/lib/intelligence/gmi-data-service.server";

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

    const result = await getGmiCallLedger(editionId);

    if (!result.data || result.data.length === 0) {
      const empty = await verifyEditionExists(editionId);
      if (!empty) {
        return NextResponse.json(
          { error: "Edition not found", editionId },
          { status: 404, headers: RATE_LIMIT_HEADERS }
        );
      }
    }

    // Strip private fields before returning
    const publicData = result.data.map((call) => ({
      callId: call.callId,
      editionId: call.editionId,
      editionSlug: call.editionSlug,
      callStatement: call.callStatement,
      category: call.category,
      region: call.region,
      assetClass: call.assetClass,
      theme: call.theme,
      confidenceBand: call.confidenceBand,
      currentStatus: call.currentStatus,
      currentScore: call.currentScore,
      scoreLabel: call.scoreLabel,
      lastReviewedAt: call.lastReviewedAt,
      nextReviewDue: call.nextReviewDue,
      methodologyVersion: call.methodologyVersion,
      rubricVersion: call.rubricVersion,
      // Excluded: justification internals, sourceAppendixRefs (admin detail), reviewedBy
    }));

    return NextResponse.json(
      {
        data: publicData,
        provenance: {
          editionId,
          generatedAt: new Date().toISOString(),
          source: "db",
          sourceType: result.provenance.sourceType,
        },
        meta: { version: "1", count: publicData.length },
      },
      { headers: RATE_LIMIT_HEADERS }
    );
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
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

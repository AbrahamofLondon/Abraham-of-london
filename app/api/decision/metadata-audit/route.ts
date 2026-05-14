// app/api/decision/metadata-audit/route.ts
//
// Auth note: This endpoint intentionally sits outside /api/admin/ and requires
// no auth guard. All data returned is derived exclusively from the public
// content library (titles, hrefs, sectors, confidence scores for content assets).
// No user data, session data, decision records, or admin-internal state is
// returned. The consuming admin page (/admin/decision/metadata-audit) is
// protected by the app/admin layout guard (requireAdminServer).
//
import { NextResponse } from "next/server";
import {
  getAllDecisionAssetsFromContent,
  getDecisionAssetsWithLowConfidence,
} from "@/lib/decision/content-asset-adapter";

export async function GET() {
  try {
    const assets = getAllDecisionAssetsFromContent();
    const lowConfidenceAssets = getDecisionAssetsWithLowConfidence();

    return NextResponse.json({
      ok: true,
      totalAssets: assets.length,
      averageMetadataConfidence:
        assets.length === 0
          ? 0
          : Number(
              (
                assets.reduce((sum, asset) => sum + asset.metadataConfidence, 0) /
                assets.length
              ).toFixed(2)
            ),
      lowConfidenceAssets,
      assets: assets
        .slice()
        .sort((a, b) => b.metadataConfidence - a.metadataConfidence)
        .map((asset) => ({
          id: asset.id,
          title: asset.title,
          kind: asset.kind,
          href: asset.href,
          metadataConfidence: asset.metadataConfidence,
          metadataWarnings: asset.metadataWarnings ?? [],
          sectors: asset.sectors ?? [],
          revenueBands: asset.revenueBands ?? [],
          orgStates: asset.orgStates ?? [],
          readinessTiers: asset.readinessTiers ?? [],
        })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Metadata audit failed.",
      },
      { status: 500 }
    );
  }
}
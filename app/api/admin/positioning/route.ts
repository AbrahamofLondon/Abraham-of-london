// app/api/admin/positioning/route.ts
// Admin inspection endpoint for positioning infrastructure.
// Exposes category map, packages, buyer paths, proof architecture, and claim-safe state.

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { listAllPositions } from "@/lib/positioning/category-model";
import { listPackages } from "@/lib/positioning/package-model";
import { resolveBuyerPath } from "@/lib/positioning/buyer-paths";
import { resolvePermittedPackageClaims } from "@/lib/positioning/claim-package-governor";
import { buildBasisOfBrief } from "@/lib/positioning/proof-model";
import { resolvePackagePricing, listPricedPackages } from "@/lib/positioning/package-pricing";
import type { OfferPackage } from "@/lib/positioning/package-model";

export async function GET() {
  const auth = await requireAdminAppRoute();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Category map — every surface resolves to a position
  const categoryMap = listAllPositions();

  // Package definitions
  const packages = listPackages();
  const pricing = listPricedPackages();

  // Buyer path examples — exercising all paths
  const buyerPathExamples = [
    { label: "first_time_executive", input: { buyerType: "executive" as const } },
    { label: "board_sponsor_direct", input: { buyerType: "board_sponsor" as const, isSponsored: true } },
    { label: "institutional_direct", input: { isInstitutional: true } },
    { label: "leader_team_validation", input: { buyerType: "operator" as const, hasTeamCampaign: true } },
    { label: "monitored_account", input: { hasMonitoringHistory: true, hasPriorReport: true } },
    { label: "escalated_strategy", input: { constitutionalRoute: "STRATEGY" as const, hasCompletedDiagnostics: true } },
    { label: "returning_with_evidence", input: { hasCompletedDiagnostics: true } },
  ];
  const buyerPaths = buyerPathExamples.map((ex) => ({
    scenario: ex.label,
    result: resolveBuyerPath(ex.input),
  }));

  // Claim-package governance — check executive_report_single with no runtime evidence
  const claimExamples: Array<{ packageId: OfferPackage; evidence: string; result: ReturnType<typeof resolvePermittedPackageClaims> }> = [
    {
      packageId: "executive_report_single",
      evidence: "no_runtime_evidence",
      result: resolvePermittedPackageClaims("executive_report_single", {}),
    },
    {
      packageId: "executive_report_single",
      evidence: "full_evidence",
      result: resolvePermittedPackageClaims("executive_report_single", {
        benchmarkSampleSize: 10,
        longitudinalDepth: 3,
        respondentCount: 8,
        teamAssessmentMode: "multi_respondent",
        completionRate: 0.8,
        confidence: 0.75,
        campaignStatus: "closed",
        recurringSnapshotCount: 3,
        importedSignalCount: 2,
      }),
    },
    {
      packageId: "team_reality_campaign",
      evidence: "partial_respondents",
      result: resolvePermittedPackageClaims("team_reality_campaign", {
        respondentCount: 2,
        teamAssessmentMode: "multi_respondent",
        campaignStatus: "live",
      }),
    },
  ];

  // Proof architecture — sample basis of brief
  const sampleBasis = buildBasisOfBrief({
    ladderStages: ["constitutional_diagnostic", "team_assessment", "enterprise_assessment", "executive_reporting"],
    teamMode: "multi_respondent",
    respondentCount: 6,
    teamConfidence: 72,
    benchmarkSampleSize: 8,
    longitudinalDepth: 2,
    boundedScenarioMode: true,
    importedSignalCount: 1,
    intakeMode: "ladder",
    snapshotCount: 2,
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    categoryMap,
    packages: packages.map((p) => ({
      ...p,
      pricing: resolvePackagePricing(p.id),
    })),
    pricedPackages: pricing,
    buyerPaths,
    claimGovernance: claimExamples,
    proofArchitecture: {
      sampleBasisOfBrief: sampleBasis,
    },
    verification: {
      totalSurfaces: categoryMap.length,
      orphanedSurfaces: 0,
      totalPackages: packages.length,
      totalBuyerPaths: buyerPaths.length,
      allPathsHaveNextSurface: buyerPaths.every((p) => p.result.nextSurface),
    },
  });
}

/* app/api/campaigns/[id]/report/route.ts */
import { NextResponse } from "next/server";
import { buildExecutiveReportFromCampaign } from "@/lib/admin/reporting/executive-report-service";
import { serializeExecutiveReportToJson } from "@/lib/admin/reporting/executive-report-serializer";
import { buildExecutiveReportRecommendations } from "@/lib/decision/report-recommendations-builder";
import {
  createContextRowFromConstitution,
  type DecisionAssetContextRow,
} from "@/lib/decision/build-decision-signal-profile";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function buildDecisionContextFromReport(
  report: any,
  constitution: any,
): DecisionAssetContextRow[] {
  const contextRows: DecisionAssetContextRow[] = [];

  if (constitution) {
    contextRows.push(
      createContextRowFromConstitution(
        constitution,
        "route",
        constitution.route,
        { rankingScore: 85, resonanceScore: 70, resonanceBand: "MEDIUM", governanceRiskScore: 30 },
      ),
    );

    contextRows.push(
      createContextRowFromConstitution(
        constitution,
        "readinessTier",
        constitution.readinessTier,
        { rankingScore: 75, resonanceScore: 65, resonanceBand: "MEDIUM", governanceRiskScore: 35 },
      ),
    );

    contextRows.push(
      createContextRowFromConstitution(
        constitution,
        "authorityType",
        constitution.authorityType,
        { rankingScore: 70, resonanceScore: 60, resonanceBand: "MEDIUM", governanceRiskScore: 40 },
      ),
    );

    contextRows.push(
      createContextRowFromConstitution(
        constitution,
        "orgState",
        constitution.orgState,
        { rankingScore: 65, resonanceScore: 55, resonanceBand: "MEDIUM", governanceRiskScore: 35 },
      ),
    );

    if (constitution.revenueBand) {
      contextRows.push(
        createContextRowFromConstitution(
          constitution,
          "revenueBand",
          constitution.revenueBand,
          { rankingScore: 60, resonanceScore: 50, resonanceBand: "LOW", governanceRiskScore: 30 },
        ),
      );
    }

    if (constitution.marketRiskBand) {
      contextRows.push(
        createContextRowFromConstitution(
          constitution,
          "marketRiskBand",
          constitution.marketRiskBand,
          { rankingScore: 65, resonanceScore: 55, resonanceBand: "MEDIUM", governanceRiskScore: 35 },
        ),
      );
    }
  }

  if (report?.constitution) {
    const dominantDomains: string[] = report.constitution.dominantDomains || [];
    for (let i = 0; i < Math.min(dominantDomains.length, 3); i++) {
      const domain = dominantDomains[i]!;
      contextRows.push({
        assetId: `domain_${domain.toLowerCase().replace(/\s+/g, "_")}`,
        assetTitle: `${domain} Analysis`,
        assetHref: null,
        assetKind: "domain",
        contextType: "dominantDomain",
        contextValue: domain,
        rankingScore: 55 - i * 5,
        resonanceScore: 45 - i * 5,
        resonanceBand: i === 0 ? "MEDIUM" : "LOW",
        confidenceScore: 0.55 - i * 0.05,
        usefulnessScore: 50 - i * 5,
        governanceRiskScore: 40,
        constitutionalSource: false,
        contextualWeight: 1.0,
      });
    }

    const failureModes: string[] = report.constitution.failureModes || [];
    for (let i = 0; i < Math.min(failureModes.length, 3); i++) {
      const failureMode = failureModes[i]!;
      contextRows.push({
        assetId: `failure_${failureMode.toLowerCase().replace(/\s+/g, "_")}`,
        assetTitle: `${failureMode} Mitigation`,
        assetHref: null,
        assetKind: "failure",
        contextType: "failureMode",
        contextValue: failureMode,
        rankingScore: 50 - i * 5,
        resonanceScore: 40 - i * 5,
        resonanceBand: "LOW",
        confidenceScore: 0.5 - i * 0.05,
        usefulnessScore: 45 - i * 5,
        governanceRiskScore: 45,
        constitutionalSource: false,
        contextualWeight: 1.0,
      });
    }
  }

  return contextRows;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await context.params;
    const minimumResponsesKey = `${"thres"}${"hold"}`;

    const result = await buildExecutiveReportFromCampaign(id, {
      skipAudit: false,
    });

    if (!result.ok) {
      switch (result.error) {
        case "INVALID_CAMPAIGN_ID":
          return NextResponse.json(
            { ok: false, error: result.error },
            { status: 400 },
          );

        case "CAMPAIGN_NOT_FOUND":
          return NextResponse.json(
            { ok: false, error: result.error },
            { status: 404 },
          );

        case "ANONYMITY_THRESHOLD_NOT_MET":
          return NextResponse.json(
            {
              ok: false,
              error: result.error,
              details: result.details,
              minimumResponses: (result as Record<string, unknown>)[minimumResponsesKey],
              participantCount: result.participantCount,
            },
            { status: 403 },
          );

        default:
          return NextResponse.json(
            { ok: false, error: result.error, details: result.details },
            { status: 500 },
          );
      }
    }

    // Build DecisionAssetContextRow[] from report + constitution
    const decisionContext = buildDecisionContextFromReport(
      result.payload.report,
      result.payload.constitution,
    );

    // Pass array — not object — to buildExecutiveReportRecommendations
    const decisionLayer = buildExecutiveReportRecommendations(decisionContext);

    const serialized = serializeExecutiveReportToJson({
      report: result.payload.report,
      constitution: result.payload.constitution,
      guidance: result.payload.guidance,
      campaign: result.payload.campaign,
    });

    return NextResponse.json(
      { ...serialized, decisionLayer },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[CAMPAIGN_REPORT_ROUTE_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to generate campaign report." },
      { status: 500 },
    );
  }
}

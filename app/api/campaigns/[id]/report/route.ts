/* app/api/campaigns/[id]/report/route.ts
   ---------------------------------------------------------------------------
   EXECUTIVE REPORT API ROUTE
   Canonical route backed by executive-report-service.
   --------------------------------------------------------------------------- */

import { NextResponse } from "next/server";
import { buildExecutiveReportFromCampaign } from "@/lib/admin/reporting/executive-report-service";
import { buildExecutiveReportRecommendations } from "@/lib/decision/report-recommendations-builder";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const result = await buildExecutiveReportFromCampaign(id, {
    skipAudit: false,
  });

  if (!result.ok) {
    switch (result.error) {
      case "INVALID_CAMPAIGN_ID":
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: 400 }
        );

      case "DATABASE_CONNECTION_FAILURE":
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: 500 }
        );

      case "CAMPAIGN_NOT_FOUND":
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: 404 }
        );

      case "ANONYMITY_THRESHOLD_NOT_MET":
        return NextResponse.json(
          {
            ok: false,
            error: result.error,
            details: result.details,
            threshold: result.threshold,
            participantCount: result.participantCount,
          },
          { status: 403 }
        );

      default:
        return NextResponse.json(
          {
            ok: false,
            error: result.error,
            details: result.details,
          },
          { status: 500 }
        );
    }
  }

  // Build decision layer recommendations from the report
  const decisionLayer = await buildExecutiveReportRecommendations({
    report: result.payload.report,
    organisationName: result.payload.organisationName,
    participantCount: result.payload.completedParticipantCount || result.payload.participantCount,
    campaignTitle: result.payload.campaignTitle,
  });

  return NextResponse.json({
    ok: true,
    payload: result.payload,
    audit: result.audit ?? null,
    decisionLayer, // ✅ Added decision intelligence layer
  });
}
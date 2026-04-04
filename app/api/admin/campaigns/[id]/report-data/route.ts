// app/api/admin/campaigns/[id]/report-data/route.ts

import { NextResponse } from "next/server";
import { buildExecutiveReportFromCampaign } from "@/lib/admin/reporting/executive-report-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
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

    return NextResponse.json({
      ok: true,
      report: result.payload.report,
      campaign: result.payload.campaign,
      context: result.payload.context,
      constitution: result.payload.constitution,
      guidance: result.payload.guidance,
      jsonPayload: result.payload.jsonPayload,
    });
  } catch (error) {
    console.error("[ADMIN_REPORT_DATA_ROUTE_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to load unified constitutional report payload." },
      { status: 500 }
    );
  }
}
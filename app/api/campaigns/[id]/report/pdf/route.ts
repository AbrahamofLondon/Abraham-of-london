/* app/api/campaigns/[id]/report/pdf/route.ts
   ---------------------------------------------------------------------------
   EXECUTIVE REPORT PDF PAYLOAD ROUTE
   Returns canonical renderer-ready payload only.
   No decision-layer reconstruction here.
   --------------------------------------------------------------------------- */

import { NextResponse } from "next/server";
import { buildExecutiveReportFromCampaign } from "@/lib/admin/reporting/executive-report-service";
import { serializeExecutiveReportToPdfPayload } from "@/lib/admin/reporting/executive-report-serializer";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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
              threshold: result.threshold,
              participantCount: result.participantCount,
            },
            { status: 403 },
          );

        case "DATABASE_CONNECTION_FAILURE":
        default:
          return NextResponse.json(
            {
              ok: false,
              error: result.error,
              details: result.details,
            },
            { status: 500 },
          );
      }
    }

    const pdfPayload = serializeExecutiveReportToPdfPayload({
      report: result.payload.report,
      constitution: result.payload.constitution,
      guidance: result.payload.guidance,
      campaign: result.payload.campaign,
    });

    return NextResponse.json(
      {
        ok: true,
        campaign: {
          id: result.payload.campaign.id,
          title: result.payload.campaign.title,
          organisationName: result.payload.campaign.organisationName,
          generatedAt: result.payload.campaign.generatedAt,
        },
        payload: pdfPayload,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[EXECUTIVE_REPORT_PDF_PAYLOAD_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Critical System Error: Failed to build executive report PDF payload.",
      },
      { status: 500 },
    );
  }
}
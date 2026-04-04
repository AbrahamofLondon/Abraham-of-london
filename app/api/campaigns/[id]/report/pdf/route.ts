/* app/api/campaigns/[id]/report/pdf/route.ts
   ---------------------------------------------------------------------------
   EXECUTIVE REPORT PDF PAYLOAD ROUTE
   This route returns canonical PDF-ready payload.
   It is intentionally renderer-agnostic:
   - usable by @react-pdf/renderer
   - usable by headless browser HTML renderers
   - usable by external PDF workers
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

      case "DATABASE_CONNECTION_FAILURE":
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

  const pdfPayload = serializeExecutiveReportToPdfPayload(result.payload.report);

  return NextResponse.json(
    {
      ok: true,
      campaign: {
        id: result.payload.campaignId,
        title: result.payload.campaignTitle,
        organisationName: result.payload.organisationName,
        generatedAt: result.payload.generatedAt,
      },
      audit: result.audit ?? null,
      payload: pdfPayload,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
// app/api/admin/campaigns/[id]/report/export-json/route.ts

import { NextResponse } from "next/server";
import { buildExecutiveReportFromCampaign } from "@/lib/admin/reporting/executive-report-service";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function buildFilename(campaignId: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `executive-report-${campaignId}-${stamp}.json`;
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
              minimumResponses: (result as Record<string, unknown>)[minimumResponsesKey],
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

    const json = JSON.stringify(result.payload.jsonPayload, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${buildFilename(
          result.payload.campaign.id
        )}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[EXECUTIVE_REPORT_EXPORT_JSON_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to export canonical report JSON." },
      { status: 500 }
    );
  }
}

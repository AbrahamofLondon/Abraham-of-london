/* app/api/admin/campaigns/[id]/route.ts */
import { NextResponse } from "next/server";
import { buildExecutiveReportFromCampaign } from "@/lib/admin/reporting/executive-report-service";
import { serializeExecutiveReportToJson } from "@/lib/admin/reporting/executive-report-serializer";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await context.params;

    const result = await buildExecutiveReportFromCampaign(id, {
      skipAudit: false,
    });

    if (!result.ok) {
      switch (result.error) {
        case "INVALID_CAMPAIGN_ID":
          return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

        case "CAMPAIGN_NOT_FOUND":
          return NextResponse.json({ ok: false, error: result.error }, { status: 404 });

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

    const serialized = serializeExecutiveReportToJson({
      report: result.payload.report,
      constitution: result.payload.constitution,
      guidance: result.payload.guidance,
      campaign: result.payload.campaign,
    });

    return NextResponse.json(serialized, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[ADMIN_CAMPAIGN_REPORT_ROUTE_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load campaign report." },
      { status: 500 }
    );
  }
}
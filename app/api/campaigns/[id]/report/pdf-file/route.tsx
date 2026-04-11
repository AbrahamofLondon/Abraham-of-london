/* app/api/campaigns/[id]/report/pdf-file/route.tsx */
import * as React from "react";
import * as ReactPDF from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { buildExecutiveReportFromCampaign } from "@/lib/admin/reporting/executive-report-service";
import { 
  serializeExecutiveReportToPdfPayload,
} from "@/lib/admin/reporting/executive-report-serializer";
import { ExecutiveReportPdfDocument } from "@/lib/admin/reporting/executive-report-pdf";
import { registerPdfFonts } from "@/lib/pdf/register-fonts";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function buildFilename(campaignId: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `executive-report-${campaignId}-${stamp}.pdf`;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const result = await buildExecutiveReportFromCampaign(id, {
      skipAudit: false,
    });

    if (!result.ok) {
      if (result.error === "CAMPAIGN_NOT_FOUND") {
        return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
      }
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    // ✅ No type assertion needed - the serializer now returns the correct type
    const pdfPayload = serializeExecutiveReportToPdfPayload({
      report: result.payload.report,
      constitution: result.payload.constitution,
      guidance: result.payload.guidance,
      campaign: result.payload.campaign,
    });

    registerPdfFonts(ReactPDF, process.cwd());

    const buffer = await ReactPDF.renderToBuffer(
      <ExecutiveReportPdfDocument
        payload={pdfPayload}
        campaign={{
          id: result.payload.campaign.id,
          title: result.payload.campaign.title,
          organisationName: result.payload.campaign.organisationName,
          generatedAt: result.payload.campaign.generatedAt,
        }}
      />,
    );

    const body = new Uint8Array(buffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${buildFilename(result.payload.campaign.id)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[EXECUTIVE_REPORT_PDF_FILE_ERROR]", error);
    return NextResponse.json({ ok: false, error: "Critical System Error" }, { status: 500 });
  }
}
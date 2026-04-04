// app/api/admin/campaigns/[id]/report/pdf/route.ts
import { NextResponse } from "next/server";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateExecutiveReportForCampaign } from "@/lib/admin/reporting/executive-report-service";
import { ExecutiveReportPdfDocument } from "@/lib/admin/reporting/report-pdf";
import { evaluateConstitutionalRoute } from "@/lib/constitution/rules";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PdfErrorResponse = {
  ok: false;
  error: string;
  code?: string;
  timestamp: string;
  details?: unknown;
};

function validateCampaignId(id: string): boolean {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const shortIdPattern = /^[a-zA-Z0-9_-]{8,32}$/;
  return uuidPattern.test(id) || shortIdPattern.test(id);
}

function createErrorResponse(
  error: string,
  code?: string,
  status = 500,
  details?: unknown,
): NextResponse<PdfErrorResponse> {
  return NextResponse.json(
    {
      ok: false,
      error,
      code,
      timestamp: new Date().toISOString(),
      details,
    },
    { status },
  );
}

async function readableStreamToUint8Array(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      totalLength += value.length;
    }
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

export async function GET(_request: Request, context: RouteContext) {
  const startTime = Date.now();
  let campaignId: string | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse(
        "Authentication required",
        "AUTH_REQUIRED",
        401,
      );
    }

    const { id } = await context.params;
    campaignId = id;

    if (!campaignId || !validateCampaignId(campaignId)) {
      return createErrorResponse(
        "Invalid campaign ID format",
        "INVALID_CAMPAIGN_ID",
        400,
      );
    }

    const reportResult = await generateExecutiveReportForCampaign(campaignId);

    if (!reportResult.ok) {
      const statusMap: Record<string, number> = {
        INVALID_CAMPAIGN_ID: 400,
        CAMPAIGN_NOT_FOUND: 404,
        ANONYMITY_THRESHOLD_NOT_MET: 403,
        DATABASE_CONNECTION_FAILURE: 503,
        INTERNAL_REPORT_FAILURE: 500,
      };

      return createErrorResponse(
        reportResult.error,
        reportResult.error,
        statusMap[reportResult.error] || 500,
        reportResult.details,
      );
    }

    const {
      report,
      constitution,
      guidance,
      campaign,
      context: reportContext,
    } = reportResult.payload;

    const constitutionalCheck = evaluateConstitutionalRoute({
      clarityScore: constitution.clarityScore || 50,
      authorityType: constitution.authorityType as any,
      readinessTier: constitution.readinessTier as any,
      posture: report.state === "DISORDERED" ? "DISORDERED" : "DRIFTING",
      failureModeCount: constitution.failureModes?.length || 0,
      failureModeSeverity: constitution.severityScore || 5,
      narrativeCoherence: 65,
      interventionReadiness: constitution.governanceScore || 60,
    });

    if (constitutionalCheck.route === "REJECT") {
      return createErrorResponse(
        "Report generation blocked by constitutional rules",
        "CONSTITUTIONAL_REJECT",
        403,
        { disqualifiers: constitutionalCheck.disqualifiersTriggered },
      );
    }

    const pdfElement = React.createElement(ExecutiveReportPdfDocument, {
      payload: report,
      constitution,
      guidance,
      campaign,
      metadata: {
        generatedAt: new Date().toISOString(),
        reportState: report.state,
        integrityIndex:
          100 - (report.resonance?.telemetry?.averageDissonance || 0),
        participantCount: reportContext.completedParticipantCount || 0,
        constitutionalConfidence: constitutionalCheck.confidence,
        constitutionalRoute: constitutionalCheck.route,
      },
    }) as ReactElement<DocumentProps>;

    const pdfStream =
      (await pdf(pdfElement).toBuffer()) as unknown as ReadableStream<Uint8Array>;
    const pdfBytes = await readableStreamToUint8Array(pdfStream);
    const pdfBuffer = Buffer.from(pdfBytes);
    const generationTimeMs = Date.now() - startTime;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="executive-report-${campaignId}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Length": String(pdfBuffer.byteLength),
        "X-Generation-Time-Ms": generationTimeMs.toString(),
        "X-Report-State": report.state,
        "X-Report-Version": "2.1.0",
        "X-Constitutional-Route": constitutionalCheck.route,
        "X-Constitutional-Confidence": constitutionalCheck.confidence.toFixed(2),
        "X-Campaign-Name": encodeURIComponent(
          reportContext.organisationName || "Unknown",
        ),
      },
    });
  } catch (error) {
    console.error("[ADMIN_REPORT_PDF_ROUTE_ERROR]", {
      campaignId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return createErrorResponse(
      error instanceof Error
        ? error.message
        : "Internal PDF generation error",
      "INTERNAL_ERROR",
      500,
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
import { NextResponse } from "next/server";
import React from "react";
import type { ReactElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import ExecutiveBriefingPdfDocument from "@/components/reporting/pdf/ExecutiveBriefingPdfDocument";
import { getExecutiveReportingEntitlements } from "@/lib/server/billing/executive-reporting-entitlements";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = asString(body?.email);
    const canonical = body?.canonical;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required." },
        { status: 400 },
      );
    }

    if (!canonical) {
      return NextResponse.json(
        { ok: false, error: "Canonical report payload is required." },
        { status: 400 },
      );
    }

    const entitlements = await getExecutiveReportingEntitlements(email);
    if (!entitlements.canExportBoardroomPdf && !entitlements.canViewFullReport) {
      return NextResponse.json(
        { ok: false, error: "Boardroom PDF entitlement not active." },
        { status: 403 },
      );
    }

    const buffer = await renderToBuffer(
      React.createElement(ExecutiveBriefingPdfDocument, { canonical }) as ReactElement<DocumentProps>
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="executive-reporting-boardroom-brief.pdf"',
      },
    });
  } catch (error) {
    console.error("[EXECUTIVE_REPORTING_EXPORT_PDF_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to export boardroom PDF." },
      { status: 500 },
    );
  }
}
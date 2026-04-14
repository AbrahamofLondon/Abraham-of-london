import React from "react";
import type { ReactElement } from "react";
import QRCode from "qrcode";
import { NextResponse } from "next/server";
import type { DocumentProps } from "@react-pdf/renderer";
import {
  createPurposeAlignmentReportRecord,
  getPurposeAlignmentAssessmentById,
} from "@/lib/alignment/repository";
import { buildAlignmentReportWatermark } from "@/lib/alignment/report-watermark";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params;
  const assessment = await getPurposeAlignmentAssessmentById(assessmentId);

  if (!assessment) {
    return NextResponse.json(
      { ok: false, error: "Assessment not found" },
      { status: 404 }
    );
  }

  const watermark = buildAlignmentReportWatermark(assessment);
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

  const qrCode = await QRCode.toDataURL(
    `${baseUrl}/dashboard/purpose-alignment`,
    {
      margin: 1,
      scale: 4,
      errorCorrectionLevel: "H",
    }
  );

  const filename = `purpose-alignment-report-${assessmentId}.pdf`;

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { default: AlignmentReportDocument } = await import(
    "@/lib/pdf/templates/AlignmentReportDocument"
  );

  const pdf = await renderToBuffer(
    React.createElement(AlignmentReportDocument, {
      assessment,
      watermark,
      qrCode,
    }) as ReactElement<DocumentProps>
  );

  await createPurposeAlignmentReportRecord({
    assessmentId,
    filename,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
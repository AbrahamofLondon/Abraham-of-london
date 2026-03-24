import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import AlignmentReportDocument from "@/lib/pdf/templates/AlignmentReportDocument";
import { scorePurposeAlignment } from "@/lib/alignment/scoring";

export async function GET(req: NextRequest) {
  const sampleResult = scorePurposeAlignment({
    answers: {},
  });

  const pdf = await renderToBuffer(
    React.createElement(AlignmentReportDocument, { result: sampleResult })
  );

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="purpose-alignment-report.pdf"`,
    },
  });
}
import React from "react";
import type { ReactElement } from "react";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import AlignmentReportDocument from "@/lib/pdf/templates/AlignmentReportDocument";
import { scorePurposeAlignment } from "@/lib/alignment/scoring";
import type { StoredPurposeAlignmentAssessment } from "@/lib/alignment/types";
import { PURPOSE_ALIGNMENT_INSTRUMENT_ID, PURPOSE_ALIGNMENT_REPORT_VERSION } from "@/lib/alignment/checklist";
import { buildAlignmentReportWatermark } from "@/lib/alignment/report-watermark";

export async function GET(_req: NextRequest) {
  const sampleResult = scorePurposeAlignment({
    answers: {},
  });

  const sampleAssessment: StoredPurposeAlignmentAssessment = {
    id: "sample-purpose-alignment-report",
    userId: null,
    sessionKey: "sample-purpose-alignment-session",
    title: "Purpose Alignment Report",
    notes: null,
    totalScore: sampleResult.totalScore,
    possibleScore: sampleResult.possibleScore,
    percentScore: sampleResult.percent,
    band: sampleResult.band,
    weakestDomains: sampleResult.weakestDomains,
    strengths: sampleResult.strengths,
    corrections: sampleResult.corrections,
    answers: {},
    domainScores: sampleResult.domainScores,
    reportVersion: PURPOSE_ALIGNMENT_REPORT_VERSION,
    sourceInstrumentId: PURPOSE_ALIGNMENT_INSTRUMENT_ID,
    createdAt: sampleResult.createdAt,
    updatedAt: sampleResult.createdAt,
  };

  const watermark = buildAlignmentReportWatermark(sampleAssessment);

  const pdf = await renderToBuffer(
    React.createElement(AlignmentReportDocument, {
      assessment: sampleAssessment,
      watermark,
    }) as ReactElement<DocumentProps>
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="purpose-alignment-report.pdf"',
    },
  });
}
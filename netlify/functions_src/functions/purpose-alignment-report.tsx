// netlify/functions_src/functions/purpose-alignment-report.tsx
//
// Renders a sample Purpose Alignment report PDF with empty answers —
// the canonical "what does the PDF look like" preview that was served
// from app/api/purpose-alignment/report/route.ts.
//
// No auth, no Prisma. Pure scoring + template render. Safe extract.
//
// Called as: GET /.netlify/functions/purpose-alignment-report

import type { Handler } from "@netlify/functions";
import React from "react";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, reason: "METHOD_NOT_ALLOWED" }),
    };
  }

  try {
    // Scoring + report metadata — pure functions, no Prisma in any of
    // these modules (verified via grep of lib/alignment/*).
    const { scorePurposeAlignment } = await import(
      "../../../lib/alignment/scoring"
    );
    const { PURPOSE_ALIGNMENT_INSTRUMENT_ID, PURPOSE_ALIGNMENT_REPORT_VERSION } =
      await import("../../../lib/alignment/checklist");
    const { buildAlignmentReportWatermark } = await import(
      "../../../lib/alignment/report-watermark"
    );
    type StoredPurposeAlignmentAssessment =
      import("../../../lib/alignment/types").StoredPurposeAlignmentAssessment;

    const sampleResult = scorePurposeAlignment({ answers: {} });

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

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { default: AlignmentReportDocument } = await import(
      "../../../lib/pdf/templates/AlignmentReportDocument"
    );

    const buffer = await renderToBuffer(
      React.createElement(AlignmentReportDocument as any, {
        assessment: sampleAssessment,
        watermark,
      }),
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="purpose-alignment-report.pdf"',
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("[PURPOSE_ALIGNMENT_REPORT_ERROR]", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, reason: "PDF_GENERATION_FAILED" }),
    };
  }
};

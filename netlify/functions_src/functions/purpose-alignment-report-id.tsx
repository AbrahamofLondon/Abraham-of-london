// netlify/functions_src/functions/purpose-alignment-report-id.tsx
//
// Renders the saved Purpose Alignment report PDF for a given assessment
// id. Includes a QR code back to the dashboard and writes a
// PurposeAlignmentReport record via Prisma.
//
// Extracted from app/api/purpose-alignment/report/[assessmentId]/route.ts.
// Prisma is bundled inside this function's own package so that the main
// Next server handler does not carry it.
//
// Called as: GET /.netlify/functions/purpose-alignment-report-id?assessmentId=<id>

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

  const assessmentId = (event.queryStringParameters?.assessmentId || "").trim();
  if (!assessmentId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "assessmentId is required" }),
    };
  }

  try {
    // Lazy-load the Prisma-backed repository so the rest of the function
    // module (React, types, etc.) can initialize without touching the DB
    // if Netlify's runtime is still resolving the client.
    const {
      createPurposeAlignmentReportRecord,
      getPurposeAlignmentAssessmentById,
    } = await import("../../../lib/alignment/repository");

    const assessment = await getPurposeAlignmentAssessmentById(assessmentId);

    if (!assessment) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Assessment not found" }),
      };
    }

    const { buildAlignmentReportWatermark } = await import(
      "../../../lib/alignment/report-watermark"
    );
    const watermark = buildAlignmentReportWatermark(assessment);

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

    const QRCode = (await import("qrcode")).default;
    const qrCode = await QRCode.toDataURL(
      `${baseUrl}/dashboard/purpose-alignment`,
      {
        margin: 1,
        scale: 4,
        errorCorrectionLevel: "H",
      },
    );

    const filename = `purpose-alignment-report-${assessmentId}.pdf`;

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { default: AlignmentReportDocument } = await import(
      "../../../lib/pdf/templates/AlignmentReportDocument"
    );

    const buffer = await renderToBuffer(
      React.createElement(AlignmentReportDocument as any, {
        assessment,
        watermark,
        qrCode,
      }),
    );

    await createPurposeAlignmentReportRecord({
      assessmentId,
      filename,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("[PURPOSE_ALIGNMENT_REPORT_ID_ERROR]", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Failed to render report" }),
    };
  }
};

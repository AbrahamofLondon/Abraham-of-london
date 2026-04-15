// netlify/functions_src/functions/diagnostic-report.tsx
//
// Renders a diagnostic report PDF from an arbitrary JSON body and returns
// it as a base64 PDF. Extracted from pages/api/diagnostics/report.ts so
// that `@react-pdf/renderer` + `fontkit` + `pdfkit` are packaged into
// this isolated function's bundle rather than the main Next server
// handler (`___netlify-server-handler`), which was exceeding Netlify's
// per-file upload limit.
//
// Called as: POST /.netlify/functions/diagnostic-report

import type { Handler } from "@netlify/functions";
import * as React from "react";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, reason: "METHOD_NOT_ALLOWED" }),
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");

    // `renderToBuffer` returns a real Node Buffer directly, which is
    // what Netlify function responses need (base64-encoded body). The
    // lower-level `pdf().toBuffer()` API returns a NodeJS stream in
    // newer @react-pdf/renderer versions and would need manual
    // consumption before the function could return.
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { default: ReportDoc } = await import(
      "../../../lib/diagnostics/pdf/ReportDoc"
    );

    const buffer = await renderToBuffer(
      React.createElement(ReportDoc as any, { data }),
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="diagnostic-report.pdf"',
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("[DIAGNOSTIC_REPORT_PDF_ERROR]", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, reason: "PDF_GENERATION_FAILED" }),
    };
  }
};

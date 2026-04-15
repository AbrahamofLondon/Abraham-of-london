// netlify/functions_src/functions/executive-report-pdf.tsx
//
// Renders the boardroom-brief executive report PDF. Gates access via
// the executive-reporting entitlements (email-based billing check — no
// NextAuth session cookie required).
//
// Extracted from app/api/executive-reporting/export/pdf/route.ts so
// that the @react-pdf/renderer toolchain is packaged into this
// isolated function rather than the main Next server handler.
//
// Called as: POST /.netlify/functions/executive-report-pdf
// Body: { email: string, canonical: unknown }

import type { Handler } from "@netlify/functions";
import React from "react";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const email = asString(body?.email);
    const canonical = body?.canonical;

    if (!email) {
      return jsonResponse(400, { ok: false, error: "Email is required." });
    }
    if (!canonical) {
      return jsonResponse(400, {
        ok: false,
        error: "Canonical report payload is required.",
      });
    }

    // --- Entitlements check (lazy import — Prisma chain) ------------------
    const { getExecutiveReportingEntitlements } = await import(
      "../../../lib/server/billing/executive-reporting-entitlements"
    );

    const entitlements = await getExecutiveReportingEntitlements(email);
    if (!entitlements.canExportBoardroomPdf && !entitlements.canViewFullReport) {
      return jsonResponse(403, {
        ok: false,
        error: "Boardroom PDF entitlement not active.",
      });
    }

    // --- PDF render -------------------------------------------------------
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { default: ExecutiveBriefingPdfDocument } = await import(
      "../../../components/reporting/pdf/ExecutiveBriefingPdfDocument"
    );

    const buffer = await renderToBuffer(
      React.createElement(ExecutiveBriefingPdfDocument as any, { canonical }),
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="executive-reporting-boardroom-brief.pdf"',
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("[EXECUTIVE_REPORTING_EXPORT_PDF_ERROR]", error);
    return jsonResponse(500, {
      ok: false,
      error: "Failed to export boardroom PDF.",
    });
  }
};

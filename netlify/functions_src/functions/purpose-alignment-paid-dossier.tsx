/**
 * netlify/functions_src/functions/purpose-alignment-paid-dossier.tsx
 *
 * Generates the PAID PDF dossier for a completed Purpose Alignment assessment.
 * Requires the assessment to have a paid result (PurposeAlignmentPaidResult).
 *
 * Called as: GET /.netlify/functions/purpose-alignment-paid-dossier?assessmentId=<id>&email=<email>
 *
 * Auth: Requires the user to have the personal-decision-audit entitlement.
 * If not entitled, returns 403 with a purchase link.
 */

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
  const email = (event.queryStringParameters?.email || "").trim();

  if (!assessmentId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "assessmentId is required" }),
    };
  }

  try {
    // ── ENTITLEMENT CHECK ───────────────────────────────────────────────
    const { resolveCanonicalEntitlement } = await import(
      "../../../lib/commercial/entitlement-authority"
    );

    const entitlement = await resolveCanonicalEntitlement({
      email: email || null,
      slug: "personal-decision-audit",
    });

    if (!entitlement.granted) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "PURCHASE_REQUIRED",
          message: "This dossier requires the Personal Decision Audit (£49).",
          purchaseLink: "/checkout/personal-decision-audit",
        }),
      };
    }

    // ── LOAD ASSESSMENT ─────────────────────────────────────────────────
    const {
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

    // ── BUILD PAID RESULT ───────────────────────────────────────────────
    const { buildPaidResult } = await import(
      "../../../lib/alignment/purpose-alignment-paid-contract"
    );

    const canonicalResult = assessment.canonicalResult;
    if (!canonicalResult) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Assessment has no canonical result" }),
      };
    }

    // Extract context answers from the stored assessment
    const answers = assessment.answers as Record<string, { resonance: number; certainty: number }>;
    const reflections = (assessment as any).reflections ?? {};

    const paidResult = buildPaidResult({
      freeResult: canonicalResult,
      resultId: assessment.id,
      userEmail: email || null,
      contextAnswers: {
        avoidedDecision: reflections.avoidedDecision || "",
        competingObligation: reflections.competingObligation || "",
        consequence: reflections.consequence || "",
      },
      pdfRequested: true,
      writeMemory: false,
    });

    paidResult.pdfDossier.generated = true;
    paidResult.pdfDossier.generatedAt = new Date().toISOString();

    // ── WATERMARK ───────────────────────────────────────────────────────
    const { buildAlignmentReportWatermark } = await import(
      "../../../lib/alignment/report-watermark"
    );
    const watermark = buildAlignmentReportWatermark(assessment);

    // ── QR CODE ─────────────────────────────────────────────────────────
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
    const QRCode = (await import("qrcode")).default;
    const qrCode = await QRCode.toDataURL(
      `${baseUrl}/decision-centre?case=${assessmentId}`,
      {
        margin: 1,
        scale: 4,
        errorCorrectionLevel: "H",
      },
    );

    // ── RENDER PDF ──────────────────────────────────────────────────────
    const filename = `purpose-alignment-dossier-${assessmentId.slice(0, 8)}.pdf`;

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { default: PurposeAlignmentPaidDossier } = await import(
      "../../../lib/pdf/templates/PurposeAlignmentPaidDossier"
    );

    const buffer = await renderToBuffer(
      React.createElement(PurposeAlignmentPaidDossier as any, {
        result: paidResult,
        watermark,
        qrCode,
      }),
    );

    // ── RECORD DOSSIER GENERATION ───────────────────────────────────────
    try {
      const { createPurposeAlignmentReportRecord } = await import(
        "../../../lib/alignment/repository"
      );
      await createPurposeAlignmentReportRecord({
        assessmentId,
        filename,
      });
    } catch {
      // Non-fatal: record generation failure does not block download
    }

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
    console.error("[PURPOSE_ALIGNMENT_PAID_DOSSIER_ERROR]", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Failed to generate dossier" }),
    };
  }
};

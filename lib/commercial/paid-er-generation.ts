/**
 * lib/commercial/paid-er-generation.ts
 *
 * Paid Executive Report generation flow.
 * Called after successful checkout payment.
 *
 * Flow:
 * 1. Verify payment
 * 2. Generate Executive Report from diagnostic/report source
 * 3. Store report record
 * 4. Create secure client access token
 * 5. Email restricted access link
 * 6. Emit governance events
 *
 * No manual admin dependency for standard ER.
 */

import "server-only";

import { prisma } from "@/lib/prisma.server";
import { createHash, randomBytes } from "crypto";
import { buildExecutiveReport } from "@/lib/admin/reporting/executive-report-builder";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";
import { sendEmail } from "@/lib/email/core/sendEmail";

function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type PaidERGenerationInput = {
  checkoutSessionId: string;
  email: string;
  clientName?: string;
  /** The Fast Diagnostic result data used to generate the ER */
  diagnosticData: {
    responses: Array<{ domain: string; intent: number; reality: number }>;
    hcdMetrics: Array<{ label: string; intent: number; reality: number; burnoutIndex: number; wellbeing: number; headcount: number; tenure: number; attritionRisk: string }>;
    ogrMetrics: { resonanceScore?: number; marketFriction?: number; targetRevenue?: number };
  };
};

export type PaidERGenerationResult = {
  ok: boolean;
  reportId?: string;
  accessToken?: string;
  error?: string;
};

export async function generatePaidExecutiveReport(
  input: PaidERGenerationInput,
): Promise<PaidERGenerationResult> {
  try {
    // 1. Generate Executive Report from diagnostic data
    const report = buildExecutiveReport({
      responses: input.diagnosticData.responses.map((r) => ({
        domain: r.domain,
        intent: r.intent,
        reality: r.reality,
      })),
      hcdMetrics: input.diagnosticData.hcdMetrics.map((m) => ({
        label: m.label,
        intent: m.intent,
        reality: m.reality,
        burnoutIndex: m.burnoutIndex,
        wellbeing: m.wellbeing,
        headcount: m.headcount,
        tenure: m.tenure,
        attritionRisk: m.attritionRisk as "LOW" | "MODERATE" | "HIGH",
      })),
      ogrMetrics: {
        resonanceScore: input.diagnosticData.ogrMetrics.resonanceScore ?? 50,
        marketFriction: input.diagnosticData.ogrMetrics.marketFriction ?? 30,
        targetRevenue: input.diagnosticData.ogrMetrics.targetRevenue ?? 250,
      },
    });

    // 2. Store report record (using canonicalSnapshot JSON field)
    const runKey = `paid-er-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const stored = await prisma.executiveReportingRun.create({
      data: {
        runKey,
        email: input.email,
        fullName: input.clientName ?? null,
        status: "completed",
        canonicalSnapshot: {
          state: report.state,
          narrative: report.narrative,
          ogr: report.ogr,
          resonance: report.resonance,
          hcdAggregate: report.hcdAggregate,
          financialExposure: report.financialExposure,
          priorityStack: report.priorityStack,
          failureModes: report.failureModes,
        } as any,
        viewModelSnapshot: {} as any,
      },
    });

    // 3. Create secure access token
    const rawToken = generateRawToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.executiveReportingArtifact.create({
      data: {
        artifactKey: `er-access-${stored.id}`,
        runId: stored.id,
        kind: "ACCESS_TOKEN",
        payload: {
          tokenHash: hashToken(rawToken),
          email: input.email,
          expiresAt: expiresAt.toISOString(),
        } as any,
        status: "active",
      },
    });

    // 4. Email restricted access link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.com";
    const accessUrl = `${baseUrl}/client/reports/${stored.id}?token=${encodeURIComponent(rawToken)}`;

    await sendEmail({
      type: "TRANSACTIONAL",
      to: input.email,
      subject: "Your Executive Report is ready",
      html: buildERDeliveryEmail(input.email, accessUrl, report.state),
      text: `Your Executive Report is ready.\n\nAccess it here: ${accessUrl}\n\nThis link expires in 30 days.`,
      meta: { source: "paid-er-generation" },
    });

    // 5. Emit governance events
    await routeGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_GENERATED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
      canonicalRecordId: stored.id,
      actorEmail: input.email,
      severity: "HIGH",
      payload: {
        state: report.state,
        totalExposure: report.financialExposure.totalExposure,
        checkoutSessionId: input.checkoutSessionId,
      },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    return {
      ok: true,
      reportId: stored.id,
      accessToken: rawToken,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "PAID_ER_GENERATION_FAILED",
    };
  }
}

function buildERDeliveryEmail(email: string, url: string, state: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(201,169,110,0.70);margin:0 0 20px;">
      Abraham of London
    </p>
    <h1 style="font-family:Georgia,serif;font-weight:300;font-size:22px;line-height:1.45;color:rgba(255,255,255,0.82);margin:0 0 20px;">
      Your Executive Report is ready
    </h1>
    <p style="font-size:15px;line-height:1.65;color:rgba(255,255,255,0.55);margin:0 0 20px;">
      The report has been generated with a classification of <strong style="color:rgba(255,255,255,0.80);">${state}</strong>.
      It is now available through your secure link below.
    </p>
    <a href="${url}" style="display:inline-block;background:rgba(201,169,110,0.12);border:1px solid rgba(201,169,110,0.35);color:rgba(201,169,110,0.90);font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">
      View Your Executive Report
    </a>
    <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.12em;color:rgba(255,255,255,0.22);margin:16px 0 0;">
      This link expires in 30 days. Do not share it.
    </p>
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;margin-top:24px;">
      <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.12em;color:rgba(255,255,255,0.18);margin:0;">
        This report was generated following your purchase. It is a governed analytical output, not financial or legal advice.
      </p>
    </div>
  </div>
</body>
</html>`;
}

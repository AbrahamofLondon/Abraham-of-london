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
import { DecisionActionLog } from "@/lib/commercial/decision-action-log";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type PaidERGenerationInput = {
  checkoutSessionId: string;
  stripeEventId?: string;
  email: string;
  clientName?: string;
  caseRef?: string | null;
  /** The Fast Diagnostic result data used to generate the ER */
  diagnosticData?: {
    responses: Array<{ domain: string; intent: number; reality: number }>;
    hcdMetrics: Array<{ label: string; intent: number; reality: number; burnoutIndex: number; wellbeing: number; headcount: number; tenure: number; attritionRisk: string }>;
    ogrMetrics: { resonanceScore?: number; marketFriction?: number; targetRevenue?: number };
  };
};

export type PaidERGenerationResult = {
  ok: boolean;
  reportId?: string;
  accessToken?: string;
  tokenStatus?: "created" | "existing";
  emailStatus?: "sent" | "failed";
  actionLogCount?: number;
  error?: string;
};

type PaidERDiagnosticData = NonNullable<PaidERGenerationInput["diagnosticData"]>;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function conditionReality(condition: string, target: string, base: number): number {
  if (condition === "authority" && target === "DECISION_AUTHORITY") return 35;
  if (condition === "definition" && target === "STRATEGIC_CLARITY") return 38;
  if (condition === "execution" && target === "EXECUTION_DISCIPLINE") return 42;
  if (condition === "instability" && target === "OPERATING_STABILITY") return 34;
  return base;
}

function diagnosticDataFromSpine(spine: IntelligenceSpine | null): PaidERDiagnosticData {
  const condition = spine?.deterministic?.conditionClass ?? "authority";
  const specificity = clamp(asNumber(spine?.c3?.specificityScore, 0.62), 0, 1);
  const pressure = Math.round(45 + specificity * 35);
  const baseReality = Math.round(78 - specificity * 28);
  const exposureText = spine?.case?.costOfDelay ?? "";
  const exposureNumber = Number(String(exposureText).replace(/[^0-9.]/g, "")) || 250;

  const domains = [
    "DECISION_AUTHORITY",
    "STRATEGIC_CLARITY",
    "EXECUTION_DISCIPLINE",
    "OPERATING_STABILITY",
  ];

  return {
    responses: domains.map((domain) => ({
      domain,
      intent: 88,
      reality: conditionReality(condition, domain, baseReality),
    })),
    hcdMetrics: [
      {
        label: "LEADERSHIP_LOAD",
        intent: 90,
        reality: clamp(100 - pressure, 15, 85),
        burnoutIndex: pressure,
        wellbeing: clamp(92 - pressure, 20, 80),
        headcount: 5,
        tenure: 24,
        attritionRisk: pressure >= 72 ? "HIGH" : pressure >= 58 ? "MODERATE" : "LOW",
      },
      {
        label: "EXECUTION_CAPACITY",
        intent: 86,
        reality: clamp(baseReality, 25, 82),
        burnoutIndex: clamp(pressure - 8, 25, 82),
        wellbeing: clamp(96 - pressure, 20, 82),
        headcount: 8,
        tenure: 18,
        attritionRisk: pressure >= 75 ? "HIGH" : "MODERATE",
      },
    ],
    ogrMetrics: {
      resonanceScore: clamp(baseReality, 20, 82),
      marketFriction: clamp(pressure, 20, 88),
      targetRevenue: exposureNumber,
    },
  };
}

async function loadSpineForPaidER(input: Pick<PaidERGenerationInput, "caseRef" | "email">): Promise<IntelligenceSpine | null> {
  const caseRef = input.caseRef?.trim();
  const where = caseRef
    ? { journeyKey: `spine_${caseRef}` }
    : {
        email: input.email,
        diagnosticType: "intelligence_spine",
        status: "active",
      };

  const row = await prisma.diagnosticJourney.findFirst({
    where,
    orderBy: { updatedAt: "desc" },
    select: { mergedTensionThread: true },
  });

  const spine = asRecord(row?.mergedTensionThread) as unknown as IntelligenceSpine;
  return spine?.id && spine?.case ? spine : null;
}

export async function generatePaidExecutiveReport(
  input: PaidERGenerationInput,
): Promise<PaidERGenerationResult> {
  try {
    const runKey = `paid-er-${input.checkoutSessionId}`;
    const existing = await prisma.executiveReportingRun.findUnique({
      where: { runKey },
      include: { artifacts: { where: { kind: "ACCESS_TOKEN", status: "active" }, take: 1 } },
    });
    if (existing) {
      const actionLogCount = await prisma.decisionActionLog.count({
        where: { reportId: existing.id, clientEmail: input.email },
      });
      return {
        ok: true,
        reportId: existing.id,
        tokenStatus: existing.artifacts.length > 0 ? "existing" : "created",
        emailStatus: "sent",
        actionLogCount,
      };
    }

    const spine = await loadSpineForPaidER(input);
    const diagnosticData = input.diagnosticData ?? diagnosticDataFromSpine(spine);

    // 1. Generate Executive Report from diagnostic data
    const report = buildExecutiveReport({
      responses: diagnosticData.responses.map((r) => ({
        domain: r.domain,
        intent: r.intent,
        reality: r.reality,
      })),
      hcdMetrics: diagnosticData.hcdMetrics.map((m) => ({
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
        resonanceScore: diagnosticData.ogrMetrics.resonanceScore ?? 50,
        marketFriction: diagnosticData.ogrMetrics.marketFriction ?? 30,
        targetRevenue: diagnosticData.ogrMetrics.targetRevenue ?? 250,
      },
    });

    // 2. Store report record (using canonicalSnapshot JSON field)
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
          source: {
            checkoutSessionId: input.checkoutSessionId,
            stripeEventId: input.stripeEventId ?? null,
            caseRef: input.caseRef ?? null,
            spineId: spine?.id ?? null,
          },
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

    const emailResult = await sendEmail({
      type: "TRANSACTIONAL",
      to: input.email,
      subject: "Your Executive Report is ready",
      html: buildERDeliveryEmail(input.email, accessUrl, report.state),
      text: `Your Executive Report is ready.\n\nAccess it here: ${accessUrl}\n\nThis link expires in 30 days.`,
      meta: { source: "paid-er-generation" },
    });

    const actionItems = await DecisionActionLog.createFromReport(stored.id, input.email, {
      failureModes: report.failureModes,
      priorityStack: report.priorityStack,
      state: report.state,
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

    await routeGovernanceEvent({
      eventType: "EXECUTIVE_REPORT_DELIVERED",
      sourceSurface: "executive-reporting",
      canonicalRecordType: "ExecutiveReport",
      canonicalRecordId: stored.id,
      actorEmail: input.email,
      severity: emailResult.ok ? "MEDIUM" : "HIGH",
      payload: {
        checkoutSessionId: input.checkoutSessionId,
        deliveryMethod: "email",
        emailStatus: emailResult.ok ? "sent" : "failed",
        emailId: emailResult.id ?? null,
        tokenStatus: "created",
        expiresAt: expiresAt.toISOString(),
      },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    return {
      ok: true,
      reportId: stored.id,
      accessToken: rawToken,
      tokenStatus: "created",
      emailStatus: emailResult.ok ? "sent" : "failed",
      actionLogCount: actionItems.length,
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

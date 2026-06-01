/* ============================================================================
   FILE: pages/api/diagnostics/constitutional-intake/report.ts
   PURPOSE:
   - Accept constitutional intake answers
   - Run the fragmented constitutional engine
   - Persist internal output while returning a minimized client payload
============================================================================ */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { type DiagnosticAnswers } from "@/lib/diagnostics/constitutional-diagnostic-derivation";
import { getDiagnosticJourney, persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import { runConstitutionalOrchestration } from "@/lib/engine/orchestrator";
import type { UpstreamEvidenceContext } from "@/lib/diagnostics/constitutional-evidence-bridge";
import { assessReplicationRisk } from "@/lib/security/replication-detection";
import { createEncryptedStateToken } from "@/lib/security/secure-client-state";
import { toPublicResult, type PublicConstitutionalResult } from "@/lib/diagnostics/public-constitutional-result";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";

type ApiSuccess = {
  ok: true;
  reportId: string;
  stateToken: string;
  result: PublicConstitutionalResult;
};

type ApiFailure = {
  ok: false;
  error: string;
  details?: unknown;
};

const requestSchema = z
  .object({
    source: z.string().trim().min(1).max(120).optional(),
    sessionKey: z.string().trim().min(1).max(160).optional(),
    respondentKey: z.string().trim().min(1).max(160).optional(),
    operatorKey: z.string().trim().min(1).max(160).optional(),
    email: z.string().trim().email().max(320).optional(),
    organisation: z.string().trim().max(240).optional(),
    campaignId: z.string().trim().max(160).optional(),
    answers: z.record(z.any()),
    telemetry: z
      .object({
        startedAt: z.string().datetime().optional(),
        submittedAt: z.string().datetime().optional(),
        clientSessionId: z.string().trim().max(160).optional(),
        questionTimingsMs: z.record(z.number().int().min(0).max(300000)).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isLikertValue(value: unknown): value is 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10;
}

function parseAnswers(raw: unknown): DiagnosticAnswers {
  const input = asRecord(raw);
  const answers: DiagnosticAnswers = {};

  for (const [key, value] of Object.entries(input)) {
    const rec = asRecord(value);
    if (!isLikertValue(rec.resonance) || !isLikertValue(rec.certainty)) continue;

    answers[key] = {
      resonance: rec.resonance,
      certainty: rec.certainty,
    };
  }

  return answers;
}

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];

  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).trim();
  }

  if (typeof forwarded === "string" && forwarded.trim()) {
    return String(forwarded.split(",")[0] || "").trim();
  }

  return String(req.socket?.remoteAddress || "").trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess | ApiFailure>,
) {
  if (String(process.env.SECURITY_LOCKDOWN_MODE || "").toLowerCase() === "true" ||
      String(process.env.DISABLE_DIAGNOSTIC_SCORING || "").toLowerCase() === "true") {
    return res.status(503).json({ ok: false, error: "DIAGNOSTIC_SCORING_DISABLED" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    const contentType = String(req.headers["content-type"] || "");
    if (!/application\/json/i.test(contentType)) {
      return res.status(415).json({ ok: false, error: "UNSUPPORTED_MEDIA_TYPE" });
    }

    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "INVALID_REQUEST",
        details: parsed.error.flatten(),
      });
    }

    const body = parsed.data;
    const rateLimit = await consumePersistentRateLimit({
      key: [
        "constitutional-intake-report",
        getClientIp(req) || "0.0.0.0",
        body.sessionKey ?? "",
        body.email?.trim().toLowerCase() ?? "",
      ].filter(Boolean).join(":"),
      limit: 12,
      windowMs: 30 * 60_000,
      failClosed: true,
    });
    if (!rateLimit.allowed) {
      return res.status(429).json({ ok: false, error: "RATE_LIMIT_EXCEEDED" });
    }

    const answers = parseAnswers(body.answers);
    const campaignId = body.campaignId ?? null;

    if (Object.keys(answers).length < 4) {
      return res.status(400).json({
        ok: false,
        error:
          "At least 4 answered items are required before a constitutional report can be derived.",
      });
    }

    const clientIp = getClientIp(req) || null;
    const userAgent =
      typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null;

    const operatorKey =
      body.operatorKey ||
      body.respondentKey ||
      body.sessionKey ||
      "constitutional_diagnostic_public";

    const replication = assessReplicationRisk({
      ip: clientIp,
      sessionKey: body.sessionKey ?? null,
      operatorKey,
      userAgent,
      answeredCount: Object.keys(answers).length,
    });

    if (replication.throttleSuggested) {
      return res.status(429).json({
        ok: false,
        error: "REQUEST_THROTTLED",
      });
    }

    let upstream: UpstreamEvidenceContext | null = null;
    try {
      const journey = await getDiagnosticJourney({
        email: body.email?.toLowerCase() ?? null,
        subjectId: body.sessionKey ?? body.respondentKey ?? null,
        campaignId: body.campaignId ?? null,
      });
      const latestDecision = journey.decisionObjects?.[journey.decisionObjects.length - 1];
      if (latestDecision) {
        upstream = {
          priorAttemptText: latestDecision.priorAttemptText ?? null,
          costOfDelayText: latestDecision.costOfDelayText ?? null,
          avoidedDecision: latestDecision.decisionText ?? null,
          patternRecurrenceCount: null,
          resolvedPatternReappeared: false,
        };
      }
    } catch { /* degrade gracefully — upstream context is additive */ }

    const result = runConstitutionalOrchestration({
      answers,
      upstream,
      context: {
        sessionContext: [
          body.sessionKey,
          operatorKey,
          clientIp,
          userAgent,
        ]
          .filter(Boolean)
          .join(":"),
        operatorKey,
        source: body.source ?? "constitutional_diagnostic_public",
        ipAddress: clientIp,
        userAgent,
        responseDetail: replication.responseDetail,
      },
      telemetry: {
        ...body.telemetry,
        submittedAt: new Date().toISOString(),
      },
    });

    const created = await prisma.constitutionalIntakeReport.create({
      data: {
        source: body.source ?? "constitutional_diagnostic_public",
        sessionKey: body.sessionKey ?? null,
        respondentKey: body.respondentKey ?? null,
        email: body.email?.toLowerCase() ?? null,
        organisation: body.organisation ?? null,
        ipAddress: clientIp,
        userAgent,

        answersJson: JSON.stringify(answers),
        reportJson: JSON.stringify(result.bundle.report),
        constitutionalInputJson: JSON.stringify(result.bundle.constitutionalInput),
        decisionJson: JSON.stringify(result.internal.decision),
        routeSummaryJson: JSON.stringify(result.bundle.routeSummary),
        bridgeJson: JSON.stringify(result.bridge),

        route: result.bundle.decision.route,
        confidence: result.bundle.decision.confidence,
        posture: result.bundle.report.posture,
        readinessTier: result.bundle.report.readinessTier,
        authorityType: result.bundle.report.authorityType,
        seriousnessScore: result.bundle.report.seriousnessScore,
        completionPercent: result.bundle.report.completionPercent,
        ...(campaignId
          ? {
              campaign: {
                connect: {
                  id: campaignId,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    await persistDiagnosticStage({
      email: body.email?.toLowerCase() ?? null,
      campaignId,
      organisation: body.organisation ?? null,
      stage: "constitutional",
      payload: {
        report: result.bundle.report,
        decision: result.bundle.decision,
        bridge: result.bridge,
        evidenceBridge: result.evidenceBridge ?? null,
      },
      tensions: result.bundle.decision.disqualifiersTriggered,
      routeDecision: result.bundle.decision,
      snapshot: {
        timestamp: new Date().toISOString(),
        stage: "constitutional",
        coreMetrics: {
          confidence: Number(result.bundle.decision.confidence || 0),
          seriousnessScore: Number(result.bundle.report.seriousnessScore || 0),
        },
        tensions: result.bundle.decision.disqualifiersTriggered,
        escalationLevel: result.bundle.decision.route === "STRATEGY" ? 3 : 1,
        directive: result.bundle.decision.route || null,
      },
    });

    // ── Persist journey events ────────────────────────────────────────
    try {
      const { runDecisionIntelligence } = await import('@/lib/intelligence/decision-intelligence-orchestrator')
      await runDecisionIntelligence({
        surface: 'constitutional_diagnostic',
        userAnswers: answers,
        diagnosticResult: {
          report: result.bundle.report,
          decision: result.bundle.decision,
          routeSummary: result.bundle.routeSummary,
        },
        persistJourney: true,
        caseId: created.id,
        email: body.email ?? undefined,
      })
    } catch {
      // Journey persistence is non-blocking
    }

    const stateToken = createEncryptedStateToken({
      kind: "constitutional_handoff",
      reportId: created.id,
      issuedAt: new Date().toISOString(),
      version: 1,
    });

    return res.status(200).json({
      ok: true,
      reportId: created.id,
      stateToken,
      result: toPublicResult(result.bundle.report),
    });
  } catch (error) {
    console.error("[CONSTITUTIONAL_INTAKE_REPORT_API_ERROR]", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to derive and persist constitutional intake report.",
      details:
        error instanceof Error
          ? { message: error.message }
          : "Unknown internal error",
    });
  }
}

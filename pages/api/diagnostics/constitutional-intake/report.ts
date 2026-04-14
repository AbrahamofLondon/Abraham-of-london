/* ============================================================================
   FILE: pages/api/diagnostics/constitutional-intake/report.ts
   PURPOSE:
   - Accept constitutional intake answers
   - Derive micro-report + constitutional decision + downstream bridge
   - Persist everything in ConstitutionalIntakeReport
============================================================================ */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import {
  deriveConstitutionalDiagnosticBundle,
  type DiagnosticAnswers,
} from "@/lib/constitution/constitutional-diagnostic-derivation";
import { buildConstitutionalBridgeBundle } from "@/lib/diagnostics/constitutional-bridge";

type ApiSuccess = {
  ok: true;
  reportId: string;
  bundle: ReturnType<typeof deriveConstitutionalDiagnosticBundle>;
  bridge: ReturnType<typeof buildConstitutionalBridgeBundle>;
};

type ApiFailure = {
  ok: false;
  error: string;
  details?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    const body = asRecord(req.body);
    const answers = parseAnswers(body.answers);
    const campaignId = asString(body.campaignId) || null;

    if (Object.keys(answers).length < 4) {
      return res.status(400).json({
        ok: false,
        error:
          "At least 4 answered items are required before a constitutional report can be derived.",
      });
    }

    const operatorKey =
      asString(body.operatorKey) ||
      asString(body.respondentKey) ||
      asString(body.sessionKey) ||
      "constitutional_diagnostic_public";

    const bundle = deriveConstitutionalDiagnosticBundle(answers, {
      operatorKey,
      operatorOverrideRequested: false,
    });

    const bridge = buildConstitutionalBridgeBundle(bundle);

    const created = await prisma.constitutionalIntakeReport.create({
      data: {
        source: asString(body.source, "constitutional_diagnostic_public"),
        sessionKey: asString(body.sessionKey) || null,
        respondentKey: asString(body.respondentKey) || null,
        email: asString(body.email).toLowerCase() || null,
        organisation: asString(body.organisation) || null,
        ipAddress: getClientIp(req) || null,
        userAgent: asString(req.headers["user-agent"]) || null,

        answersJson: JSON.stringify(answers),
        reportJson: JSON.stringify(bundle.report),
        constitutionalInputJson: JSON.stringify(bundle.constitutionalInput),
        decisionJson: JSON.stringify(bundle.decision),
        routeSummaryJson: JSON.stringify(bundle.routeSummary),
        bridgeJson: JSON.stringify(bridge),

        route: bundle.decision.route,
        confidence: bundle.decision.confidence,
        posture: bundle.report.posture,
        readinessTier: bundle.report.readinessTier,
        authorityType: bundle.report.authorityType,
        seriousnessScore: bundle.report.seriousnessScore,
        completionPercent: bundle.report.completionPercent,
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

    return res.status(200).json({
      ok: true,
      reportId: created.id,
      bundle,
      bridge,
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

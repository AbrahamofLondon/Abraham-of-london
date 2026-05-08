import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPurposeAlignmentAssessmentById } from "@/lib/alignment/repository";
import { upsertReminderPreference } from "@/lib/alignment/reminders";
import { getOrCreatePurposeAlignmentSessionKey } from "@/lib/alignment/session";
import { createDecisionMemory } from "@/lib/server/decision-memory/memory-service.server";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import {
  enforceAppRouteRateLimit,
  failClosedForFlag,
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
  requireSameOrigin,
} from "@/lib/server/security/app-route-guards";

const schema = z.object({
  assessmentId: z.string().trim().min(1).max(128),
  email: z.string().email().optional().or(z.literal("")),
  cadenceDays: z.number().int().min(7).max(90).optional(),
  isEnabled: z.boolean().optional(),
}).strict();

export async function POST(req: NextRequest) {
  const methodCheck = requireMethod(req, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(req);
  if (!contentCheck.ok) return contentCheck.response;

  const sameOrigin = requireSameOrigin(req, "/api/purpose-alignment/capture");
  if (!sameOrigin.ok) return sameOrigin.response;

  try {
    const lockdown = failClosedForFlag({
      flag: "SECURITY_LOCKDOWN_MODE",
      action: "email_capture",
      route: "/api/purpose-alignment/capture",
      publicMessage: "CAPTURE_TEMPORARILY_DISABLED",
    });
    if (!lockdown.ok) return lockdown.response;

    const parsed = await parseJsonBody(req, schema);
    if (!parsed.ok) return parsed.response;

    const rateLimit = await enforceAppRouteRateLimit({
      request: req,
      routeKey: "purpose-alignment-capture",
      limit: 10,
      windowMs: 60 * 60_000,
      email: parsed.data.email || null,
      failClosed: true,
    });
    if (!rateLimit.ok) return rateLimit.response;

    const sessionKey = await getOrCreatePurposeAlignmentSessionKey();
    const assessment = await getPurposeAlignmentAssessmentById(parsed.data.assessmentId);

    if (!assessment) {
      return noStoreJson({ ok: false, error: "Assessment not found" }, { status: 404 });
    }

    const canonical = assessment.canonicalResult;
    if (!canonical) {
      return noStoreJson({ ok: false, error: "Assessment result unavailable" }, { status: 400 });
    }

    // ── DECISION MEMORY (existing) ──
    await createDecisionMemory({
      sessionId: sessionKey,
      source: "purpose_alignment",
      state: canonical.primaryPattern?.label ?? canonical.coherenceBand,
      headline: canonical.reportNarrative?.conditionStatement ?? canonical.narrative,
      summary: canonical.reportNarrative?.classificationExplanation ?? canonical.primaryPattern?.consequence ?? canonical.narrative,
      directive: canonical.firstAction ?? canonical.corrections[0] ?? "Commit to the first structural correction.",
      recommendations: canonical.corrections,
      publicSignals: {
        coherenceBand: canonical.coherenceBand,
        primaryPattern: canonical.primaryPattern?.label ?? null,
        weakestDomains: canonical.weakestDomains,
      },
      escalationLabel: canonical.routingRecommendation?.label,
      escalationLevel: canonical.severity,
    });

    // ── JOURNEY STORE PERSISTENCE (new) ──
    // Persist the full PA evidence so downstream surfaces (Executive Reporting,
    // Strategy Room, Return Brief, Decision Centre, Oversight Brief) can load it.
    await persistDiagnosticStage({
      subjectId: sessionKey,
      email: parsed.data.email || undefined,
      stage: "purpose_alignment",
      payload: {
        sourceSurface: "PURPOSE_ALIGNMENT",
        schemaVersion: assessment.reportVersion,
        scoringVersion: assessment.reportVersion,
        userId: assessment.userId ?? null,
        sessionKey: assessment.sessionKey ?? null,
        createdAt: assessment.createdAt,
        context: {
          decision: canonical.reportNarrative?.conditionStatement ?? canonical.narrative,
          competingObligation: null, // Not stored in capture; enrich from assessment answers
          consequence: canonical.primaryPattern?.consequence ?? null,
          institutionalConsequence: canonical.routingRecommendation?.label ?? null,
        },
        rawResponses: canonical.rawResponses ?? null,
        domainScores: canonical.domainProfiles ?? [],
        compositeScore: canonical.percent,
        profile: canonical.coherenceBand,
        strongestDomain: canonical.domainProfiles?.length
          ? [...canonical.domainProfiles].sort((a, b) => b.percent - a.percent)[0]?.domain ?? null
          : null,
        weakestDomain: canonical.weakestDomains[0] ?? null,
        contradictions: canonical.contradictions ?? [],
        patternScores: canonical.patternScores ?? [],
        primaryPattern: canonical.primaryPattern ?? null,
        resultSummary: {
          narrative: canonical.narrative,
          conditionStatement: canonical.reportNarrative?.conditionStatement ?? null,
          classificationExplanation: canonical.reportNarrative?.classificationExplanation ?? null,
          consequenceBlock: canonical.reportNarrative?.consequenceBlock ?? null,
          firstActionBlock: canonical.reportNarrative?.firstActionBlock ?? null,
        },
        assessmentId: parsed.data.assessmentId,
      },
      snapshot: {
        timestamp: new Date().toISOString(),
        stage: "purpose_alignment",
        coreMetrics: {
          percent: canonical.percent,
          coherenceBand: canonical.coherenceBand === "SOVEREIGN" ? 4
            : canonical.coherenceBand === "ALIGNED" ? 3
            : canonical.coherenceBand === "DRIFTING" ? 2 : 1,
        },
        tensions: canonical.contradictions?.map((c) => c.evidence) ?? [],
        escalationLevel: canonical.severity === "critical" ? 3
          : canonical.severity === "high" ? 2
          : canonical.severity === "medium" ? 1 : 0,
        directive: canonical.firstAction ?? canonical.corrections[0] ?? null,
      },
    });

    let reminderPreference = null;
    if (parsed.data.isEnabled || parsed.data.email) {
      reminderPreference = await upsertReminderPreference({
        sessionKey,
        isEnabled: parsed.data.isEnabled ?? Boolean(parsed.data.email),
        email: parsed.data.email || null,
        cadenceDays: parsed.data.cadenceDays ?? 14,
      });
    }

    return noStoreJson({
      ok: true,
      reminderPreference,
    });
  } catch {
    return noStoreJson(
      {
        ok: false,
        error: "Invalid request",
      },
      { status: 400 },
    );
  }
}

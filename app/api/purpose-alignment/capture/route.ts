import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPurposeAlignmentAssessmentById } from "@/lib/alignment/repository";
import { upsertReminderPreference } from "@/lib/alignment/reminders";
import { getOrCreatePurposeAlignmentSessionKey } from "@/lib/alignment/session";
import { createDecisionMemory } from "@/lib/server/decision-memory/memory-service.server";
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

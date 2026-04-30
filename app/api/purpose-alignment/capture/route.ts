import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPurposeAlignmentAssessmentById } from "@/lib/alignment/repository";
import { upsertReminderPreference } from "@/lib/alignment/reminders";
import { getOrCreatePurposeAlignmentSessionKey } from "@/lib/alignment/session";
import { createDecisionMemory } from "@/lib/server/decision-memory/memory-service.server";

const schema = z.object({
  assessmentId: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  cadenceDays: z.number().int().min(7).max(90).optional(),
  isEnabled: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = schema.parse(json);
    const sessionKey = await getOrCreatePurposeAlignmentSessionKey();
    const assessment = await getPurposeAlignmentAssessmentById(parsed.assessmentId);

    if (!assessment) {
      return NextResponse.json({ ok: false, error: "Assessment not found" }, { status: 404 });
    }

    const canonical = assessment.canonicalResult;
    if (!canonical) {
      return NextResponse.json({ ok: false, error: "Assessment result unavailable" }, { status: 400 });
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
    if (parsed.isEnabled || parsed.email) {
      reminderPreference = await upsertReminderPreference({
        sessionKey,
        isEnabled: parsed.isEnabled ?? Boolean(parsed.email),
        email: parsed.email || null,
        cadenceDays: parsed.cadenceDays ?? 14,
      });
    }

    return NextResponse.json({
      ok: true,
      reminderPreference,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid request",
      },
      { status: 400 },
    );
  }
}

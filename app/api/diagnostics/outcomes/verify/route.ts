export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { normalizeOutcomeSnapshot, type OutcomeSnapshot } from "@/lib/outcomes/outcome-model";
import { verifyAndPersistOutcome } from "@/lib/outcomes/outcome-verification";

function asSnapshot(value: unknown, fallbackId: string): OutcomeSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<OutcomeSnapshot>;
  if (!raw.baseline || !raw.followUp) return null;
  return normalizeOutcomeSnapshot({
    id: typeof raw.id === "string" ? raw.id : fallbackId,
    sessionId: typeof raw.sessionId === "string" ? raw.sessionId : fallbackId,
    organisation: raw.organisation,
    baseline: raw.baseline,
    followUp: raw.followUp,
    timeToOutcomeDays: typeof raw.timeToOutcomeDays === "number" ? raw.timeToOutcomeDays : 0,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const baseline = asSnapshot(body.baseline, "baseline");
    const followUp = asSnapshot(body.followUp, "follow_up");
    if (!baseline || !followUp) {
      return NextResponse.json(
        { ok: false, error: "baseline and followUp outcome snapshots are required" },
        { status: 400 },
      );
    }

    const result = await verifyAndPersistOutcome({
      baseline,
      followUp,
      baselineJourneyId: typeof body.baselineJourneyId === "string" ? body.baselineJourneyId : null,
      followUpJourneyId: typeof body.followUpJourneyId === "string" ? body.followUpJourneyId : null,
      decisionObjectId: typeof body.decisionObjectId === "string" ? body.decisionObjectId : null,
      interventionPath: Array.isArray(body.interventionPath) ? body.interventionPath.map(String) : [],
      unresolvedContradictions: Array.isArray(body.unresolvedContradictions)
        ? body.unresolvedContradictions.map(String).filter(Boolean)
        : [],
      organisationKey: typeof body.organisationKey === "string" ? body.organisationKey : null,
      persist: body.persist !== false,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to verify outcome",
      },
      { status: 400 },
    );
  }
}

export const dynamic = "force-dynamic";
// app/api/strategy-room/session/followup/route.ts

import { NextResponse } from "next/server";
import { normalizeCanonicalSectionsSnapshot } from "@/lib/strategy-room/canonical-snapshot";
import {
  createStrategyRoomFollowup,
  markStrategyRoomFollowup,
} from "@/lib/strategy-room/persistence";
import {
  createDecisionOutcomeLink,
  normalizeOutcomeSnapshot,
  type OutcomeSnapshot,
} from "@/lib/outcomes/outcome-model";
import { recordOutcomeSnapshot } from "@/lib/outcomes/evidence";
import { randomUUID } from "crypto";

function toJsonString(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  return typeof value === "string" ? value : JSON.stringify(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function n(value: unknown, fallback = Number.NaN): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildOutcomeSnapshotFromBody(
  body: Record<string, unknown>,
  sessionKey: string,
): OutcomeSnapshot | null {
  const supplied = asRecord(body.outcomeSnapshot);
  const baseline = asRecord(supplied.baseline ?? body.baseline);
  const followUp = asRecord(supplied.followUp ?? body.followUp);

  if (!Object.keys(baseline).length || !Object.keys(followUp).length) {
    return null;
  }

  return normalizeOutcomeSnapshot({
    id: s(supplied.id, `out_${randomUUID().replace(/-/g, "")}`),
    sessionId: s(supplied.sessionId, sessionKey),
    organisation: s(supplied.organisation ?? body.organisation) || undefined,
    baseline: {
      dissonance: n(baseline.dissonance),
      burnoutIndex: n(baseline.burnoutIndex),
      sovereignCertainty: n(baseline.sovereignCertainty),
      escalationLevel: s(baseline.escalationLevel),
    },
    followUp: {
      dissonance: n(followUp.dissonance),
      burnoutIndex: n(followUp.burnoutIndex),
      sovereignCertainty: n(followUp.sovereignCertainty),
      escalationLevel: s(followUp.escalationLevel),
    },
    timeToOutcomeDays: n(supplied.timeToOutcomeDays ?? body.timeToOutcomeDays),
    createdAt: supplied.createdAt ? new Date(String(supplied.createdAt)) : new Date(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sessionKey = String(body?.sessionKey || "").trim();
    if (!sessionKey) {
      return NextResponse.json(
        { ok: false, error: "sessionKey is required." },
        { status: 400 }
      );
    }

    const canonicalSnapshot = normalizeCanonicalSectionsSnapshot({
      envelope:
        body?.canonicalSnapshot?.sections ? body.canonicalSnapshot : undefined,
      sections:
        body?.canonicalSnapshot?.constitutionalPosture
          ? body.canonicalSnapshot
          : undefined,
      source: "followup",
      sessionKey,
    });

    const persistedCanonicalSnapshot = toJsonString(canonicalSnapshot);

    const outcomeSnapshot = buildOutcomeSnapshotFromBody(body, sessionKey);
    const recordedOutcome = outcomeSnapshot
      ? recordOutcomeSnapshot(outcomeSnapshot)
      : null;
    const decisionOutcomeLink = createDecisionOutcomeLink({
      decisionId: String(body?.decisionId || sessionKey),
      interventionStack: Array.isArray(body?.interventionStack)
        ? body.interventionStack
        : Array.isArray(body?.metadata?.interventionStack)
          ? body.metadata.interventionStack
          : [],
      outcomeSnapshotId: recordedOutcome?.id,
    });

    const metadata = {
      ...asRecord(body?.metadata || {}),
      decisionOutcomeLink,
      outcomeSnapshot: recordedOutcome,
      outcomeClassification: recordedOutcome?.outcomeClassification ?? null,
    };

    await createStrategyRoomFollowup({
      sessionKey,
      routeAfter: String(body?.routeAfter || ""),
      readinessTierAfter: String(body?.readinessTierAfter || ""),
      authorityTypeAfter: String(body?.authorityTypeAfter || ""),
      clarityDelta: Number(body?.clarityDelta || 0),
      authorityDelta: Number(body?.authorityDelta || 0),
      convertedAfterGuidance: Boolean(body?.convertedAfterGuidance),
      metadata: toJsonString(metadata),
      canonicalSnapshot: persistedCanonicalSnapshot,
    });

    await markStrategyRoomFollowup(sessionKey, persistedCanonicalSnapshot);

    return NextResponse.json({
      ok: true,
      decisionOutcomeLink,
      outcome: recordedOutcome,
    });
  } catch (error) {
    console.error("[STRATEGY_ROOM_FOLLOWUP_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to capture follow-up event." },
      { status: 500 }
    );
  }
}

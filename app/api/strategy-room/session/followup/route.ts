export const dynamic = "force-dynamic";
// app/api/strategy-room/session/followup/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
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
import {
  enforceAppRouteRateLimit,
  failClosedForFlag,
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
  requireSameOrigin,
} from "@/lib/server/security/app-route-guards";
import { assertStrategyRoomAccess } from "@/lib/server/strategy-room/access.server";

const followupSchema = z.object({
  sessionKey: z.string().trim().min(12).max(128),
  routeAfter: z.string().trim().max(80).optional(),
  readinessTierAfter: z.string().trim().max(80).optional(),
  authorityTypeAfter: z.string().trim().max(80).optional(),
  clarityDelta: z.number().min(-100).max(100).optional(),
  authorityDelta: z.number().min(-100).max(100).optional(),
  convertedAfterGuidance: z.boolean().optional(),
  decisionId: z.string().trim().max(128).optional(),
  interventionStack: z.array(z.unknown()).max(32).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  canonicalSnapshot: z.unknown().optional(),
  outcomeSnapshot: z.unknown().optional(),
  baseline: z.unknown().optional(),
  followUp: z.unknown().optional(),
  organisation: z.string().trim().max(240).optional(),
  timeToOutcomeDays: z.number().min(0).max(3650).optional(),
}).strict();

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
  const methodCheck = requireMethod(request, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(request);
  if (!contentCheck.ok) return contentCheck.response;

  const sameOrigin = requireSameOrigin(request, "/api/strategy-room/session/followup");
  if (!sameOrigin.ok) return sameOrigin.response;

  try {
    const lockdown = failClosedForFlag({
      flag: "DISABLE_STRATEGY_ROOM_ENTRY",
      action: "strategy_room_access_denied",
      route: "/api/strategy-room/session/followup",
      publicMessage: "STRATEGY_ROOM_TEMPORARILY_DISABLED",
    });
    if (!lockdown.ok) return lockdown.response;

    const parsed = await parseJsonBody(request, followupSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const rawBody = body as unknown as Record<string, unknown>;

    const rateLimit = await enforceAppRouteRateLimit({
      request,
      routeKey: "strategy-room-followup",
      limit: 15,
      windowMs: 15 * 60_000,
      sessionId: body.sessionKey,
      failClosed: true,
    });
    if (!rateLimit.ok) return rateLimit.response;

    const sessionKey = String(body?.sessionKey || "").trim();
    if (!sessionKey) {
      return noStoreJson(
        { ok: false, error: "sessionKey is required." },
        { status: 400 }
      );
    }

    const access = await assertStrategyRoomAccess({
      request,
      sessionRef: sessionKey,
      purpose: "strategy_room_access",
      allowTokenPurposes: ["strategy_room_access", "return_brief"],
      requireEntitlement: false,
    });
    if (!access.ok) {
      return noStoreJson({ ok: false, error: access.error }, { status: access.status });
    }

    const canonicalSnapshot = normalizeCanonicalSectionsSnapshot({
      envelope:
        asRecord(rawBody?.canonicalSnapshot)?.sections ? rawBody.canonicalSnapshot as any : undefined,
      sections:
        asRecord(rawBody?.canonicalSnapshot)?.constitutionalPosture
          ? rawBody.canonicalSnapshot as any
          : undefined,
      source: "followup",
      sessionKey,
    });

    const persistedCanonicalSnapshot = toJsonString(canonicalSnapshot);

    const outcomeSnapshot = buildOutcomeSnapshotFromBody(rawBody, sessionKey);
    const recordedOutcome = outcomeSnapshot
      ? await recordOutcomeSnapshot(outcomeSnapshot)
      : null;
    const decisionOutcomeLink = createDecisionOutcomeLink({
      decisionId: String(rawBody?.decisionId || sessionKey),
      interventionStack: Array.isArray(rawBody?.interventionStack)
        ? rawBody.interventionStack
        : Array.isArray(asRecord(rawBody?.metadata)?.interventionStack)
          ? asRecord(rawBody?.metadata)?.interventionStack as unknown[]
          : [],
      outcomeSnapshotId: recordedOutcome?.id,
    });

    const metadata = {
      ...asRecord(rawBody?.metadata || {}),
      decisionOutcomeLink,
      outcomeSnapshot: recordedOutcome,
      outcomeClassification: recordedOutcome?.outcomeClassification ?? null,
    };

    await createStrategyRoomFollowup({
      sessionKey,
      routeAfter: String(rawBody?.routeAfter || ""),
      readinessTierAfter: String(rawBody?.readinessTierAfter || ""),
      authorityTypeAfter: String(rawBody?.authorityTypeAfter || ""),
      clarityDelta: Number(rawBody?.clarityDelta || 0),
      authorityDelta: Number(rawBody?.authorityDelta || 0),
      convertedAfterGuidance: Boolean(rawBody?.convertedAfterGuidance),
      metadata: toJsonString(metadata),
      canonicalSnapshot: persistedCanonicalSnapshot,
    });

    await markStrategyRoomFollowup(sessionKey, persistedCanonicalSnapshot);

    return noStoreJson({
      ok: true,
      decisionOutcomeLink,
      outcome: recordedOutcome,
    });
  } catch {
    return noStoreJson(
      { ok: false, error: "Failed to capture follow-up event." },
      { status: 500 }
    );
  }
}

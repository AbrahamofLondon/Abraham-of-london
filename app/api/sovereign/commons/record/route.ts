export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { recordCommonsEntry } from "@/lib/sovereign/intelligence-commons";
import { detectIntelligenceSignals, type SignalInput } from "@/lib/sovereign/intelligence-signals";
import crypto from "crypto";

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(v as string) ? (v as T) : fallback;
}

/**
 * POST /api/sovereign/commons/record
 *
 * Records an anonymised diagnostic session into the Intelligence Commons.
 * Call this at the end of every completed diagnostic session.
 *
 * The orgId + sessionId are hashed one-way before storage — the commons
 * cannot be used to re-identify any individual client.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // One-way hash — cannot be reversed to identify the organisation
    const sessionHash = crypto
      .createHash("sha256")
      .update(`${body.orgId ?? "anon"}:${body.sessionId ?? Date.now()}`)
      .digest("hex");

    const signalInput: SignalInput = {
      posture: str(body.posture, ["SOVEREIGN", "ALIGNED", "DRIFTING", "MISALIGNED", "DISORDERED"] as const, "DRIFTING"),
      authorityType: str(body.authorityType, ["DIRECT", "DELEGATED", "CONTESTED", "UNCLEAR"] as const, "UNCLEAR"),
      readinessTier: str(body.readinessTier, ["SOVEREIGN", "ADVISORY", "EXECUTION", "FRAGILE"] as const, "ADVISORY"),
      trajectory: str(body.trajectory, ["IMPROVING", "STABLE", "DETERIORATING", "COLLAPSING"] as const, "STABLE"),
      failureModeCount: num(body.failureModeCount, 0),
      narrativeCoherence: num(body.narrativeCoherence, 50),
      interventionReadiness: num(body.interventionReadiness, 50),
      revenueBand: str(body.revenueBand, ["SEED", "SMB", "MID", "ENTERPRISE"] as const, "SMB"),
      orgState: str(body.orgState, ["STABLE", "SCALING", "STRESS", "CRISIS"] as const, "STABLE"),
      founderLed: typeof body.founderLed === "boolean" ? body.founderLed : undefined,
      sessionCount: typeof body.sessionCount === "number" ? body.sessionCount : undefined,
    };

    const activeSignals = detectIntelligenceSignals(signalInput);

    const record = recordCommonsEntry({
      sessionHash,
      industryTag: typeof body.industryTag === "string" ? body.industryTag : "unspecified",
      revenueBand: signalInput.revenueBand ?? "SMB",
      teamSizeBand: str(body.teamSizeBand, ["SOLO", "SMALL", "MID", "LARGE"] as const, "SMALL"),
      founderLed: typeof body.founderLed === "boolean" ? body.founderLed : false,
      sessionNumber: typeof body.sessionNumber === "number" ? body.sessionNumber : 1,

      authorityClarity: num(body.authorityClarity, 50),
      narrativeCoherence: num(body.narrativeCoherence, 50),
      interventionReadiness: num(body.interventionReadiness, 50),
      executionReadiness: num(body.executionReadiness, 50),
      overallPosture: signalInput.posture as "SOVEREIGN" | "ALIGNED" | "DRIFTING" | "MISALIGNED" | "DISORDERED",
      trajectory: signalInput.trajectory as "IMPROVING" | "STABLE" | "DETERIORATING" | "COLLAPSING",
      failureModeCount: signalInput.failureModeCount,

      activeSignalIds: activeSignals.map((s) => s.id),
      outcomeTag: body.outcomeTag ?? undefined,
      outcomeTimeDays: typeof body.outcomeTimeDays === "number" ? body.outcomeTimeDays : undefined,
      recordedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, recordId: record.id, signalsRecorded: activeSignals.length });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to record commons entry" },
      { status: 500 },
    );
  }
}

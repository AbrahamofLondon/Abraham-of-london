export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  detectIntelligenceSignals,
  detectPrimarySignal,
  summariseSignals,
  type SignalInput,
} from "@/lib/sovereign/intelligence-signals";
import {
  buildSovereignSignalAssessment,
} from "@/lib/sovereign/sovereign-signal-public-dto";

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const p = Number(v);
    if (Number.isFinite(p)) return p;
  }
  return fallback;
}

function str<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(v as string) ? (v as T) : fallback;
}

/**
 * POST /api/sovereign/signals
 *
 * Accepts diagnostic inputs and returns active intelligence signals — named,
 * pattern-matched institutional observations connected to the content library.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const input: SignalInput = {
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
      teamSize: str(body.teamSize, ["SOLO", "SMALL", "MID", "LARGE"] as const, "SMALL"),
      sessionCount: typeof body.sessionCount === "number" ? body.sessionCount : undefined,
    };

    const rawSignals = detectIntelligenceSignals(input);
    const primary = detectPrimarySignal(input);
    const summary = summariseSignals(rawSignals);

    // Build public-safe DTO — raw signals must not cross the API boundary
    const assessment = buildSovereignSignalAssessment(rawSignals, "SINGLE_SOURCE_INDICATED");

    return NextResponse.json({
      ok: true,
      assessment,
      signals: assessment.signals,  // public DTO shapes only
      primarySignal: primary ? primary.id : null,
      summary: assessment.executiveSummary || summary,
      count: assessment.signals.length,
      hasCritical: assessment.highestSeverity === "CRITICAL",
      hasAlert: assessment.highestSeverity === "ALERT" || assessment.highestSeverity === "CRITICAL",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to detect signals" },
      { status: 500 },
    );
  }
}

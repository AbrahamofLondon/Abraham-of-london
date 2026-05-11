export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { buildInstitutionalMemoryReport, type SessionSnapshot } from "@/lib/sovereign/institutional-memory";
import { detectIntelligenceSignals, type SignalInput } from "@/lib/sovereign/intelligence-signals";
import { requireSovereignApiAccess } from "@/lib/sovereign/require-sovereign-api-access";

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str<T extends string>(v: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

/**
 * POST /api/sovereign/memory
 *
 * Builds an institutional memory report from a sequence of session snapshots.
 * Returns: trajectory arc, recurring patterns, contradiction clusters,
 * unresolved signals, and the primary narrative.
 *
 * The returning-client experience is not a repeated questionnaire with
 * historical tabs. It is this.
 */
export async function POST(req: NextRequest) {
  const denied = await requireSovereignApiAccess(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => ({}));

    const organisationHandle =
      typeof body.organisationHandle === "string" ? body.organisationHandle : "organisation";

    const rawSessions = Array.isArray(body.sessions) ? body.sessions : [];

    const sessions: SessionSnapshot[] = rawSessions.map((s: Record<string, unknown>, i: number) => ({
      sessionId: typeof s.sessionId === "string" ? s.sessionId : `session-${i}`,
      sessionNumber: num(s.sessionNumber, i + 1),
      recordedAt: typeof s.recordedAt === "string" ? s.recordedAt : new Date().toISOString(),
      posture: str(s.posture as string, ["SOVEREIGN", "ALIGNED", "DRIFTING", "MISALIGNED", "DISORDERED"], "DRIFTING"),
      trajectory: str(s.trajectory as string, ["IMPROVING", "STABLE", "DETERIORATING", "COLLAPSING"], "STABLE"),
      scores: {
        authorityClarity: num((s.scores as Record<string, unknown>)?.authorityClarity, 50),
        narrativeCoherence: num((s.scores as Record<string, unknown>)?.narrativeCoherence, 50),
        interventionReadiness: num((s.scores as Record<string, unknown>)?.interventionReadiness, 50),
        executionReadiness: num((s.scores as Record<string, unknown>)?.executionReadiness, 50),
        overallReadiness: num((s.scores as Record<string, unknown>)?.overallReadiness, 50),
      },
      activeSignalIds: Array.isArray(s.activeSignalIds) ? s.activeSignalIds as string[] : [],
      failureModeCount: num(s.failureModeCount, 0),
      revenueBand: typeof s.revenueBand === "string" ? s.revenueBand : undefined,
      orgState: typeof s.orgState === "string" ? s.orgState : undefined,
    }));

    // Detect current signals from the most recent session context
    const currentInput: SignalInput = {
      posture: sessions.length > 0
        ? (sessions[sessions.length - 1]!.posture as SignalInput["posture"])
        : "DRIFTING",
      authorityType: str(body.authorityType as string, ["DIRECT", "DELEGATED", "CONTESTED", "UNCLEAR"], "UNCLEAR"),
      readinessTier: str(body.readinessTier as string, ["SOVEREIGN", "ADVISORY", "EXECUTION", "FRAGILE"], "ADVISORY"),
      trajectory: sessions.length > 0
        ? (sessions[sessions.length - 1]!.trajectory as SignalInput["trajectory"])
        : "STABLE",
      failureModeCount: sessions.length > 0 ? sessions[sessions.length - 1]!.failureModeCount : 0,
      narrativeCoherence: sessions.length > 0
        ? sessions[sessions.length - 1]!.scores.narrativeCoherence
        : 50,
      interventionReadiness: sessions.length > 0
        ? sessions[sessions.length - 1]!.scores.interventionReadiness
        : 50,
      sessionCount: sessions.length,
    };

    const currentSignals = detectIntelligenceSignals(currentInput);
    const report = buildInstitutionalMemoryReport(organisationHandle, sessions, currentSignals);

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to build memory report" },
      { status: 500 },
    );
  }
}

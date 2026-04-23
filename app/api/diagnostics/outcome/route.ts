import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { analyseLongitudinalChange } from "@/lib/monitoring/longitudinal-engine";

/**
 * GET /api/diagnostics/outcome?email=...&sessionId=...
 *
 * Computes before/after outcome verification for an intervention.
 * Returns: classification, baseline vs current, what improved, what didn't.
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const sessionId = searchParams.get("sessionId");

    if (!email && !sessionId) {
      return NextResponse.json({ ok: false, reason: "EMAIL_OR_SESSION_REQUIRED" }, { status: 400 });
    }

    // Find journeys for this user
    const where: Record<string, unknown> = {};
    if (email) where.email = email.toLowerCase();

    const journeys = await prisma.diagnosticJourney.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        stages: { orderBy: { createdAt: "desc" } },
        monitoringSnapshots: { orderBy: { createdAt: "desc" }, take: 5 },
        evidenceNodes: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (journeys.length < 2) {
      return NextResponse.json({ ok: true, hasOutcome: false });
    }

    const baseline = journeys[0]!;
    const current = journeys[journeys.length - 1]!;

    // Build snapshots from stages
    const buildSnapshot = (journey: typeof baseline) => {
      const stage = journey.stages[0];
      if (!stage) return null;
      const payload = typeof stage.payload === "string" ? JSON.parse(stage.payload) : stage.payload ?? {};
      return {
        timestamp: stage.createdAt.toISOString(),
        stage: stage.stage,
        coreMetrics: (payload as Record<string, unknown>).coreMetrics as Record<string, number> ?? {},
        tensions: Array.isArray((payload as Record<string, unknown>).tensions) ? (payload as Record<string, unknown>).tensions as string[] : [],
        escalationLevel: typeof (payload as Record<string, unknown>).escalationLevel === "number" ? (payload as Record<string, unknown>).escalationLevel as number : 0,
      };
    };

    const baselineSnapshot = buildSnapshot(baseline);
    const currentSnapshot = buildSnapshot(current);

    if (!baselineSnapshot || !currentSnapshot) {
      return NextResponse.json({ ok: true, hasOutcome: false });
    }

    const analysis = analyseLongitudinalChange([baselineSnapshot, currentSnapshot]);

    // Classify outcome
    const improved = analysis.metricChanges.filter((m) => m.delta > 5);
    const worsened = analysis.metricChanges.filter((m) => m.delta < -5);
    const avgDelta = analysis.metricChanges.length > 0
      ? analysis.metricChanges.reduce((s, m) => s + m.delta, 0) / analysis.metricChanges.length
      : 0;

    const classification =
      avgDelta > 15 && worsened.length === 0 ? "resolved"
      : avgDelta > 5 ? "improved"
      : avgDelta < -5 ? "deteriorated"
      : "stable";

    // Unresolved contradictions from evidence graph — preserve structure
    const contradictionNodes = current.evidenceNodes
      .filter((n) => n.kind === "contradiction")
      .slice(0, 5);
    const contradictions = contradictionNodes.map((n) => n.summary ?? n.label);
    const contradictionEvidence = contradictionNodes.map((n) => ({
      label: n.label,
      summary: n.summary,
      confidence: n.confidence,
      severity: n.severity,
      sourceStage: n.sourceStage,
    }));

    // Strategy Room linkage
    let strategyRoomHeld: string | null = null;
    if (sessionId) {
      const session = await prisma.strategyRoomExecutionSession.findFirst({
        where: { OR: [{ id: sessionId }, { sessionKey: sessionId }] },
      });
      if (session) {
        strategyRoomHeld = session.status === "completed" ? "held"
          : session.status === "monitoring" ? "partially_held"
          : session.status === "escalated" ? "failed"
          : "needs_renewal";
      }
    }

    // Persist outcome record
    await prisma.outcomeVerificationRecord.create({
      data: {
        baselineJourneyId: baseline.id,
        followUpJourneyId: current.id,
        sessionId: sessionId ?? null,
        outcomeClassification: classification,
        magnitudeOfChange: Math.round(avgDelta * 10) / 10,
        effectivenessScore: Math.max(0, Math.min(100, 50 + avgDelta)),
        unresolvedContradictions: contradictions,
        payload: {
          classification,
          metricChanges: analysis.metricChanges,
          improved: improved.map((m) => m.metric),
          worsened: worsened.map((m) => m.metric),
          tensionPersistence: analysis.tensionPersistence,
        },
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      hasOutcome: true,
      classification,
      baselineCondition: `${baselineSnapshot.stage}: ${Object.entries(baselineSnapshot.coreMetrics).map(([k, v]) => `${k} ${v}%`).join(", ")}`,
      currentCondition: `${currentSnapshot.stage}: ${Object.entries(currentSnapshot.coreMetrics).map(([k, v]) => `${k} ${v}%`).join(", ")}`,
      netMovement: avgDelta > 0
        ? `Net improvement of ${Math.round(avgDelta)} points across measured domains.`
        : avgDelta < 0
          ? `Net deterioration of ${Math.round(Math.abs(avgDelta))} points across measured domains.`
          : "No material movement across measured domains.",
      unresolvedContradictions: contradictions,
      interventionEffectiveness: {
        whatImproved: improved.map((m) => `${m.metric}: +${m.delta} points`),
        whatDidNot: worsened.map((m) => `${m.metric}: ${m.delta} points`),
        whatRemainsUncorrected: analysis.tensionPersistence.length > 0
          ? `Persistent patterns: ${analysis.tensionPersistence.join(", ")}`
          : "No persistent unresolved patterns detected.",
      },
      contradictionEvidence,
      strategyRoomHeld,
      baselineDate: baselineSnapshot.timestamp,
      currentDate: currentSnapshot.timestamp,
    });
  } catch (err) {
    console.error("[outcome-api]", err);
    return NextResponse.json({ error: "Failed to compute outcome" }, { status: 500 });
  }
}

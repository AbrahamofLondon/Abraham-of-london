import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { analyseLongitudinalChange, type DiagnosticSnapshot } from "@/lib/monitoring/longitudinal-engine";

/**
 * GET /api/diagnostics/longitudinal?email=...&stage=constitutional
 *
 * Detects prior comparable results and computes longitudinal analysis.
 */

export async function GET(req: NextRequest) {
  try {
    const email = new URL(req.url).searchParams.get("email");
    const stage = new URL(req.url).searchParams.get("stage") || "constitutional";

    if (!email) {
      return NextResponse.json({ ok: false, reason: "EMAIL_REQUIRED" }, { status: 400 });
    }

    // Find all journeys for this email
    const journeys = await prisma.diagnosticJourney.findMany({
      where: { email: email.toLowerCase() },
      orderBy: { createdAt: "desc" },
    });

    if (journeys.length < 1) {
      return NextResponse.json({ ok: true, hasBaseline: false, classification: "insufficient" });
    }

    // Get stage records for these journeys
    const journeyIds = journeys.map((j) => j.id);
    const stageRecords = await prisma.diagnosticStageRecord.findMany({
      where: { journeyId: { in: journeyIds }, stage },
      orderBy: { createdAt: "asc" },
    });

    // Build snapshots
    const snapshots: DiagnosticSnapshot[] = stageRecords.map((s) => {
      const payload = typeof s.payload === "string" ? JSON.parse(s.payload) : (s.payload as Record<string, unknown>) ?? {};
      return {
        id: s.id,
        timestamp: s.createdAt.toISOString(),
        stage: s.stage,
        coreMetrics: (payload.coreMetrics as Record<string, number>) ?? {},
        tensions: Array.isArray(payload.tensions) ? payload.tensions as string[] : [],
        escalationLevel: typeof payload.escalationLevel === "number" ? payload.escalationLevel : 0,
      };
    }).filter((s) => Object.keys(s.coreMetrics).length > 0);

    if (snapshots.length < 2) {
      return NextResponse.json({ ok: true, hasBaseline: false, classification: "insufficient" });
    }

    const analysis = analyseLongitudinalChange(snapshots);

    // Detect recurrence
    const ordered = [...snapshots].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let isRecurring = false;
    if (ordered.length >= 3) {
      const first = ordered[0]!;
      const middle = ordered[Math.floor(ordered.length / 2)]!;
      const last = ordered[ordered.length - 1]!;
      const resolvedInMiddle = first.tensions.filter((t) => !middle.tensions.includes(t));
      const returnedInLatest = resolvedInMiddle.filter((t) => last.tensions.includes(t));
      if (returnedInLatest.length > 0) {
        isRecurring = true;
        analysis.tensionPersistence = [...new Set([...analysis.tensionPersistence, ...returnedInLatest])];
      }
    }

    const classification = isRecurring ? "recurring" : analysis.classification;

    // Fetch contradiction nodes from evidence graph for these journeys
    const contradictionNodes = await prisma.diagnosticEvidenceNode.findMany({
      where: { journeyId: { in: journeyIds }, kind: "contradiction" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const contradictions = contradictionNodes.map((n) => ({
      label: n.label,
      summary: n.summary,
      confidence: n.confidence,
      severity: n.severity,
      sourceStage: n.sourceStage,
    }));

    // Identify contradictions that persist across journeys
    const persistingContradictions = contradictions.filter((c) =>
      contradictionNodes.filter((n) => n.label === c.label).length > 1,
    );

    // Persist comparison record
    await prisma.longitudinalComparisonRecord.create({
      data: {
        journeyId: journeys[0]!.id,
        baselineJourneyId: journeys.length > 1 ? journeys[journeys.length - 1]!.id : undefined,
        email: email.toLowerCase(),
        diagnosticType: stage,
        deltaSummary: analysis as any,
        recurrenceSummary: isRecurring ? { recurringPatterns: analysis.tensionPersistence } as any : undefined,
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      hasBaseline: true,
      classification,
      metricChanges: analysis.metricChanges,
      tensionPersistence: analysis.tensionPersistence,
      escalationMovement: analysis.escalationMovement,
      interventionEffect: analysis.interventionEffect,
      baselineDate: ordered[0]?.timestamp,
      currentDate: ordered[ordered.length - 1]?.timestamp,
      snapshotCount: snapshots.length,
      contradictions,
      persistingContradictions: persistingContradictions.map((c) => c.label),
    });
  } catch (err) {
    console.error("[longitudinal-api]", err);
    return NextResponse.json({ error: "Failed to compute longitudinal analysis" }, { status: 500 });
  }
}

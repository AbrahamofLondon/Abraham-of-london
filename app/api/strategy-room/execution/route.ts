import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { randomUUID } from "crypto";
import { getDiagnosticJourney } from "@/lib/diagnostics/journey-store";

/**
 * POST — Create a new Strategy Room execution session
 * GET  — List sessions (for admin / user lookup)
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      strategyRoomSessionId,
      email,
      directive,
      escalationLevel,
      conditionSummary,
      coreProblem,
      decisionQuestion,
      constraints,
      exposureLevel,
      interventionStack,
      constraintMap,
      canonicalSnapshot,
    } = body;
    const evidenceJourney = email
      ? await getDiagnosticJourney({ email })
      : null;
    const latestDecisionObject = evidenceJourney
      ? [...evidenceJourney.decisionObjects].reverse()[0] ?? null
      : null;
    const latestContradictions = evidenceJourney
      ? evidenceJourney.evidenceNodes
          .filter((node) => node.kind === "contradiction")
          .slice(-3)
      : [];
    const latestActions = evidenceJourney
      ? evidenceJourney.evidenceNodes
          .filter((node) => node.kind === "action")
          .slice(-3)
          .map((node) => node.summary)
      : [];

    const session = await prisma.strategyRoomExecutionSession.create({
      data: {
        sessionKey: `exec_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
        strategyRoomSessionId: strategyRoomSessionId ?? null,
        email: email ?? null,
        directive: directive ?? null,
        escalationLevel: escalationLevel ?? null,
        conditionSummary: conditionSummary ?? latestContradictions[0]?.summary ?? null,
        coreProblem: coreProblem ?? latestContradictions[0]?.label ?? null,
        decisionQuestion: decisionQuestion ?? latestDecisionObject?.decisionText ?? null,
        constraints: constraints
          ? JSON.stringify(constraints)
          : latestDecisionObject?.constraintText
            ? JSON.stringify([latestDecisionObject.constraintText])
            : null,
        exposureLevel: exposureLevel ?? null,
        interventionStack: interventionStack
          ? JSON.stringify(interventionStack)
          : latestActions.length
            ? JSON.stringify(latestActions.map((action, index) => ({
                id: `graph_action_${index + 1}`,
                intent: action,
                expectedEffect: "Reduce the highest-ranked unresolved contradiction.",
                riskIfIgnored: latestContradictions[0]?.summary ?? "The contradiction remains unmanaged.",
                urgency: index === 0 ? "HIGH" : "MEDIUM",
                dependency: index === 0 ? "Decision owner confirmed" : "Previous action completed",
                executionFriction: index === 0 ? "MEDIUM" : "LOW",
                failureSignal: "No owner, date, or observable movement is recorded.",
              })))
            : null,
        constraintMap: constraintMap ? JSON.stringify(constraintMap) : null,
        canonicalSnapshot: canonicalSnapshot
          ? JSON.stringify(canonicalSnapshot)
          : evidenceJourney
            ? JSON.stringify({
                evidenceGraph: {
                  decisionObjects: evidenceJourney.decisionObjects,
                  nodes: evidenceJourney.evidenceNodes,
                },
              })
            : null,
        status: "active",
      },
    });

    return NextResponse.json({ ok: true, id: session.id, sessionKey: session.sessionKey });
  } catch (err) {
    console.error("[execution-session-create]", err);
    return NextResponse.json(
      { error: "Failed to create execution session" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (email) where.email = email;
    if (status) where.status = status;

    const sessions = await prisma.strategyRoomExecutionSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        decisions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return NextResponse.json({ ok: true, sessions });
  } catch (err) {
    console.error("[execution-session-list]", err);
    return NextResponse.json(
      { error: "Failed to list execution sessions" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { randomUUID } from "crypto";

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

    const session = await prisma.strategyRoomExecutionSession.create({
      data: {
        sessionKey: `exec_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
        strategyRoomSessionId: strategyRoomSessionId ?? null,
        email: email ?? null,
        directive: directive ?? null,
        escalationLevel: escalationLevel ?? null,
        conditionSummary: conditionSummary ?? null,
        coreProblem: coreProblem ?? null,
        decisionQuestion: decisionQuestion ?? null,
        constraints: constraints ? JSON.stringify(constraints) : null,
        exposureLevel: exposureLevel ?? null,
        interventionStack: interventionStack
          ? JSON.stringify(interventionStack)
          : null,
        constraintMap: constraintMap ? JSON.stringify(constraintMap) : null,
        canonicalSnapshot: canonicalSnapshot
          ? JSON.stringify(canonicalSnapshot)
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

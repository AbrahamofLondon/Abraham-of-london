import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma.server";
import {
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
} from "@/lib/server/security/app-route-guards";
import { assertStrategyRoomAccess } from "@/lib/server/strategy-room/access.server";

type RouteContext = { params: Promise<{ id: string }> };
const patchSchema = z.object({
  status: z.string().trim().max(80).optional(),
  coreProblem: z.string().trim().max(1200).optional().nullable(),
  decisionQuestion: z.string().trim().max(1200).optional().nullable(),
  constraints: z.unknown().optional(),
  exposureLevel: z.string().trim().max(80).optional().nullable(),
  interventionStack: z.unknown().optional(),
  constraintMap: z.unknown().optional(),
}).strict();

/**
 * GET  — Fetch a single execution session with decisions
 * PATCH — Update session fields (status, intervention stack, constraints, etc.)
 */

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const access = await assertStrategyRoomAccess({
      request: _req,
      sessionRef: id,
      purpose: "strategy_room_access",
      allowTokenPurposes: ["strategy_room_access", "return_brief"],
    });
    if (!access.ok) {
      return noStoreJson({ error: access.error }, { status: access.status });
    }

    const session = await prisma.strategyRoomExecutionSession.findUnique({
      where: { id },
      include: {
        decisions: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      session: {
        ...session,
        constraints: session.constraints ? JSON.parse(session.constraints) : [],
        interventionStack: session.interventionStack
          ? JSON.parse(session.interventionStack)
          : [],
        constraintMap: session.constraintMap
          ? JSON.parse(session.constraintMap)
          : null,
        canonicalSnapshot: session.canonicalSnapshot
          ? JSON.parse(session.canonicalSnapshot)
          : null,
      },
    });
  } catch (err) {
    console.error("[execution-session-get]", err);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const methodCheck = requireMethod(req, ["PATCH"]);
    if (!methodCheck.ok) return methodCheck.response;

    const contentCheck = requireJsonContent(req);
    if (!contentCheck.ok) return contentCheck.response;

    const { id } = await ctx.params;
    const access = await assertStrategyRoomAccess({
      request: req,
      sessionRef: id,
      purpose: "strategy_room_access",
    });
    if (!access.ok) {
      return noStoreJson({ error: access.error }, { status: access.status });
    }

    const parsed = await parseJsonBody(req, patchSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const updateData: Record<string, unknown> = {};

    if (body.status) updateData.status = body.status;
    if (body.coreProblem !== undefined) updateData.coreProblem = body.coreProblem;
    if (body.decisionQuestion !== undefined) updateData.decisionQuestion = body.decisionQuestion;
    if (body.constraints !== undefined)
      updateData.constraints = JSON.stringify(body.constraints);
    if (body.exposureLevel !== undefined) updateData.exposureLevel = body.exposureLevel;
    if (body.interventionStack !== undefined)
      updateData.interventionStack = JSON.stringify(body.interventionStack);
    if (body.constraintMap !== undefined)
      updateData.constraintMap = JSON.stringify(body.constraintMap);

    const session = await prisma.strategyRoomExecutionSession.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, session });
  } catch (err) {
    console.error("[execution-session-update]", err);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 },
    );
  }
}

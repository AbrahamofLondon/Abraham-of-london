import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import {
  evaluateStateTransition,
  computeDynamicConsequence,
  computeDefaultDeadline,
  detectRepeatedAvoidance,
  type DecisionAction,
  type SessionExecutionState,
} from "@/lib/execution/decision-state-engine";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/strategy-room/execution/[id]/state
 *
 * Returns the current enforcement state for a Strategy Room execution session.
 * Derived from real data — no client-side guessing.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;

    const session = await prisma.strategyRoomExecutionSession.findUnique({
      where: { id },
      include: { decisions: { orderBy: { createdAt: "asc" } } },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Build action list with avoidance detection
    const rawActions = session.decisions;
    const actions: DecisionAction[] = rawActions.map((d) => ({
      id: d.id,
      text: d.decision,
      status: (d.status as DecisionAction["status"]) || "PENDING",
      deadline: computeDefaultDeadline(
        d.status === "PENDING" ? "near_term" : "structural",
      ),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      blockReason: d.notes,
      avoidanceCount: detectRepeatedAvoidance(
        d.decision,
        rawActions
          .filter((dd) => dd.id !== d.id)
          .map((dd) => ({
            id: dd.id,
            text: dd.decision,
            status: (dd.status as DecisionAction["status"]) || "PENDING",
            deadline: "",
            createdAt: dd.createdAt.toISOString(),
            updatedAt: dd.updatedAt.toISOString(),
            avoidanceCount: 0,
          })),
      ),
    }));

    // Compute max avoidance
    const maxAvoidance = Math.max(0, ...actions.map((a) => a.avoidanceCount));
    const repeatedAction = actions.find((a) => a.avoidanceCount >= 2);

    // Build execution state
    const executionState: SessionExecutionState = {
      sessionId: id,
      systemState: (session.status as DecisionAction["status"]) || "PENDING",
      actions,
      escalationTriggers: [],
      consequenceScore: 0,
      lastEscalationCheck: new Date().toISOString(),
      avoidancePatterns: repeatedAction ? [repeatedAction.text] : [],
      directive: null,
    };

    const transition = evaluateStateTransition(executionState);
    const consequence = computeDynamicConsequence(executionState);

    // Build trigger list
    const triggers = transition.triggers.map((t) => ({
      triggerType: t,
      message:
        t === "DEADLINE_EXCEEDED" ? "An action has passed its deadline without execution."
        : t === "ACTIONS_SKIPPED" ? `${actions.filter((a) => a.status === "PENDING").length} actions remain unexecuted past their deadlines.`
        : t === "BLOCKED_WITHOUT_REASON" ? "An action was blocked without stating the constraint."
        : t === "REPEATED_AVOIDANCE" ? transition.avoidancePattern ?? "The same decision is being avoided repeatedly."
        : "Escalation condition met.",
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      state: transition.newState,
      escalationLevel: transition.triggers.length,
      avoidanceCount: maxAvoidance,
      repeatedPatternLabel: maxAvoidance >= 2 ? "repeated_decision_avoidance" : null,
      consequence: {
        currentExposure: consequence.score,
        previousExposure: null, // TODO: store previous for delta
        baseRisk: null,
        timePenalty: null,
        failurePenalty: null,
      },
      consequenceLabel: consequence.label,
      consequenceExplanation: consequence.explanation,
      consequenceTrend: consequence.trend,
      directive: transition.directive,
      triggers,
    });
  } catch (err) {
    console.error("[execution-state]", err);
    return NextResponse.json({ error: "Failed to compute state" }, { status: 500 });
  }
}

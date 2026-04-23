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
import {
  buildDecisionSurfacePayload,
  insufficientEvidenceContradiction,
} from "@/lib/contracts/decision-surface";

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

    const linkedDecisionObjectId = session.decisions.find((decision) => decision.decisionObjectId)?.decisionObjectId;
    if (!linkedDecisionObjectId && session.decisions.length > 0) {
      return NextResponse.json(
        { error: "Strategy Room decision logs are missing canonical decisionObjectId" },
        { status: 409 },
      );
    }

    if (linkedDecisionObjectId) {
      const inactiveRetainer = await prisma.retainedDecision.findFirst({
        where: {
          decisionObjectId: linkedDecisionObjectId,
          contract: { status: { not: "ACTIVE" } },
        },
        include: { contract: true },
      });

      if (inactiveRetainer) {
        return NextResponse.json(
          { error: "Retainer contract is not active", contractStatus: inactiveRetainer.contract.status },
          { status: 403 },
        );
      }
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

    // Read previous consequence from persisted timeline for delta
    const previousConsequence = await prisma.consequenceTimeline.findFirst({
      where: { sessionId: id },
      orderBy: { createdAt: "desc" },
    });

    // Read persisted escalation events
    const persistedEscalations = await prisma.escalationEvent.findMany({
      where: { sessionId: id, resolvedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Merge computed triggers with persisted events
    const allTriggers = [
      ...persistedEscalations.map((e) => ({
        triggerType: e.triggerType,
        message: e.message,
        createdAt: e.createdAt.toISOString(),
      })),
      ...triggers.filter((t) => !persistedEscalations.some((e) => e.triggerType === t.triggerType)),
    ];

    const decisionSurface = buildDecisionSurfacePayload({
      decisionId: linkedDecisionObjectId || session.sessionKey,
      contradictions: allTriggers.length
        ? allTriggers.map((trigger, index) => ({
            id: `strategy-room:${id}:${trigger.triggerType}:${index}`,
            label: String(trigger.triggerType),
            summary: trigger.message,
            severity: transition.newState === "ESCALATED" || transition.newState === "FAILED" ? "high" : "medium",
            confidence: 0.76,
            sourceStage: "strategy_room",
          }))
        : [insufficientEvidenceContradiction({
            id: `strategy-room:${id}:no-active-trigger`,
            sourceStage: "strategy_room",
            summary: "No active escalation trigger is present on this Strategy Room execution session.",
          })],
      enforcementState: transition.newState === "ESCALATED" || transition.newState === "FAILED"
        ? "ESCALATED"
        : transition.newState === "EXECUTED"
          ? "RESOLVED"
          : "ACTIVE",
      consequenceScore: consequence.score,
    });

    return NextResponse.json({
      ok: true,
      decisionSurface,
      decisionSurfacePayload: decisionSurface,
      state: transition.newState,
      escalationLevel: Math.max(transition.triggers.length, persistedEscalations.length),
      avoidanceCount: maxAvoidance,
      repeatedPatternLabel: maxAvoidance >= 2 ? "repeated_decision_avoidance" : null,
      consequence: {
        currentExposure: consequence.score,
        previousExposure: previousConsequence?.score ?? null,
        baseRisk: null,
        timePenalty: null,
        failurePenalty: null,
      },
      consequenceLabel: consequence.label,
      consequenceExplanation: consequence.explanation,
      consequenceTrend: consequence.trend,
      directive: transition.directive,
      triggers: allTriggers,
    });
  } catch (err) {
    console.error("[execution-state]", err);
    return NextResponse.json({ error: "Failed to compute state" }, { status: 500 });
  }
}

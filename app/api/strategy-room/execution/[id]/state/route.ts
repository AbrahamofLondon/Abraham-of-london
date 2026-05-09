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
import { classifyAIDecisionRisk } from "@/lib/diagnostics/ai-decision-risk";
import { assertStrategyRoomAccess } from "@/lib/server/strategy-room/access.server";
import { noStoreJson, requireMethod } from "@/lib/server/security/app-route-guards";
import { evaluateDecision } from "@/lib/decision/kernel";
import { simulateAction } from "@/lib/decision/simulation-engine";
import { analyzeContagionRisk, simulateInterventionImpact } from "@/lib/alignment/governance-logic";
import { SIGNALS } from "@/lib/diagnostics/signals";
import { resolveCheckpointForResponse } from "@/lib/product/checkpoint-service";

type RouteContext = { params: Promise<{ id: string }> };

function normalizeDecisionState(value: string | null | undefined): DecisionAction["status"] {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "EXECUTED") return "EXECUTED";
  if (normalized === "BLOCKED") return "BLOCKED";
  if (normalized === "ESCALATED") return "ESCALATED";
  if (normalized === "FAILED") return "FAILED";
  return "PENDING";
}

function parseSnapshot(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function buildTelemetryMetrics(snapshot: Record<string, unknown>, consequenceScore: number) {
  const executionRecord = snapshot.executionRecord && typeof snapshot.executionRecord === "object"
    ? snapshot.executionRecord as Record<string, unknown>
    : null;
  return [
    { label: "AUTHORITY", intent: 88, reality: executionRecord?.authority ? 62 : 42 },
    { label: "EXECUTION", intent: 90, reality: Math.max(18, 100 - consequenceScore) },
    { label: "GOVERNANCE", intent: 84, reality: executionRecord?.decision ? 58 : 46 },
    { label: "TIMING", intent: 82, reality: Math.max(20, 92 - consequenceScore) },
  ];
}

/**
 * GET /api/strategy-room/execution/[id]/state
 *
 * Returns the current enforcement state for a Strategy Room execution session.
 * Derived from real data — no client-side guessing.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const methodCheck = requireMethod(_req, ["GET"]);
    if (!methodCheck.ok) return methodCheck.response;

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

    const linkedDecisionObject = linkedDecisionObjectId
      ? await prisma.diagnosticDecisionObject.findUnique({ where: { id: linkedDecisionObjectId } })
      : null;
    const aiRisk = linkedDecisionObject ? classifyAIDecisionRisk(linkedDecisionObject) : null;
    const snapshot = parseSnapshot(session.canonicalSnapshot);

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
      status: normalizeDecisionState(d.status),
      deadline: computeDefaultDeadline(
        normalizeDecisionState(d.status) === "PENDING" ? "near_term" : "structural",
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
            status: normalizeDecisionState(dd.status),
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
      systemState: normalizeDecisionState(session.status),
      actions,
      escalationTriggers: [],
      consequenceScore: 0,
      lastEscalationCheck: new Date().toISOString(),
      avoidancePatterns: repeatedAction ? [repeatedAction.text] : [],
      directive: null,
    };

    const transition = evaluateStateTransition(executionState);
    const consequence = computeDynamicConsequence(executionState);
    const kernel = evaluateDecision({
      id,
      source: "strategy_room",
      condition: session.conditionSummary || session.coreProblem || "Strategy Room execution condition",
      decisionRequired: session.decisionQuestion || linkedDecisionObject?.decisionText || "Execute the next governed action.",
      evidenceChain: actions.slice(0, 5).map((action) => ({
        inputSource: "strategy_room",
        observedPattern: action.text,
        weight: action.status === "EXECUTED" ? 0.72 : action.status === "BLOCKED" ? 0.88 : 0.62,
        explanation: `Execution action is currently ${action.status.toLowerCase()}.`,
      })),
      internalContradictions: actions
        .filter((action) => action.status === "BLOCKED" || action.status === "PENDING")
        .map((action) => `${action.text} remains ${action.status.toLowerCase()}.`),
      scores: {
        blockedCount: actions.filter((action) => action.status === "BLOCKED").length,
        pendingCount: actions.filter((action) => action.status === "PENDING").length,
        consequenceScore: consequence.score,
      },
      signalStrength: consequence.score >= 70 ? "STRONG" : consequence.score >= 40 ? "MODERATE" : "WEAK",
      sources: [
        { type: "system_computed", count: Math.max(actions.length, 1) },
        ...(linkedDecisionObject ? [{ type: "self_report" as const, count: 1 }] : []),
      ],
      authorityType: linkedDecisionObject?.stakeholderText || undefined,
      aiExposureLevel: linkedDecisionObject?.aiExposureLevel,
      aiLeverageAction: null,
      expectedOutcome: actions[0]?.text,
      daysSinceIdentification: Math.max(0, Math.floor((Date.now() - session.createdAt.getTime()) / 86_400_000)),
    });
    const telemetryMetrics = buildTelemetryMetrics(snapshot, consequence.score);
    const contagionMap = analyzeContagionRisk(telemetryMetrics);
    const governanceImpact = simulateInterventionImpact(telemetryMetrics, {
      domain: contagionMap[0]?.sourceDomain || telemetryMetrics[0]?.label || "AUTHORITY",
      estimatedRecovery: Math.max(4, Math.round(Math.max(transition.triggers.length, 1) * 2)),
      estimatedTimeframe: transition.newState === "ESCALATED" ? 7 : 14,
    });
    const simulationSpine = {
      id: session.id,
      case: {
        id: session.id,
        decision: session.decisionQuestion || linkedDecisionObject?.decisionText || "Execute the next governed action.",
        priorAttempt: session.conditionSummary || "",
        costOfDelay: session.conditionSummary || "",
        claimedOwner: linkedDecisionObject?.stakeholderText || "",
        blocker: session.coreProblem || "",
        forcedAction: actions[0]?.text || "",
        email: session.email || undefined,
      },
      c3: {
        clarity: 0.7,
        context: 0.7,
        consequence: 0.7,
        specificityScore: 0.7,
        mode: "SYNTHESIS_READY",
        tier: "FULL_SYNTHESIS",
        confidenceBand: "high",
        missing: [],
        scoringExplanation: { clarity: "", context: "", consequence: "" },
        recoveryClassification: null,
      },
      deterministic: {
        conditionClass: "execution",
        signal: SIGNALS.EXECUTION_AVOIDANCE,
        contradictionSet: kernel.decision.reason ? [kernel.decision.reason] : [],
        blockerClass: "execution",
      },
      synthesis: null,
      forecast: {} as never,
      memory: null,
      stakeholderMap: {
        formalOwner: linkedDecisionObject?.stakeholderText || null,
        realOwner: linkedDecisionObject?.stakeholderText || null,
        blockers: actions.filter((action) => action.status === "BLOCKED").map((action) => action.text),
        silentInfluencers: [] as string[],
        misalignedParties: [] as string[],
      },
      stage: "strategy_room" as const,
      history: [],
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
    const actionSimulations = [
      "escalate",
      "delay",
      "delegate",
      "replace owner",
      "force deadline",
      "pause",
      "do nothing",
    ].map((action) => ({
      action,
      ...simulateAction({
        action,
        spine: simulationSpine as never,
        stakeholderMap: simulationSpine.stakeholderMap,
      }),
    }));

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
      ai: aiRisk ? {
        exposureLevel: aiRisk.aiExposureLevel,
        classification: aiRisk.classification,
        displacementRisk: aiRisk.aiDisplacementRisk,
        decisionVelocityScore: aiRisk.decisionVelocityScore,
        accelerationRiskScore: aiRisk.accelerationRiskScore,
      } : undefined,
    });

    const checkpoint = await resolveCheckpointForResponse({
      strategyRoomSessionId: session.strategyRoomSessionId ?? session.sessionKey,
      email: session.email,
    });
    const checkpointPayload = checkpoint?.payload;
    const latestResponse = checkpointPayload?.responses?.at(-1) ?? checkpointPayload?.response ?? null;
    const checkpointStatus = latestResponse
      ? "RESPONDED"
      : checkpointPayload?.dueAt && new Date(checkpointPayload.dueAt).getTime() < Date.now()
        ? "OVERDUE"
        : checkpointPayload?.dueAt
          ? "DUE"
          : "SCHEDULED";

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
      ai: aiRisk,
      kernel,
      governanceImpact: {
        contagionRisk: contagionMap[0]?.riskLevel ?? "LOW",
        affectedDomains: contagionMap.map((risk) => risk.targetDomain),
        interventionUrgency: transition.newState === "ESCALATED" || contagionMap[0]?.riskLevel === "HIGH" ? "HIGH" : consequence.score >= 40 ? "MEDIUM" : "LOW",
        simulation: governanceImpact,
      },
      checkpoint: checkpoint
        ? {
            checkpointId: checkpoint.record.id,
            strategyRoomSessionId: checkpointPayload?.strategyRoomSessionId ?? session.strategyRoomSessionId ?? session.sessionKey,
            sourceSurface: checkpointPayload?.sourceSurface ?? "STRATEGY_ROOM",
            sourceLabel: checkpointPayload?.sourceLabel ?? "Strategy Room: execution state",
            evidencePosture: checkpointPayload?.evidencePosture ?? "SYSTEM_INFERRED",
            commandTitle: checkpointPayload?.commandTitle ?? "Strategy Room checkpoint",
            verificationQuestion: checkpointPayload?.verificationQuestion ?? "What happened?",
            dueAt: checkpointPayload?.dueAt ?? null,
            status: checkpointStatus,
            responseStatus: latestResponse?.status ?? null,
            respondedAt: latestResponse?.respondedAt ?? null,
          }
        : null,
      actionSimulations,
      directive: transition.directive,
      triggers: allTriggers,
    });
  } catch (err) {
    console.error("[execution-state]", err);
    return NextResponse.json({ error: "Failed to compute state" }, { status: 500 });
  }
}

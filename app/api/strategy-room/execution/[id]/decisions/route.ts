import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma.server";
import { propagateDecisionChange } from "@/lib/strategy-room/execution-feedback";
import { buildGenericAuthorityPacket } from "@/lib/diagnostics/evidence-graph";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import {
  evaluateStateTransition,
  computeDynamicConsequence,
  computeDefaultDeadline,
  detectRepeatedAvoidance,
  type DecisionAction,
  type SessionExecutionState,
} from "@/lib/execution/decision-state-engine";
import { buildDecisionSurfacePayload } from "@/lib/contracts/decision-surface";
import { classifyAIDecisionRisk } from "@/lib/diagnostics/ai-decision-risk";
import {
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
} from "@/lib/server/security/app-route-guards";
import { assertStrategyRoomAccess } from "@/lib/server/strategy-room/access.server";

type RouteContext = { params: Promise<{ id: string }> };
const postSchema = z.object({
  decision: z.string().trim().min(1).max(2000),
  notes: z.string().trim().max(2000).optional().nullable(),
  aiLeverageAction: z.string().trim().max(64).optional(),
  decisionObjectId: z.string().trim().min(1).max(128).optional(),
}).strict();

const patchSchema = z.object({
  decisionId: z.string().trim().min(1).max(128),
  status: z.enum(["pending", "executed", "blocked"]).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  aiLeverageAction: z.string().trim().max(64).optional(),
}).strict();

function parseJsonObject(value: string | null | undefined): Record<string, unknown> {
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

async function findInactiveRetainerForDecision(decisionObjectId: string) {
  return prisma.retainedDecision.findFirst({
    where: {
      decisionObjectId,
      contract: { status: { not: "ACTIVE" } },
    },
    include: { contract: true },
  });
}

/**
 * POST  — Log a new decision
 * PATCH — Update decision status (pending → executed | blocked)
 */

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const methodCheck = requireMethod(req, ["POST"]);
    if (!methodCheck.ok) return methodCheck.response;

    const contentCheck = requireJsonContent(req);
    if (!contentCheck.ok) return contentCheck.response;

    const { id: sessionId } = await ctx.params;
    const access = await assertStrategyRoomAccess({
      request: req,
      sessionRef: sessionId,
      purpose: "strategy_room_access",
    });
    if (!access.ok) {
      return noStoreJson({ error: access.error }, { status: access.status });
    }

    const parsed = await parseJsonBody(req, postSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const { decision, notes } = body;
    const aiLeverageAction = typeof body?.aiLeverageAction === "string" ? body.aiLeverageAction.trim() : "";
    const decisionObjectId = typeof body?.decisionObjectId === "string" ? body.decisionObjectId.trim() : "";

    if (!decision || typeof decision !== "string") {
      return NextResponse.json(
        { error: "Decision text is required" },
        { status: 400 },
      );
    }

    if (!decisionObjectId) {
      return NextResponse.json(
        { error: "decisionObjectId is required" },
        { status: 400 },
      );
    }

    // Verify session exists
    const session = await prisma.strategyRoomExecutionSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Detect avoidance from prior decisions
    const priorDecisions = await prisma.strategyDecisionLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
    const avoidance = detectRepeatedAvoidance(
      decision,
      priorDecisions.map((d) => ({
        id: d.id, text: d.decision, status: (d.status as any) || "PENDING",
        deadline: d.deadline?.toISOString() ?? "", createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(), avoidanceCount: d.avoidanceCount,
      })),
    );

    const linkedDecisionObject = await prisma.diagnosticDecisionObject.findUnique({
      where: { id: decisionObjectId },
    });
    if (!linkedDecisionObject) {
      return NextResponse.json(
        { error: "decisionObjectId does not resolve to a canonical decision object" },
        { status: 400 },
      );
    }

    const aiRisk = classifyAIDecisionRisk(linkedDecisionObject);
    if (aiRisk.requiresAILeverageAction && !aiLeverageAction) {
      return NextResponse.json(
        {
          error: "aiLeverageAction is required for HIGH or CRITICAL AI exposure decisions",
          ai: aiRisk,
          allowedActions: ["automate", "augment", "eliminate", "redesign"],
        },
        { status: 409 },
      );
    }

    const inactiveRetainer = await findInactiveRetainerForDecision(decisionObjectId);
    if (inactiveRetainer) {
      return NextResponse.json(
        { error: "Retainer contract is not active", contractStatus: inactiveRetainer.contract.status },
        { status: 403 },
      );
    }

    const log = await prisma.strategyDecisionLog.create({
      data: {
        sessionId,
        decisionObjectId,
        decision,
        notes: notes ?? null,
        status: "pending",
        deadline: new Date(computeDefaultDeadline("near_term")),
        avoidanceCount: avoidance,
      },
    });

    // Fire feedback loop (non-blocking)
    propagateDecisionChange(sessionId, "created", log.id).catch(() => {});
    const canonical = parseJsonObject(session.canonicalSnapshot);
    const evidenceGraph = canonical.evidenceGraph && typeof canonical.evidenceGraph === "object"
      ? canonical.evidenceGraph as Record<string, unknown>
      : {};
    const contradictions = Array.isArray(evidenceGraph.nodes)
      ? evidenceGraph.nodes.filter((node: any) => node?.kind === "contradiction").slice(-2)
      : [];
    const packet = buildGenericAuthorityPacket({
      stage: "strategy_room",
      condition: session.coreProblem || "Strategy Room execution decision",
      contradiction: contradictions.length
        ? contradictions.map((node: any) => String(node.summary || node.label || "")).filter(Boolean).join(" ")
        : session.conditionSummary || "Decision logged against the active intervention path.",
      decisionText: decision,
      constraintText: session.constraints || session.constraintMap || null,
      costOfDelayText: session.conditionSummary || null,
      stakeholderText: session.email || null,
      firstMove: decision,
      skippedConsequence: "The intervention path remains theoretical until this decision moves.",
      escalationCondition: "Escalate if the decision is blocked or remains pending after the active execution window.",
      riskScore: 72,
      formula: "logged decision execution risk baseline",
      reasoning: [
        "Strategy Room decision was logged",
        session.coreProblem ? `Core problem: ${session.coreProblem}` : "",
        session.conditionSummary ? `Condition: ${session.conditionSummary}` : "",
      ].filter(Boolean),
      confidence: 0.78,
      payload: { sessionId, decisionLogId: log.id, decisionObjectId, status: log.status },
    });
    persistDiagnosticStage({
      email: session.email,
      subjectId: session.sessionKey,
      stage: "strategy_room",
      payload: { decisionLogId: log.id, decision, status: log.status },
      tensions: packet.nodes.filter((node) => node.kind === "contradiction").map((node) => node.label),
      routeDecision: { decisionLogId: log.id, status: log.status },
      evidenceNodes: packet.nodes,
      decisionObject: packet.decisionObject,
    }).catch(() => {});

    // Evaluate system state after decision logged
    const allDecisions = await prisma.strategyDecisionLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
    const executionState: SessionExecutionState = {
      sessionId,
      systemState: (session.status as any) || "PENDING",
      actions: allDecisions.map((d) => ({
        id: d.id,
        text: d.decision,
        status: (d.status as any) || "PENDING",
        deadline: computeDefaultDeadline("near_term"),
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        blockReason: d.notes,
        avoidanceCount: detectRepeatedAvoidance(d.decision, allDecisions.map((dd) => ({
          id: dd.id, text: dd.decision, status: (dd.status as any) || "PENDING",
          deadline: "", createdAt: dd.createdAt.toISOString(), updatedAt: dd.updatedAt.toISOString(),
          avoidanceCount: 0,
        }))),
      })),
      escalationTriggers: [],
      consequenceScore: 0,
      lastEscalationCheck: new Date().toISOString(),
      avoidancePatterns: [],
      directive: null,
    };
    const transition = evaluateStateTransition(executionState);
    const consequence = computeDynamicConsequence(executionState);

    // Persist consequence timeline (durable)
    await prisma.consequenceTimeline.create({
      data: {
        sessionId,
        score: consequence.score,
        label: consequence.label,
        trend: consequence.trend,
        explanation: consequence.explanation,
      },
    }).catch(() => {});

    // Persist escalation events (durable)
    for (const trigger of transition.triggers) {
      await prisma.escalationEvent.create({
        data: {
          sessionId,
          triggerType: trigger,
          message: transition.directive ?? `Escalation trigger: ${trigger}`,
          decisionId: log.id,
        },
      }).catch(() => {});
    }

    // Update session status if state changed
    if (transition.newState !== session.status) {
      await prisma.strategyRoomExecutionSession.update({
        where: { id: sessionId },
        data: { status: transition.newState },
      }).catch(() => {});
    }

    const decisionSurface = buildDecisionSurfacePayload({
      decisionId: decisionObjectId,
      contradictions: packet.nodes
        .filter((node) => node.kind === "contradiction")
        .map((node) => ({
          label: node.label,
          summary: node.summary,
          severity: node.severity,
          confidence: node.confidence,
          sourceStage: node.sourceStage,
        })),
      enforcementState: transition.newState === "ESCALATED" || transition.newState === "FAILED"
        ? "ESCALATED"
        : transition.newState === "EXECUTED"
          ? "RESOLVED"
          : "ACTIVE",
      consequenceScore: consequence.score,
      ai: {
        exposureLevel: aiRisk.aiExposureLevel,
        classification: aiRisk.classification,
        displacementRisk: aiRisk.aiDisplacementRisk,
        decisionVelocityScore: aiRisk.decisionVelocityScore,
        accelerationRiskScore: aiRisk.accelerationRiskScore,
      },
    });

    return NextResponse.json({
      ok: true,
      decision: log,
      decisionSurface,
      decisionSurfacePayload: decisionSurface,
      systemState: transition.newState,
      consequence,
      directive: transition.directive,
      avoidancePattern: transition.avoidancePattern,
    });
  } catch (err) {
    console.error("[decision-log-create]", err);
    return NextResponse.json(
      { error: "Failed to log decision" },
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

    const { id: sessionId } = await ctx.params;
    const access = await assertStrategyRoomAccess({
      request: req,
      sessionRef: sessionId,
      purpose: "strategy_room_access",
    });
    if (!access.ok) {
      return noStoreJson({ error: access.error }, { status: access.status });
    }

    const parsed = await parseJsonBody(req, patchSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const { decisionId, status, notes } = body;

    if (!decisionId) {
      return NextResponse.json(
        { error: "decisionId is required" },
        { status: 400 },
      );
    }

    const validStatuses = ["pending", "executed", "blocked"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const log = await prisma.strategyDecisionLog.update({
      where: { id: decisionId },
      data: updateData,
    });
    const session = await prisma.strategyRoomExecutionSession.findUnique({
      where: { id: sessionId },
    });

    if (!log.decisionObjectId) {
      return NextResponse.json(
        { error: "Decision log is missing canonical decisionObjectId" },
        { status: 409 },
      );
    }

    const inactiveRetainer = await findInactiveRetainerForDecision(log.decisionObjectId);
    if (inactiveRetainer) {
      return NextResponse.json(
        { error: "Retainer contract is not active", contractStatus: inactiveRetainer.contract.status },
        { status: 403 },
      );
    }

    const linkedDecisionObject = await prisma.diagnosticDecisionObject.findUnique({
      where: { id: log.decisionObjectId },
    });
    const aiRisk = linkedDecisionObject ? classifyAIDecisionRisk(linkedDecisionObject) : null;
    const aiLeverageAction = typeof body?.aiLeverageAction === "string" ? body.aiLeverageAction.trim() : "";
    if (aiRisk?.requiresAILeverageAction && status === "executed" && !aiLeverageAction) {
      return NextResponse.json(
        {
          error: "aiLeverageAction is required before executing a HIGH or CRITICAL AI exposure decision",
          ai: aiRisk,
          allowedActions: ["automate", "augment", "eliminate", "redesign"],
        },
        { status: 409 },
      );
    }

    // Fire feedback loop (non-blocking)
    propagateDecisionChange(sessionId, "status_changed", decisionId).catch(() => {});
    if (session) {
      const packet = buildGenericAuthorityPacket({
        stage: "strategy_room",
        condition: session.coreProblem || "Strategy Room execution status",
        contradiction: status === "blocked"
          ? "Execution decision is blocked; the intervention path has hit a constraint."
          : "Execution decision status changed; the system records movement against the intervention path.",
        decisionText: log.decision,
        constraintText: status === "blocked" ? notes || session.constraints || session.constraintMap || null : session.constraints || null,
        costOfDelayText: status === "blocked" ? "Blocked execution extends the cost of delay." : session.conditionSummary || null,
        stakeholderText: session.email || null,
        firstMove: status === "blocked"
          ? "Name the blocking constraint and assign an owner to remove it."
          : "Verify the executed decision changed the condition it was meant to affect.",
        skippedConsequence: status === "blocked"
          ? "The intervention stalls at the exact point where authority or resources must move."
          : "Execution may become theatre if the effect is not verified.",
        escalationCondition: status === "blocked"
          ? "Escalate if the block remains unresolved after the next execution checkpoint."
          : "Move to monitoring once the effect is verified.",
        riskScore: status === "blocked" ? 84 : 46,
        formula: "strategy room status risk baseline",
        reasoning: [
          `Decision status: ${status || log.status}`,
          session.coreProblem ? `Core problem: ${session.coreProblem}` : "",
        ].filter(Boolean),
        confidence: 0.76,
        payload: { sessionId, decisionLogId: log.id, decisionObjectId: log.decisionObjectId, status: status || log.status },
      });
      persistDiagnosticStage({
        email: session.email,
        subjectId: session.sessionKey,
        stage: "strategy_room",
        payload: { decisionLogId: log.id, decision: log.decision, status: status || log.status, notes: notes ?? null },
        tensions: packet.nodes.filter((node) => node.kind === "contradiction").map((node) => node.label),
        routeDecision: { decisionLogId: log.id, status: status || log.status },
        evidenceNodes: packet.nodes,
        decisionObject: packet.decisionObject,
      }).catch(() => {});
    }

    // Evaluate system state after status change
    const allDecisions = await prisma.strategyDecisionLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
    const executionState: SessionExecutionState = {
      sessionId,
      systemState: (session?.status as any) || "PENDING",
      actions: allDecisions.map((d) => ({
        id: d.id,
        text: d.decision,
        status: (d.status as any) || "PENDING",
        deadline: computeDefaultDeadline("near_term"),
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        blockReason: d.notes,
        avoidanceCount: 0,
      })),
      escalationTriggers: [],
      consequenceScore: 0,
      lastEscalationCheck: new Date().toISOString(),
      avoidancePatterns: [],
      directive: null,
    };
    const transition = evaluateStateTransition(executionState);
    const consequence = computeDynamicConsequence(executionState);

    // Update session status if escalated
    if (session && transition.newState !== session.status) {
      await prisma.strategyRoomExecutionSession.update({
        where: { id: sessionId },
        data: { status: transition.newState },
      }).catch(() => {});
    }

    const decisionSurface = buildDecisionSurfacePayload({
      decisionId: log.decisionObjectId,
      contradictions: session
        ? [{
            label: status === "blocked" ? "Execution blocked" : "Execution status changed",
            summary: status === "blocked"
              ? "Execution decision is blocked; the intervention path has hit a constraint."
              : "Execution decision status changed; the system records movement against the intervention path.",
            severity: status === "blocked" ? "high" : "medium",
            confidence: 0.76,
            sourceStage: "strategy_room",
          }]
        : [{
            label: "Strategy Room session missing",
            summary: "The decision log exists but the execution session could not be resolved.",
            severity: "high",
            confidence: 0.7,
            sourceStage: "strategy_room",
          }],
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

    return NextResponse.json({
      ok: true,
      decision: log,
      decisionSurface,
      decisionSurfacePayload: decisionSurface,
      systemState: transition.newState,
      consequence,
      directive: transition.directive,
      avoidancePattern: transition.avoidancePattern,
    });
  } catch (err) {
    console.error("[decision-log-update]", err);
    return NextResponse.json(
      { error: "Failed to update decision" },
      { status: 500 },
    );
  }
}

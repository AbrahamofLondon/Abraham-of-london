import { NextResponse } from "next/server";
import type { SafeParseReturnType } from "zod";

import { prisma } from "@/lib/prisma";
import { buildGenericAuthorityPacket } from "@/lib/diagnostics/evidence-graph";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import { classifyAIDecisionRisk } from "@/lib/diagnostics/ai-decision-risk";
import {
  canonicalDecisionObjectSchema,
  evidenceNodeSchema,
  evidenceSourceStageSchema,
  formatZodError,
  instrumentEvidenceSchema,
} from "@/lib/diagnostics/runtime-validation";
import type {
  CanonicalDecisionObject,
  DiagnosticEvidenceNodeInput,
  EvidenceSourceStage,
} from "@/lib/diagnostics/evidence-graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function ensureDecisionExists(decisionObjectId: string, email?: string | null, subjectId?: string | null) {
  const decision = await prisma.diagnosticDecisionObject.findUnique({
    where: { id: decisionObjectId },
    select: { id: true, email: true, sessionId: true },
  });
  if (!decision) return false;
  if (email && decision.email && decision.email.toLowerCase() !== email.toLowerCase()) return false;
  if (subjectId && decision.sessionId && decision.sessionId !== subjectId) return false;
  return true;
}

function decisionObjectFrom(value: unknown): CanonicalDecisionObject | null {
  const parsed = canonicalDecisionObjectSchema.safeParse(value);
  if (!parsed.success) return null;
  const base = parsed.data;
  const aiRisk = classifyAIDecisionRisk({
    decisionText: base.decisionText,
    constraintText: base.constraintText ?? null,
    priorAttemptText: base.priorAttemptText ?? null,
    costOfDelayText: base.costOfDelayText ?? null,
    affectedDomain: base.affectedDomain ?? null,
    aiExposureLevel: base.aiExposureLevel ?? null,
    aiDisplacementRisk: base.aiDisplacementRisk ?? false,
    decisionVelocityScore: base.decisionVelocityScore ?? null,
  });

  return {
    ...base,
    aiExposureLevel: aiRisk.aiExposureLevel,
    aiDisplacementRisk: aiRisk.aiDisplacementRisk,
    decisionVelocityScore: aiRisk.decisionVelocityScore,
    aiRiskClassification: aiRisk.classification,
  };
}

function instrumentNodeFrom(value: unknown): DiagnosticEvidenceNodeInput | null {
  const parsed = instrumentEvidenceSchema.safeParse(value);
  if (!parsed.success) return null;
  const severity =
    parsed.data.severity >= 85 ? "critical" :
    parsed.data.severity >= 70 ? "high" :
    parsed.data.severity >= 40 ? "medium" :
    "low";
  const kind: DiagnosticEvidenceNodeInput["kind"] =
    parsed.data.type === "CONTRADICTION" || parsed.data.severity >= 70
      ? "contradiction"
      : "action";
  return {
    sourceStage: "instrument",
    kind,
    label: kind === "contradiction" ? "Instrument contradiction" : "Instrument action",
    summary:
      parsed.data.summary ||
      (kind === "contradiction"
        ? "Decision stage recorded a high-severity contradiction."
        : "Decision stage recorded an action signal."),
    evidenceText: parsed.data.evidenceText ?? null,
    confidence: parsed.data.confidence ?? 0.65,
    severity,
    payload: {
      decisionId: parsed.data.decisionId,
      source: "instrument",
      type: parsed.data.type,
      severity: parsed.data.severity,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const instrumentNode = instrumentNodeFrom(body);
    const requestedStage = instrumentNode ? "instrument" : s(body?.stage);
    const stageParsed = evidenceSourceStageSchema.safeParse(requestedStage);

    if (!stageParsed.success) {
      return NextResponse.json({ ok: false, error: "stage is required" }, { status: 400 });
    }

    const stage = stageParsed.data as EvidenceSourceStage;
    const email = s(body?.email).toLowerCase() || null;
    const subjectId = s(body?.subjectId) || s(body?.sessionId) || null;
    const explicitDecisionId = instrumentNode
      ? String(instrumentNode.payload?.decisionId || "")
      : s(body?.decisionObjectId) || null;

    if (explicitDecisionId) {
      const validDecision = await ensureDecisionExists(explicitDecisionId, email, subjectId);
      if (!validDecision) {
        return NextResponse.json(
          { ok: false, error: "decisionObjectId failed ownership or existence validation" },
          { status: 400 },
        );
      }
    }

    const authorityInput = isObject(body?.authorityInput) ? body.authorityInput : null;
    const generatedPacket = authorityInput
      ? buildGenericAuthorityPacket({
          stage,
          condition: s(authorityInput.condition, "Diagnostic condition"),
          contradiction: s(authorityInput.contradiction, "Contradiction evidence recorded."),
          decisionText: s(authorityInput.decisionText) || null,
          constraintText: s(authorityInput.constraintText) || null,
          priorAttemptText: s(authorityInput.priorAttemptText) || null,
          costOfDelayText: s(authorityInput.costOfDelayText) || null,
          stakeholderText: s(authorityInput.stakeholderText) || null,
          affectedDomain: s(authorityInput.affectedDomain) || null,
          firstMove: s(authorityInput.firstMove, "Name the first corrective move and owner."),
          skippedConsequence: s(authorityInput.skippedConsequence, "The condition remains unpriced and unmanaged."),
          escalationCondition: s(authorityInput.escalationCondition, "Escalate if the contradiction repeats in the next stage."),
          riskScore: typeof authorityInput.riskScore === "number" ? authorityInput.riskScore : 50,
          formula: s(authorityInput.formula, "stage risk score"),
          reasoning: Array.isArray(authorityInput.reasoning)
            ? authorityInput.reasoning.map(String).filter(Boolean)
            : [],
          confidence: typeof authorityInput.confidence === "number" ? authorityInput.confidence : 0.65,
          payload: isObject(authorityInput.payload) ? authorityInput.payload : undefined,
        })
      : null;

    const parsedNodes = Array.isArray(body?.evidenceNodes)
      ? body.evidenceNodes
          .map((node: unknown): SafeParseReturnType<unknown, DiagnosticEvidenceNodeInput> => evidenceNodeSchema.safeParse(node))
          .filter((result: SafeParseReturnType<unknown, DiagnosticEvidenceNodeInput>): result is { success: true; data: DiagnosticEvidenceNodeInput } => result.success)
          .map((result: { success: true; data: DiagnosticEvidenceNodeInput }) => result.data)
      : [];
    const nodes = instrumentNode ? [instrumentNode] : generatedPacket?.nodes ?? parsedNodes;
    const decisionObject = generatedPacket?.decisionObject ?? decisionObjectFrom(body?.decisionObject);

    if (Array.isArray(body?.evidenceNodes) && parsedNodes.length !== body.evidenceNodes.length) {
      return NextResponse.json(
        { ok: false, error: "One or more evidence nodes failed validation." },
        { status: 400 },
      );
    }

    if (!nodes.length && !decisionObject) {
      return NextResponse.json(
        { ok: false, error: "evidenceNodes or decisionObject is required" },
        { status: 400 },
      );
    }

    const journey = await persistDiagnosticStage({
      email,
      subjectId,
      campaignId: s(body?.campaignId) || null,
      organisation: s(body?.organisation) || null,
      stage,
      payload: isObject(body?.payload)
        ? body.payload
        : instrumentNode
          ? { stage, decisionId: explicitDecisionId, source: "instrument" }
          : { stage },
      tensions: nodes
        .filter((node: DiagnosticEvidenceNodeInput) => node.kind === "contradiction")
        .map((node: DiagnosticEvidenceNodeInput) => node.label),
      routeDecision: body?.routeDecision ?? null,
      escalationEvent: body?.escalationEvent ?? null,
      evidenceNodes: nodes,
      decisionObject,
    });

    return NextResponse.json({
      ok: true,
      journeyKey: journey.journeyKey,
      evidenceNodeCount: nodes.length,
      decisionObjectRecorded: Boolean(decisionObject),
      deprecated: {
        type: "Use evidenceNodes[].kind; type remains accepted for decision-stage compatibility.",
        source: "Use sourceStage; source remains accepted for decision-stage compatibility.",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { ok: false, error: formatZodError(error as any) },
        { status: 400 },
      );
    }
    console.error("[DIAGNOSTIC_EVIDENCE_POST_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to persist diagnostic evidence." },
      { status: 500 },
    );
  }
}

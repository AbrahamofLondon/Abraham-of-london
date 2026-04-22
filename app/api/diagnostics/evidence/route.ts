import { NextResponse } from "next/server";

import { buildGenericAuthorityPacket } from "@/lib/diagnostics/evidence-graph";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
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

function nodeFrom(value: unknown): DiagnosticEvidenceNodeInput | null {
  if (!isObject(value)) return null;
  const sourceStage = s(value.sourceStage) as EvidenceSourceStage;
  const kind = s(value.kind) as DiagnosticEvidenceNodeInput["kind"];
  const label = s(value.label);
  const summary = s(value.summary);
  if (!sourceStage || !kind || !label || !summary) return null;
  const confidence = typeof value.confidence === "number" ? value.confidence : 0.5;
  return {
    sourceStage,
    kind,
    label,
    summary,
    evidenceText: s(value.evidenceText) || null,
    confidence: Math.max(0, Math.min(1, confidence)),
    severity: s(value.severity, "medium") as DiagnosticEvidenceNodeInput["severity"],
    payload: isObject(value.payload) ? value.payload : null,
  };
}

function decisionObjectFrom(value: unknown): CanonicalDecisionObject | null {
  if (!isObject(value)) return null;
  const decisionText = s(value.decisionText);
  const sourceStage = s(value.sourceStage) as EvidenceSourceStage;
  const decisionKey = s(value.decisionKey);
  if (!decisionText || !sourceStage || !decisionKey) return null;
  return {
    sourceStage,
    decisionKey,
    decisionText,
    constraintText: s(value.constraintText) || null,
    priorAttemptText: s(value.priorAttemptText) || null,
    costOfDelayText: s(value.costOfDelayText) || null,
    stakeholderText: s(value.stakeholderText) || null,
    affectedDomain: s(value.affectedDomain) || null,
    confidence: typeof value.confidence === "number" ? value.confidence : 0.5,
    normalized: isObject(value.normalized)
      ? value.normalized as CanonicalDecisionObject["normalized"]
      : {
          avoidedOrFaced: Boolean(decisionText),
          hasConstraint: Boolean(s(value.constraintText)),
          hasPriorAttempt: Boolean(s(value.priorAttemptText)),
          hasDelayCost: Boolean(s(value.costOfDelayText)),
          hasStakeholder: Boolean(s(value.stakeholderText) || s(value.affectedDomain)),
          extractedAt: new Date().toISOString(),
        },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stage = s(body?.stage) as EvidenceSourceStage;
    if (!stage) {
      return NextResponse.json({ ok: false, error: "stage is required" }, { status: 400 });
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

    const nodes = generatedPacket?.nodes ?? (Array.isArray(body?.evidenceNodes)
      ? body.evidenceNodes.map(nodeFrom).filter(Boolean) as DiagnosticEvidenceNodeInput[]
      : []);
    const decisionObject = generatedPacket?.decisionObject ?? decisionObjectFrom(body?.decisionObject);

    if (!nodes.length && !decisionObject) {
      return NextResponse.json(
        { ok: false, error: "evidenceNodes or decisionObject is required" },
        { status: 400 },
      );
    }

    const journey = await persistDiagnosticStage({
      email: s(body?.email).toLowerCase() || null,
      subjectId: s(body?.subjectId) || s(body?.sessionId) || null,
      campaignId: s(body?.campaignId) || null,
      organisation: s(body?.organisation) || null,
      stage: stage as Parameters<typeof persistDiagnosticStage>[0]["stage"],
      payload: isObject(body?.payload) ? body.payload : { stage },
      tensions: nodes
        .filter((node) => node.kind === "contradiction")
        .map((node) => node.label),
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
    });
  } catch (error) {
    console.error("[DIAGNOSTIC_EVIDENCE_POST_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to persist diagnostic evidence." },
      { status: 500 },
    );
  }
}

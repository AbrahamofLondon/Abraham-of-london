import { prisma } from "@/lib/prisma";
import type { DiagnosticEvidenceNodeInput } from "@/lib/diagnostics/evidence-graph";
import {
  classifyOutcome,
  normalizeOutcomeSnapshot,
  type OutcomeSnapshot,
} from "@/lib/outcomes/outcome-model";

export type OutcomeVerificationInput = {
  baseline: OutcomeSnapshot;
  followUp: OutcomeSnapshot;
  baselineJourneyId?: string | null;
  followUpJourneyId?: string | null;
  decisionObjectId?: string | null;
  interventionPath?: string[] | null;
  unresolvedContradictions?: string[] | null;
  organisationKey?: string | null;
  persist?: boolean;
};

export type OutcomeVerificationResult = {
  outcomeClassification: OutcomeSnapshot["outcomeClassification"];
  magnitudeOfChange: number;
  unresolvedContradictionPersistence: string[];
  interventionEffectivenessScore: number;
  evidenceNodes: DiagnosticEvidenceNodeInput[];
  normalized: OutcomeSnapshot;
};

function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value * 100) / 100));
}

function classificationEffect(outcome: OutcomeSnapshot["outcomeClassification"]): number {
  switch (outcome) {
    case "resolved": return 90;
    case "improved": return 68;
    case "stable": return 42;
    case "deteriorated": return 12;
    default: return 0;
  }
}

function evidenceKindFor(outcome: OutcomeSnapshot["outcomeClassification"]): DiagnosticEvidenceNodeInput["kind"] {
  if (outcome === "resolved") return "resolved_condition";
  if (outcome === "improved") return "partial_resolution";
  if (outcome === "deteriorated") return "persistent_root_cause";
  return "outcome_delta";
}

export function verifyOutcomeMovement(input: OutcomeVerificationInput): OutcomeVerificationResult {
  const normalized = normalizeOutcomeSnapshot({
    ...input.followUp,
    baseline: input.baseline.baseline,
    followUp: input.followUp.followUp,
  });
  const outcomeClassification = classifyOutcome(normalized);
  const unresolved = input.unresolvedContradictions || [];
  const magnitudeOfChange = clamp(
    Math.abs(normalized.delta.dissonanceChange) +
      Math.abs(normalized.delta.burnoutChange) +
      Math.abs(normalized.delta.certaintyChange),
  );
  const contradictionPenalty = Math.min(30, unresolved.length * 10);
  const interventionEffectivenessScore = clamp(
    classificationEffect(outcomeClassification) +
      Math.max(0, -normalized.delta.dissonanceChange) * 0.4 +
      Math.max(0, normalized.delta.certaintyChange) * 0.3 -
      contradictionPenalty,
  );

  const evidenceNodes: DiagnosticEvidenceNodeInput[] = [
    {
      sourceStage: "monitoring",
      kind: "outcome_delta",
      label: "Outcome movement delta",
      summary: `${outcomeClassification} outcome recorded with ${magnitudeOfChange} magnitude.`,
      evidenceText: `Dissonance ${normalized.delta.dissonanceChange}; burnout ${normalized.delta.burnoutChange}; certainty ${normalized.delta.certaintyChange}.`,
      confidence: outcomeClassification === "invalid" ? 0.2 : 0.84,
      severity: outcomeClassification === "deteriorated" ? "high" : outcomeClassification === "resolved" ? "low" : "medium",
      payload: {
        outcomeClassification,
        magnitudeOfChange,
        delta: normalized.delta,
      },
    },
    {
      sourceStage: "monitoring",
      kind: "intervention_effectiveness",
      label: "Intervention effectiveness",
      summary: `Effectiveness score: ${interventionEffectivenessScore}.`,
      confidence: outcomeClassification === "invalid" ? 0.25 : 0.78,
      severity: interventionEffectivenessScore < 35 ? "high" : "medium",
      payload: {
        interventionEffectivenessScore,
        interventionPath: input.interventionPath || [],
      },
    },
    {
      sourceStage: "monitoring",
      kind: evidenceKindFor(outcomeClassification),
      label:
        unresolved.length > 0
          ? "Persistent contradiction remains"
          : outcomeClassification === "resolved"
            ? "Condition resolved"
            : "Outcome state verified",
      summary:
        unresolved.length > 0
          ? `Persistent contradictions: ${unresolved.slice(0, 3).join("; ")}.`
          : `Outcome classified as ${outcomeClassification}.`,
      confidence: outcomeClassification === "invalid" ? 0.2 : 0.76,
      severity: unresolved.length > 0 ? "high" : "low",
      payload: {
        unresolvedContradictions: unresolved,
        outcomeClassification,
      },
    },
  ];

  return {
    outcomeClassification,
    magnitudeOfChange,
    unresolvedContradictionPersistence: unresolved,
    interventionEffectivenessScore,
    evidenceNodes,
    normalized,
  };
}

export async function verifyAndPersistOutcome(
  input: OutcomeVerificationInput,
): Promise<OutcomeVerificationResult> {
  const result = verifyOutcomeMovement(input);
  if (!input.persist) return result;

  const p = prisma as any;
  if (p.outcomeVerificationRecord?.create) {
    await p.outcomeVerificationRecord.create({
      data: {
        baselineJourneyId: input.baselineJourneyId || null,
        followUpJourneyId: input.followUpJourneyId || null,
        decisionObjectId: input.decisionObjectId || null,
        sessionId: result.normalized.sessionId,
        organisationKey: input.organisationKey || result.normalized.organisation || null,
        outcomeClassification: result.outcomeClassification,
        magnitudeOfChange: result.magnitudeOfChange,
        effectivenessScore: result.interventionEffectivenessScore,
        decisionVelocityDelta: Number((result.normalized as any)?.decisionVelocityDelta ?? result.magnitudeOfChange ?? 0),
        aiCapabilityShift: Number((result.normalized as any)?.aiCapabilityShift ?? 0),
        unresolvedContradictions: result.unresolvedContradictionPersistence,
        payload: result.normalized,
        evidenceNodes: result.evidenceNodes,
      },
    });
  }

  if (p.diagnosticEvidenceNode?.createMany) {
    await p.diagnosticEvidenceNode.createMany({
      data: result.evidenceNodes.map((node) => ({
        journeyId: input.followUpJourneyId || input.baselineJourneyId || null,
        sessionId: result.normalized.sessionId,
        email: null,
        sourceStage: node.sourceStage,
        kind: node.kind,
        label: node.label,
        summary: node.summary,
        evidenceText: node.evidenceText || null,
        confidence: node.confidence,
        severity: node.severity,
        payload: node.payload || null,
      })),
    }).catch(() => null);
  }

  return result;
}

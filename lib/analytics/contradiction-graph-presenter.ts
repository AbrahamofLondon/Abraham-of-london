import type { LivingCase } from "@/lib/product/living-case-store";
import type { IntelligenceMeta, IntelligenceScope } from "@/lib/product/intelligence-contract";
import { defaultIntelligenceMeta } from "@/lib/product/intelligence-contract";
import { createFieldProvenance } from "@/lib/product/field-provenance-contract";

export type ContradictionMapView = {
  activeContradictions: Array<{
    id: string;
    label: string;
    plainEnglish: string;
    severityBand: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    ageDays?: number | null;
    capturedAt?: string | null;
    lastSeenAt?: string | null;
    trend: "NEW" | "STABLE" | "WORSENING" | "REDUCING" | "UNKNOWN";
    relatedSignals: string[];
    sourceSurfaces: string[];
    sourceLabel: string;
    evidencePosture: "USER_REPORTED" | "SYSTEM_INFERRED" | "OPERATOR_REVIEWED" | "OUTCOME_VERIFIED" | "ESTIMATED" | "SUPPRESSED" | "INSUFFICIENT_DATA";
    confidenceLabel: "REPORTED" | "INFERRED" | "REVIEWED" | "VERIFIED" | "ESTIMATED" | "UNAVAILABLE";
    currentStatus: string;
    suggestedNextAction?: string;
    safeToDisplay: boolean;
    suppressionReason?: string;
  }>;
  headline: string;
  warning?: string;
  asOf: string;
  meta: IntelligenceMeta;
};
import {
  detectActiveConflicts,
  type ContradictionGraph,
} from "@/lib/engine/contradiction-graph";

function daysBetween(from?: string | null, to: string = new Date().toISOString()): number | null {
  if (!from) return null;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return null;
  return Math.max(0, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000));
}

function severityBand(severity: string | number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (typeof severity === "number") {
    if (severity >= 8) return "CRITICAL";
    if (severity >= 6) return "HIGH";
    if (severity >= 3) return "MEDIUM";
    return "LOW";
  }
  const normalized = severity.toLowerCase();
  if (normalized === "critical") return "CRITICAL";
  if (normalized === "high") return "HIGH";
  if (normalized === "medium" || normalized === "moderate") return "MEDIUM";
  return "LOW";
}

export function buildContradictionMapView(input: {
  scope: IntelligenceScope;
  livingCase?: LivingCase | null;
  graph?: ContradictionGraph | null;
  createdAt?: string | null;
  generatedAt?: string;
  nextAction?: string | null;
}): ContradictionMapView | null {
  const items: ContradictionMapView["activeContradictions"] = [];
  const asOf = input.generatedAt ?? new Date().toISOString();

  if (input.graph) {
    for (const conflict of detectActiveConflicts(input.graph)) {
      items.push({
        id: `${conflict.nodeA.id}:${conflict.nodeB.id}`,
        label: `${conflict.nodeA.label} / ${conflict.nodeB.label}`,
        plainEnglish: conflict.explanation,
        severityBand: severityBand(conflict.combinedSeverity),
        ageDays: daysBetween(conflict.nodeA.createdAt),
        capturedAt: conflict.nodeA.createdAt ?? null,
        lastSeenAt: asOf,
        trend: conflict.blocksDecision ? "WORSENING" : "STABLE",
        relatedSignals: [conflict.nodeA.label, conflict.nodeB.label],
        sourceSurfaces: [conflict.nodeA.source, conflict.nodeB.source],
        sourceLabel: "Recorded contradiction signals",
        evidencePosture: "SYSTEM_INFERRED",
        confidenceLabel: "INFERRED",
        currentStatus: "Active contradiction",
        suggestedNextAction: input.nextAction ?? undefined,
        safeToDisplay: true,
      });
    }
  } else if (input.livingCase) {
    const repeated = input.livingCase.contradictions.length >= 2;
    for (const contradiction of input.livingCase.contradictions) {
      items.push({
        id: `${contradiction.sourceStage}:${contradiction.label}`,
        label: contradiction.label,
        plainEnglish: contradiction.summary,
        severityBand: severityBand(contradiction.severity),
        ageDays: daysBetween(input.createdAt ?? input.livingCase.createdAt),
        capturedAt: input.createdAt ?? input.livingCase.createdAt,
        lastSeenAt: asOf,
        trend: repeated ? "WORSENING" : "NEW",
        relatedSignals: [contradiction.label],
        sourceSurfaces: [contradiction.sourceStage],
        sourceLabel: contradiction.sourceStage.replace(/_/g, " "),
        evidencePosture: contradiction.sourceStage === "outcome_verification" ? "OUTCOME_VERIFIED" : "SYSTEM_INFERRED",
        confidenceLabel: contradiction.sourceStage === "outcome_verification" ? "VERIFIED" : "INFERRED",
        currentStatus: "Unresolved",
        suggestedNextAction: input.nextAction ?? undefined,
        safeToDisplay: true,
      });
    }
  }

  if (items.length === 0) return null;

  return {
    activeContradictions: items,
    headline: items.length === 1
      ? "One active contradiction is currently shaping this case."
      : `${items.length} active contradictions are currently shaping this case.`,
    warning: items.some((item) => item.severityBand === "CRITICAL")
      ? "Critical contradictions are active. This map describes the conflict in plain language."
      : undefined,
    asOf,
    meta: defaultIntelligenceMeta({
      scope: input.scope,
      sourceLabel: "Contradiction map",
      sourceSurfaces: [...new Set(items.flatMap((item) => item.sourceSurfaces))],
      generatedAt: asOf,
      capturedAt: items[0]?.capturedAt ?? input.createdAt ?? null,
      evidencePosture: items.some((item) => item.evidencePosture === "OUTCOME_VERIFIED") ? "OUTCOME_VERIFIED" : "SYSTEM_INFERRED",
      confidenceLabel: items.some((item) => item.confidenceLabel === "VERIFIED") ? "VERIFIED" : "INFERRED",
      dataQuality: items.length >= 2 ? "MATURE" : "THIN",
      evidenceBasis: "The system detected tension between recorded signals.",
      meaning: "Shows unresolved tension between recorded signals without exposing graph mechanics.",
      limitation: "This map does not prove causation or closure.",
      nextAction: input.nextAction ?? "Resolve the contradiction through the next governed action.",
      provenance: items.map((item) =>
        createFieldProvenance({
          fieldKey: item.id,
          sourceSurface: item.sourceSurfaces[0] || "DECISION_CENTRE",
          sourceLabel: item.sourceLabel,
          capturedAt: item.capturedAt ?? null,
          caseId: input.scope.caseId ?? null,
          journeyId: input.scope.journeyId ?? null,
          strategyRoomSessionId: input.scope.strategyRoomSessionId ?? null,
          executiveRunId: input.scope.executiveRunId ?? null,
          scopeType: input.scope.scopeType,
          scopeId: input.scope.caseId ?? input.scope.journeyId ?? input.scope.strategyRoomSessionId ?? input.scope.executiveRunId ?? null,
          evidencePosture: item.evidencePosture,
          confidenceLabel: item.confidenceLabel,
          comparisonBasis: item.capturedAt && item.lastSeenAt ? "CURRENT_VS_PRIOR" : item.capturedAt ? "BASELINE_ONLY" : "THIN_STATE",
          priorValueDate: item.capturedAt ?? null,
          currentValueDate: item.lastSeenAt ?? null,
        }),
      ),
      comparisonBasis: items.some((item) => item.capturedAt && item.lastSeenAt) ? "CURRENT_VS_PRIOR" : items.some((item) => item.capturedAt) ? "BASELINE_ONLY" : "THIN_STATE",
    }),
  };
}

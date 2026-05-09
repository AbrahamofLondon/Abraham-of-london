import type { LivingCase } from "@/lib/product/living-case-store";

export type ContradictionMapView = {
  activeContradictions: Array<{
    id: string;
    label: string;
    plainEnglish: string;
    severityBand: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    ageDays?: number | null;
    trend: "NEW" | "STABLE" | "WORSENING" | "REDUCING" | "UNKNOWN";
    relatedSignals: string[];
    sourceSurfaces: string[];
    safeToDisplay: boolean;
    suppressionReason?: string;
  }>;
  headline: string;
  warning?: string;
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
  livingCase?: LivingCase | null;
  graph?: ContradictionGraph | null;
  createdAt?: string | null;
}): ContradictionMapView | null {
  const items: ContradictionMapView["activeContradictions"] = [];

  if (input.graph) {
    for (const conflict of detectActiveConflicts(input.graph)) {
      items.push({
        id: `${conflict.nodeA.id}:${conflict.nodeB.id}`,
        label: `${conflict.nodeA.label} / ${conflict.nodeB.label}`,
        plainEnglish: conflict.explanation,
        severityBand: severityBand(conflict.combinedSeverity),
        ageDays: daysBetween(conflict.nodeA.createdAt),
        trend: conflict.blocksDecision ? "WORSENING" : "STABLE",
        relatedSignals: [conflict.nodeA.label, conflict.nodeB.label],
        sourceSurfaces: [conflict.nodeA.source, conflict.nodeB.source],
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
        trend: repeated ? "WORSENING" : "NEW",
        relatedSignals: [contradiction.label],
        sourceSurfaces: [contradiction.sourceStage],
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
  };
}

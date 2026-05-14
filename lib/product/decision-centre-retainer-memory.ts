import type { DecisionCentreRetainerMemoryPreview } from "@/lib/product/decision-centre-contract";
import type { RetainerCycleMemorySummary } from "@/lib/product/retainer-cycle-memory-contract";

export function toDecisionCentreRetainerMemoryPreview(
  memory?: RetainerCycleMemorySummary | null,
): DecisionCentreRetainerMemoryPreview | null {
  if (!memory) return null;

  return {
    status: memory.status,
    escalationLevel: memory.escalationLevel,
    escalationRequired: memory.escalationRequired,
    summary: memory.summary,
    findings: memory.findings.slice(0, 3).map((finding) => ({
      status: finding.status,
      severity: finding.severity,
      signalKey: finding.signalKey,
      source: finding.source ?? null,
      sourceLabel: finding.sourceLabel ?? null,
      explanation: finding.explanation,
      recommendedAction: finding.recommendedAction,
    })),
  };
}

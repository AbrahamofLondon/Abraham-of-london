/**
 * Strategic Priority Stack Builder — governed instrument engine.
 *
 * Takes up to 6 competing priorities and ranks them by governed composite
 * of importance, urgency, resource demand, consequence, and authority.
 *
 * Deterministic. Same input → same output.
 */
import { evaluateDecision, type DecisionKernelOutput } from "@/lib/decision/kernel";

export type PriorityItem = {
  label: string;
  strategicImportance: number; // 0-10
  urgency: number; // 0-10
  resourceDemand: number; // 0-10
  consequenceIfDelayed: number; // 0-10
  authorityClarity: number; // 0-10
};

export type RankedPriority = PriorityItem & {
  rank: number;
  compositeScore: number;
  deferralRisk: string;
};

export type PriorityConflict = {
  priorityA: string;
  priorityB: string;
  conflictType: "RESOURCE_COMPETITION" | "AUTHORITY_OVERLAP" | "URGENCY_COLLISION";
  explanation: string;
};

export type PriorityStackResult = {
  stack: RankedPriority[];
  conflicts: PriorityConflict[];
  resourcePressureBand: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  sequencingRecommendation: string;
  deferredRiskWarning: string | null;
  recommendation: string;
  decisionKernel: DecisionKernelOutput;
  deterministic: true;
  version: "1.0";
};

function clamp(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v)));
}

export function buildPriorityStack(priorities: PriorityItem[]): PriorityStackResult {
  if (priorities.length === 0) {
    return emptyResult();
  }

  // Score each priority
  const scored: RankedPriority[] = priorities.map((p) => {
    const importance = clamp(p.strategicImportance);
    const urgency = clamp(p.urgency);
    const resource = clamp(p.resourceDemand);
    const consequence = clamp(p.consequenceIfDelayed);
    const authority = clamp(p.authorityClarity);

    const composite = Math.round(
      importance * 0.30 + urgency * 0.25 + consequence * 0.25 + authority * 0.10 + (10 - resource) * 0.10,
    );

    const deferralRisk = consequence >= 7
      ? "Deferring this priority carries high consequence risk."
      : consequence >= 4
        ? "Deferral is possible but consequence accumulates."
        : "Low deferral risk at current evidence level.";

    return { ...p, rank: 0, compositeScore: composite, deferralRisk };
  });

  // Sort by composite descending
  scored.sort((a, b) => b.compositeScore - a.compositeScore);
  scored.forEach((item, i) => { item.rank = i + 1; });

  // Detect conflicts
  const conflicts: PriorityConflict[] = [];
  for (let i = 0; i < scored.length; i++) {
    for (let j = i + 1; j < scored.length; j++) {
      const a = scored[i]!;
      const b = scored[j]!;

      if (a.resourceDemand >= 7 && b.resourceDemand >= 7) {
        conflicts.push({
          priorityA: a.label,
          priorityB: b.label,
          conflictType: "RESOURCE_COMPETITION",
          explanation: `Both "${a.label}" and "${b.label}" demand high resources. Running both simultaneously risks under-resourcing at least one.`,
        });
      }
      if (a.urgency >= 7 && b.urgency >= 7 && Math.abs(a.compositeScore - b.compositeScore) <= 2) {
        conflicts.push({
          priorityA: a.label,
          priorityB: b.label,
          conflictType: "URGENCY_COLLISION",
          explanation: `Both priorities are urgent and similarly scored. A sequencing decision is required — the system cannot recommend both simultaneously.`,
        });
      }
    }
  }

  // Resource pressure
  const avgResource = scored.reduce((s, p) => s + clamp(p.resourceDemand), 0) / scored.length;
  const resourcePressureBand: PriorityStackResult["resourcePressureBand"] =
    avgResource >= 8 ? "CRITICAL" : avgResource >= 6 ? "HIGH" : avgResource >= 4 ? "MODERATE" : "LOW";

  // Sequencing recommendation
  const top = scored[0]!;
  const sequencingRecommendation = conflicts.length > 0
    ? `${conflicts.length} priority conflict${conflicts.length !== 1 ? "s" : ""} detected. Resolve resource and urgency collisions before committing to execution sequence.`
    : scored.length <= 2
      ? `Execute "${top.label}" first. Resource pressure is ${resourcePressureBand.toLowerCase()}.`
      : `Execute "${top.label}" first, then "${scored[1]!.label}". Consider deferring items ranked 3+ unless resource pressure eases.`;

  // Deferred risk
  const deferredItems = scored.filter((p) => p.rank > 2 && p.consequenceIfDelayed >= 6);
  const deferredRiskWarning = deferredItems.length > 0
    ? `${deferredItems.length} deferred priorit${deferredItems.length !== 1 ? "ies carry" : "y carries"} high consequence risk: ${deferredItems.map((p) => p.label).join(", ")}.`
    : null;

  const recommendation = conflicts.length >= 2
    ? `Priority stack has ${conflicts.length} conflicts. This is not a sequencing problem — it is a resource/authority conflict that requires executive resolution before execution.`
    : resourcePressureBand === "CRITICAL"
      ? "Resource pressure is critical across all priorities. Reduce the stack or secure additional resources before execution."
      : `Priority stack is ${conflicts.length === 0 ? "conflict-free" : "manageable"}. ${sequencingRecommendation}`;

  const decisionKernel = evaluateDecision({
    id: `priority-stack:${scored.length}`,
    source: conflicts.length >= 2 ? "strategy_room" : "executive_reporting",
    condition: `${scored.length} competing priorities with ${conflicts.length} conflict${conflicts.length !== 1 ? "s" : ""}`,
    decisionRequired: recommendation,
    evidenceChain: scored.map((p) => ({
      inputSource: "strategic_priority_stack",
      observedPattern: `"${p.label}" scored ${p.compositeScore}/10 composite`,
      weight: 1 / scored.length,
      explanation: "Priority stack builder ranks competing priorities by governed composite.",
    })),
    internalContradictions: conflicts.map((c) => c.explanation),
    scores: Object.fromEntries(scored.map((p) => [p.label, p.compositeScore])),
    signalStrength: conflicts.length >= 2 ? "STRONG" : conflicts.length >= 1 ? "MODERATE" : "WEAK",
    sources: [{ type: "system_computed" as const, count: 1 }],
    expectedOutcome: sequencingRecommendation,
  });

  return {
    stack: scored,
    conflicts,
    resourcePressureBand,
    sequencingRecommendation,
    deferredRiskWarning,
    recommendation,
    decisionKernel,
    deterministic: true,
    version: "1.0",
  };
}

function emptyResult(): PriorityStackResult {
  const decisionKernel = evaluateDecision({
    id: "priority-stack:empty",
    source: "executive_reporting",
    condition: "no priorities provided",
    decisionRequired: "Add at least one priority to build a governed stack.",
    evidenceChain: [],
    internalContradictions: [],
    scores: {},
    signalStrength: "WEAK",
    sources: [{ type: "system_computed" as const, count: 0 }],
  });

  return {
    stack: [],
    conflicts: [],
    resourcePressureBand: "LOW",
    sequencingRecommendation: "Add priorities to generate a governed sequencing recommendation.",
    deferredRiskWarning: null,
    recommendation: "No priorities provided. Add at least two competing priorities to produce a governed stack.",
    decisionKernel,
    deterministic: true,
    version: "1.0",
  };
}

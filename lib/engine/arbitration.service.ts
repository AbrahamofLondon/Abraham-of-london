import { evaluateConstitutionalRoute } from "@/lib/constitution/rules";
import { getDynamicThreshold } from "@/lib/security/dynamic-threshold";
import type { ArbitrationResult, EngineContext, WeightedSignalResult } from "@/lib/engine/types";

export function arbitrateConstitutionalRoute(
  weighted: WeightedSignalResult,
  context: EngineContext,
): ArbitrationResult {
  const strategyThreshold = getDynamicThreshold(65, `${context.sessionContext}:strategy`);
  const diagnosticThreshold = getDynamicThreshold(35, `${context.sessionContext}:diagnostic`);

  const internalDecision = evaluateConstitutionalRoute({
    ...weighted.constitutionalInput,
    clarityScore: Math.round(
      Math.min(
        100,
        Math.max(
          0,
          weighted.constitutionalInput.clarityScore +
            (weighted.constitutionalInput.clarityScore >= strategyThreshold ? 2 : 0) -
            (weighted.constitutionalInput.clarityScore < diagnosticThreshold ? 2 : 0),
        ),
      ),
    ),
    operatorKey: `${weighted.constitutionalInput.operatorKey}:${context.sessionContext}`,
  });

  return {
    internalDecision,
    clientDecision: {
      route: internalDecision.route,
      confidence: internalDecision.confidence,
      disqualifiersTriggered: internalDecision.disqualifiersTriggered.slice(0, 4),
      recommendedInterventions: internalDecision.recommendedInterventions.slice(0, 5),
      rationale: internalDecision.rationale.slice(0, 4),
      escalationAllowed: internalDecision.escalationAllowed,
    },
  };
}

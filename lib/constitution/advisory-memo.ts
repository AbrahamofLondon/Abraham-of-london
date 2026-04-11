import type { ConstitutionalDecision } from "./rules";
import type { AdvisoryMemo } from "./advisory-types";
import { selectNextAction } from "./next-action";
import { buildAdvisoryRecommendations } from "./advisory-recommendations";
import { governEscalation } from "./escalation-governor";

export function composeAdvisoryMemo(input: {
  decision: ConstitutionalDecision;
  synthesis: string;
  trajectory: string;
  seriousness: number;
  readinessScore: number;
  authority: string;
  risks: string[];
}): AdvisoryMemo {
  const escalation = governEscalation(input.decision);

  const next = selectNextAction({
    decision: input.decision,
    readinessScore: input.readinessScore,
    trajectory: input.trajectory,
    seriousness: input.seriousness,
  });

  const recommendations = buildAdvisoryRecommendations({
    route: input.decision.route,
    authority: input.authority,
    readinessScore: input.readinessScore,
    trajectory: input.trajectory,
    risks: input.risks,
  });

  const warnings = [
    ...input.decision.disqualifiersTriggered,
    ...input.risks,
  ].filter(Boolean);

  return {
    route: input.decision.route,
    posture: input.synthesis,
    advisoryPosition:
      input.decision.route === "STRATEGY"
        ? "This case qualifies for strategy-grade handling, but escalation must remain governed."
        : input.decision.route === "DIAGNOSTIC"
          ? "This case is real, but interpretation and containment must precede escalation."
          : "This case should not be escalated in its current form.",
    immediateInstruction: next.reason,
    recommendations,
    escalationPermitted: escalation.permitted,
    escalationReason: escalation.reason,
    warnings,
  };
}
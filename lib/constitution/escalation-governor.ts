import type { ConstitutionalDecision } from "./rules";

export function governEscalation(decision: ConstitutionalDecision): {
  permitted: boolean;
  reason: string;
} {
  if (decision.route !== "STRATEGY") {
    return {
      permitted: false,
      reason: "Escalation denied because the constitutional route is not STRATEGY.",
    };
  }

  if (!decision.escalationAllowed) {
    return {
      permitted: false,
      reason: "Escalation denied because constitutional safeguards blocked promotion.",
    };
  }

  if (decision.confidence < 0.55) {
    return {
      permitted: false,
      reason: "Escalation denied because confidence remains below safe strategic floor.",
    };
  }

  if (decision.disqualifiersTriggered.length > 0) {
    return {
      permitted: false,
      reason: "Escalation denied because active constitutional disqualifiers remain present.",
    };
  }

  return {
    permitted: true,
    reason: "Escalation constitutionally permitted.",
  };
}
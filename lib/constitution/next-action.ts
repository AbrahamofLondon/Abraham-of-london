import type { ConstitutionalDecision } from "./rules";
import type { AdvisoryActionType } from "./advisory-types";

export function selectNextAction(input: {
  decision: ConstitutionalDecision;
  readinessScore: number;
  trajectory: string;
  seriousness: number;
}): {
  action: AdvisoryActionType;
  reason: string;
} {
  const { decision, readinessScore, trajectory, seriousness } = input;

  if (decision.route === "REJECT") {
    return {
      action: "REJECT",
      reason: "The signal is constitutionally insufficient for governed escalation.",
    };
  }

  if (decision.route === "DIAGNOSTIC") {
    if (trajectory === "DETERIORATING") {
      return {
        action: "STABILISE",
        reason: "The system is worsening. Stabilisation must precede escalation.",
      };
    }

    return {
      action: "DIAGNOSE",
      reason: "The matter is real, but interpretation is still incomplete.",
    };
  }

  if (decision.route === "STRATEGY") {
    if (readinessScore < 70) {
      return {
        action: "STABILISE",
        reason: "Escalation is constitutionally available, but execution readiness remains suboptimal.",
      };
    }

    if (seriousness >= 80) {
      return {
        action: "INTERVENE",
        reason: "The signal is decision-grade and the consequence weight justifies active intervention.",
      };
    }

    return {
      action: "ESCALATE",
      reason: "The case qualifies for premium strategic escalation.",
    };
  }

  return {
    action: "HOLD",
    reason: "No governed next action could be determined.",
  };
}
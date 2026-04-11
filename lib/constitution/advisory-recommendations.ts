import type {
  AdvisoryRecommendation,
  AdvisoryPriority,
} from "./advisory-types";

function makeRecommendation(
  id: string,
  title: string,
  rationale: string,
  priority: AdvisoryPriority,
  owner: string,
  horizon: AdvisoryRecommendation["horizon"],
  actionType: AdvisoryRecommendation["actionType"],
): AdvisoryRecommendation {
  return {
    id,
    title,
    rationale,
    priority,
    owner,
    horizon,
    actionType,
  };
}

export function buildAdvisoryRecommendations(input: {
  route: "REJECT" | "DIAGNOSTIC" | "STRATEGY";
  authority: string;
  readinessScore: number;
  trajectory: string;
  risks: string[];
}): AdvisoryRecommendation[] {
  const recommendations: AdvisoryRecommendation[] = [];

  if (input.route === "REJECT") {
    recommendations.push(
      makeRecommendation(
        "rebuild-signal",
        "Rebuild the signal before escalation",
        "The current case lacks sufficient constitutional strength for premium escalation.",
        "HIGH",
        "Sponsor",
        "NOW",
        "REJECT",
      ),
    );

    recommendations.push(
      makeRecommendation(
        "clarify-problem",
        "Clarify the real problem statement",
        "Weak cases usually fail because the actual issue has not been named properly.",
        "HIGH",
        "Sponsor",
        "NEXT_7_DAYS",
        "DIAGNOSE",
      ),
    );

    return recommendations;
  }

  if (input.route === "DIAGNOSTIC") {
    recommendations.push(
      makeRecommendation(
        "diagnostic-pass",
        "Run full diagnostic interpretation",
        "The case is credible but still needs disciplined reading before escalation.",
        "HIGH",
        "Leadership",
        "NOW",
        "DIAGNOSE",
      ),
    );

    if (input.trajectory === "DETERIORATING") {
      recommendations.push(
        makeRecommendation(
          "stabilise-friction",
          "Contain immediate structural deterioration",
          "A worsening system should not be allowed to degrade while interpretation is underway.",
          "CRITICAL",
          "Operating Lead",
          "NOW",
          "STABILISE",
        ),
      );
    }

    if (input.authority !== "DIRECT") {
      recommendations.push(
        makeRecommendation(
          "secure-authority",
          "Confirm decision authority and mandate",
          "Proxy or unclear authority weakens safe escalation and slows execution.",
          "HIGH",
          "Sponsor",
          "NEXT_7_DAYS",
          "DIAGNOSE",
        ),
      );
    }

    return recommendations;
  }

  recommendations.push(
    makeRecommendation(
      "escalate-path",
      "Escalate into strategy-grade handling",
      "The case has crossed the constitutional threshold for premium escalation.",
      "CRITICAL",
      "Principal",
      "NOW",
      "ESCALATE",
    ),
  );

  if (input.readinessScore < 75) {
    recommendations.push(
      makeRecommendation(
        "tighten-execution",
        "Tighten execution posture before scale",
        "Escalation is justified, but execution discipline still needs reinforcement.",
        "HIGH",
        "COO / Sponsor",
        "NEXT_7_DAYS",
        "STABILISE",
      ),
    );
  }

  if (input.risks.length > 0) {
    recommendations.push(
      makeRecommendation(
        "risk-containment",
        "Contain principal risk before broader movement",
        "The system has surfaced active risk factors that should not be ignored during escalation.",
        "HIGH",
        "Leadership",
        "NOW",
        "INTERVENE",
      ),
    );
  }

  return recommendations;
}
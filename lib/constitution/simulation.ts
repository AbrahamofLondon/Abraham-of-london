export type DecisionRisk = {
  summary: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

export function simulateDecisionRisk(input: {
  trajectory: string;
  readiness: number;
  authority: string;
}): DecisionRisk[] {
  const risks: DecisionRisk[] = [];

  if (input.trajectory === "DETERIORATING") {
    risks.push({
      summary: "System likely to worsen without structural correction",
      severity: "HIGH",
    });
  }

  if (input.authority !== "DIRECT") {
    risks.push({
      summary: "Execution risk due to lack of decision authority",
      severity: "HIGH",
    });
  }

  if (input.readiness < 50) {
    risks.push({
      summary: "Premature escalation likely to fail",
      severity: "MEDIUM",
    });
  }

  return risks;
}
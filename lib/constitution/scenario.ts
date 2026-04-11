export type Scenario = {
  path: string;
  outcome: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

export function buildScenarios(input: {
  readiness: number;
  authority: string;
  trajectory: string;
}): Scenario[] {
  const scenarios: Scenario[] = [];

  // Proceed immediately
  scenarios.push({
    path: "Proceed immediately",
    outcome:
      input.readiness < 60
        ? "Execution strain likely. Strategy collapses under weak structure."
        : "Execution possible with controlled risk.",
    riskLevel: input.readiness < 60 ? "HIGH" : "MEDIUM",
  });

  // Delay and stabilise
  scenarios.push({
    path: "Stabilise before action",
    outcome:
      input.trajectory === "DETERIORATING"
        ? "Prevents further decline but delays opportunity."
        : "Improves execution probability.",
    riskLevel: "LOW",
  });

  // Delegate / partial move
  scenarios.push({
    path: "Partial execution with constraints",
    outcome:
      input.authority !== "DIRECT"
        ? "Fragmentation risk increases."
        : "Controlled progress with moderate exposure.",
    riskLevel: "MEDIUM",
  });

  return scenarios;
}
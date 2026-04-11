import { listCaseMemories, patchCaseMemory } from "./memory-store";
import { createIntervention } from "./intervention-store";

export function runRouteCorrectionSweep() {
  const cases = listCaseMemories();

  for (const c of cases) {
    const weakStrategy =
      c.latestRoute === "STRATEGY" &&
      (c.latestConfidence < 0.55 || c.latestReadinessScore < 50);

    const strongDiagnostic =
      c.latestRoute === "DIAGNOSTIC" &&
      c.latestConfidence > 0.8 &&
      c.latestSeriousness > 80;

    if (weakStrategy) {
      patchCaseMemory(c.caseKey, {
        latestRoute: "DIAGNOSTIC",
      });

      createIntervention({
        title: "Forced downgrade to diagnostic",
        description: "Strategy classification did not meet constitutional thresholds.",
        source: "AUTO_ROUTE_CORRECTION",
        actionType: "DOWNGRADE_TO_DIAGNOSTIC",
        priority: "HIGH",
        caseKey: c.caseKey,
        operatorKey: c.operatorKey,
      });
    }

    if (strongDiagnostic) {
      createIntervention({
        title: "Eligible for strategy escalation",
        description: "Signal now meets threshold for strategic escalation.",
        source: "AUTO_ROUTE_CORRECTION",
        actionType: "ESCALATE_TO_STRATEGY",
        priority: "MEDIUM",
        caseKey: c.caseKey,
        operatorKey: c.operatorKey,
      });
    }
  }
}
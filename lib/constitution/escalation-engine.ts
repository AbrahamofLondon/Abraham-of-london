import { listOpenInterventions } from "./intervention-store";
import { getCaseMemory } from "./memory-store";
import { createStrategySession } from "@/lib/strategy-room/session-service";

export function runAutoEscalationSweep() {
  const interventions = listOpenInterventions();

  for (const i of interventions) {
    if (!i.caseKey) continue;

    const isEscalationType =
      i.actionType === "ESCALATE_TO_STRATEGY" ||
      i.priority === "CRITICAL";

    if (!isEscalationType) continue;

    const caseMemory = getCaseMemory(i.caseKey);
    if (!caseMemory) continue;

    // Prevent duplicate escalation
    if (caseMemory.latestRoute === "STRATEGY") continue;

    // Hard override condition
    const forceEscalate =
      caseMemory.latestSeriousness > 75 &&
      caseMemory.latestConfidence > 0.6;

    if (!forceEscalate) continue;

    // 🔥 Create Strategy Room session automatically
    createStrategySession({
      caseKey: i.caseKey,
      operatorKey: caseMemory.operatorKey,
      source: "AUTO_ESCALATION",
      trigger: i.id,
    });
  }
}
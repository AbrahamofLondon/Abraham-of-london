import { listCaseMemories } from "./memory-store";

export function getOperatorMemory(operatorKey: string) {
  const cases = listCaseMemories().filter((x) => x.operatorKey === operatorKey);

  const repeatedRejections = cases.filter((x) => x.latestRoute === "REJECT").length;
  const repeatedDiagnostics = cases.filter((x) => x.latestRoute === "DIAGNOSTIC").length;
  const priorEscalations = cases.filter((x) => x.latestRoute === "STRATEGY").length;

  return {
    totalCases: cases.length,
    repeatedRejections,
    repeatedDiagnostics,
    priorEscalations,
    operatorPattern:
      priorEscalations > 0
        ? "PRIOR_ESCALATION_HISTORY"
        : repeatedRejections >= 3
          ? "REPEATED_WEAK_SIGNAL"
          : repeatedDiagnostics >= 2
            ? "DEVELOPING_BUT_UNREADY"
            : "NO_SIGNIFICANT_HISTORY",
  };
}
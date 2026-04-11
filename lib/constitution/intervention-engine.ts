import { listTribunalCases } from "./observability-store";
import { createIntervention } from "./intervention-store";

export function convertTribunalsToInterventions() {
  const tribunals = listTribunalCases();

  for (const tribunal of tribunals) {
    if (tribunal.status !== "OPEN") continue;

    for (const finding of tribunal.findings) {
      if (finding.severity !== "CRITICAL" && finding.severity !== "BREACH") continue;

      createIntervention({
        title: `Tribunal action: ${finding.title}`,
        description: finding.description || "Critical constitutional issue identified.",
        source: "TRIBUNAL",
        actionType: "ROUTE_CORRECTION",
        priority: finding.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
        caseKey: finding.caseKey,
        operatorKey: finding.operatorKey,
        assignedTo: "SYSTEM",
        dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          tribunalId: tribunal.id,
          findingId: finding.id,
        },
      });
    }
  }
}
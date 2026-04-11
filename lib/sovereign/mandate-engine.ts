import { listOpenInterventions } from "@/lib/constitution/intervention-store";
import { createMandate } from "./mandate-store";

export function convertInterventionsToMandates() {
  const interventions = listOpenInterventions();

  for (const i of interventions) {
    const isExecutionGrade =
      i.priority === "CRITICAL" ||
      i.actionType === "ESCALATE_TO_STRATEGY";

    if (!isExecutionGrade || !i.caseKey) continue;

    createMandate({
      caseKey: i.caseKey,
      operatorKey: i.operatorKey,
      source: "AUTO_ESCALATION",
      title: `Execution mandate: ${i.title}`,
      description: i.description,

      commercial: {
        feeModel: "FIXED",
        value: 15000, // configurable later
        currency: "GBP",
      },

      execution: {
        milestones: [
          { title: "Initial assessment", completed: false },
          { title: "Strategic intervention", completed: false },
          { title: "Execution stabilisation", completed: false },
        ],
      },
    });
  }
}
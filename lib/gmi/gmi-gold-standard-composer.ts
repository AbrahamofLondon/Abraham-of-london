export interface GmiGoldStandardInput {
  edition: string;
  publicationContext: string;
  status: "current" | "archived" | "future";
  materialCalls: string[];
  analysisBasis: string[];
}

export interface GmiGoldStandardOutput {
  edition: string;
  publicationContext: string;
  currentVsArchivedStatus: string;
  materialCalls: string[];
  basisOfAnalysis: string[];
  confidenceLevel: "low" | "medium" | "high";
  riskToThesis: string;
  whatChangedSincePriorPeriod: string;
  whatRemainsUsefulToday: string;
  customerUseGuidance: string;
  priorCallVerification: string;
}

export function composeGmiGoldStandard(input: GmiGoldStandardInput): GmiGoldStandardOutput {
  return {
    edition: input.edition,
    publicationContext: input.publicationContext,
    currentVsArchivedStatus: input.status === "archived"
      ? "Archived intelligence: use as dated strategic context, not current advice."
      : input.status === "future"
        ? "Future intelligence: blocked until publication package and material-call trace exist."
        : "Current intelligence: material calls must remain traceable and time-bound.",
    materialCalls: input.materialCalls,
    basisOfAnalysis: input.analysisBasis,
    confidenceLevel: input.analysisBasis.length >= 3 ? "high" : "medium",
    riskToThesis: "The thesis weakens if material calls lose traceability or prior-period movement contradicts the stated direction.",
    whatChangedSincePriorPeriod: "Requires prior-period comparison before release.",
    whatRemainsUsefulToday: "Requires explicit separation between dated observation and reusable strategic context.",
    customerUseGuidance: "Use the report to frame strategic questions, not as a live trading or investment instruction.",
    priorCallVerification: "Prior calls must be verified where applicable before gold release.",
  };
}

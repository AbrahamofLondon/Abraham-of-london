export interface GoldStandardReportInput {
  productCode: string;
  inputBasis: string[];
  evidenceBasis: string[];
  diagnosticInterpretation: string;
  confidenceLevel: "low" | "medium" | "high";
}

export interface GoldStandardReportOutput {
  productCode: string;
  inputBasis: string[];
  diagnosticInterpretation: string;
  confidenceLevel: "low" | "medium" | "high";
  evidenceBasis: string[];
  riskOrConsequence: string;
  recommendation: string;
  falsificationNote: string;
  nextAction: string;
  limitations: string;
}

export function composeGoldStandardReport(input: GoldStandardReportInput): GoldStandardReportOutput {
  return {
    productCode: input.productCode,
    inputBasis: input.inputBasis,
    diagnosticInterpretation: input.diagnosticInterpretation,
    confidenceLevel: input.confidenceLevel,
    evidenceBasis: input.evidenceBasis,
    riskOrConsequence: "The report must connect the diagnosis to an operational, commercial, or governance consequence.",
    recommendation: "Take the smallest action that tests the diagnosis and produces new evidence.",
    falsificationNote: "This conclusion changes if the evidence base contradicts the stated diagnosis or reveals a stronger constraint.",
    nextAction: "Assign an owner, confirm the evidence gap, and set a review checkpoint.",
    limitations: "This report is not gold-standard without customer context, evidence trace, confidence, and limitations.",
  };
}

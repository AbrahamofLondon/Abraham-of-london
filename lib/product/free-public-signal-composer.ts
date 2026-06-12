export interface FreePublicSignalInput {
  productCode: string;
  customerContext: string;
  observedSignal: string;
  decisionPressure?: string;
}

export interface FreePublicSignalOutput {
  productCode: string;
  signalOrDiagnosis: string;
  whyItMatters: string;
  specificNextAction: string;
  whatThisDoesNotProve: string;
  deeperHelpRoute: string;
  timeRespectCheck: {
    expectedMinutes: number;
    passes: boolean;
  };
}

export function composeFreePublicSignal(input: FreePublicSignalInput): FreePublicSignalOutput {
  return {
    productCode: input.productCode,
    signalOrDiagnosis: input.observedSignal,
    whyItMatters: input.decisionPressure
      ? `This matters because the decision pressure is ${input.decisionPressure}.`
      : "This matters because unresolved decision friction compounds into delay, weak sequencing, or avoidable rework.",
    specificNextAction: "Name the decision owner, the next irreversible choice, and the evidence needed before the next move.",
    whatThisDoesNotProve: "This signal does not prove root cause, commercial exposure, or the correct intervention without fuller context.",
    deeperHelpRoute: "The user may continue into a governed diagnostic or premium review, but the free result must stand on its own.",
    timeRespectCheck: {
      expectedMinutes: 5,
      passes: input.customerContext.trim().length > 0 && input.observedSignal.trim().length > 0,
    },
  };
}
